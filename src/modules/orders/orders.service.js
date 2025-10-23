const { isValidObjectId } = require('mongoose');
const Order = require('./order.model');
const Product = require('../products/products.model');
const Customer = require('../customers/customers.model');
const { ORDER_ID_RE, generateOrderId, normalizeOrderId } = require('./order.utils');
const { startOrderSimulation } = require('./order.simulator');

const ORDER_STATUS_SEQUENCE = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

function buildOrderLookup(identifier) {
  if (!identifier) return null;
  const raw = String(identifier).trim();
  if (!raw) return null;

  const normalized = normalizeOrderId(raw);
  if (ORDER_ID_RE.test(normalized)) {
    return { orderId: normalized };
  }

  if (isValidObjectId(raw)) {
    return { _id: raw };
  }

  return null;
}

class OrdersService {
  async createOrder(orderData) {
    const { customerId, items } = orderData;
    
    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    // Validate products and calculate total
    let total = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }
      
      const itemTotal = product.price * item.quantity;
      total += itemTotal;
      
      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });
      
      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }
    
    // Create order
    const order = new Order({
      orderId: generateOrderId(),
      customerId,
      items: orderItems,
      total,
      status: 'PENDING'
    });
    
    const savedOrder = await order.save();

    startOrderSimulation(this, savedOrder);

    return savedOrder;
  }

  async getOrderById(identifier) {
    const lookup = buildOrderLookup(identifier);
    if (!lookup) {
      return null;
    }

    return await Order.findOne(lookup)
      .populate('customerId', 'name email')
      .populate('items.productId', 'name category');
  }

  async getOrders({ customerId, page = 1, limit = 10 } = {}) {
    const filter = {};
    const sanitizedCustomerId = customerId ? String(customerId).trim() : '';

    if (sanitizedCustomerId) {
      if (!isValidObjectId(sanitizedCustomerId)) {
        throw new Error('Invalid customerId');
      }
      filter.customerId = sanitizedCustomerId;
    }

    const pageNum = Math.max(Number.parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(Number.parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('customerId', 'name email')
        .populate('items.productId', 'name category'),
      Order.countDocuments(filter)
    ]);

    return {
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  async transitionOrderStatus(identifier, currentStatus, nextStatus, extraUpdates = {}) {
    if (!ORDER_STATUS_SEQUENCE.includes(nextStatus)) {
      throw new Error(`Invalid target status: ${nextStatus}`);
    }

    if (currentStatus && !ORDER_STATUS_SEQUENCE.includes(currentStatus)) {
      throw new Error(`Invalid current status: ${currentStatus}`);
    }

    const lookup = buildOrderLookup(identifier);
    if (!lookup) {
      return null;
    }

    const filter = { ...lookup };
    if (currentStatus) {
      filter.status = currentStatus;
    }

    const updatePayload = {
      status: nextStatus,
      updatedAt: new Date(),
      ...(nextStatus === 'DELIVERED' && { deliveredAt: new Date() }) // Set deliveredAt when status is DELIVERED
    };

    if (extraUpdates.carrier !== undefined) {
      updatePayload.carrier = extraUpdates.carrier;
    }
    if (extraUpdates.estimatedDelivery !== undefined) {
      updatePayload.estimatedDelivery = extraUpdates.estimatedDelivery;
    }
    if (extraUpdates.deliveredAt !== undefined) {
      updatePayload.deliveredAt = extraUpdates.deliveredAt;
    }

    const result = await Order.findOneAndUpdate(
      filter,
      updatePayload,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('customerId', 'name email')
      .populate('items.productId', 'name category');

    return result;
  }
}

const ordersService = new OrdersService();
ordersService.ORDER_STATUS_SEQUENCE = ORDER_STATUS_SEQUENCE;

module.exports = ordersService;
