const ordersService = require('./orders.service');
const { startOrderSimulation, statusEmitter } = require('./order.simulator');

class OrdersController {
  async createOrder(req, res) {
    try {
      const allowedFields = new Set(['customerId', 'items']);
      const incomingFields = Object.keys(req.body || {});
      const unsupported = incomingFields.filter((field) => !allowedFields.has(field));

      if (unsupported.length > 0) {
        return res.status(400).json({
          error: `Unsupported fields provided: ${unsupported.join(', ')}`
        });
      }

      const customerId = typeof req.body?.customerId === 'string'
        ? req.body.customerId.trim()
        : '';

      if (!customerId) {
        return res.status(400).json({ error: 'customerId is required' });
      }

      if (!Array.isArray(req.body?.items) || req.body.items.length === 0) {
        return res.status(400).json({ error: 'items must be a non-empty array' });
      }

      const allowedItemFields = new Set(['productId', 'quantity']);

      const sanitizedItems = req.body.items.map((rawItem, index) => {
        if (typeof rawItem !== 'object' || rawItem === null) {
          throw new Error(`items[${index}] must be an object`);
        }

        const itemFields = Object.keys(rawItem);
        const unsupportedItemFields = itemFields.filter((field) => !allowedItemFields.has(field));
        if (unsupportedItemFields.length > 0) {
          throw new Error(`Unsupported fields in items[${index}]: ${unsupportedItemFields.join(', ')}`);
        }

        const productId = rawItem.productId ? String(rawItem.productId).trim() : '';
        if (!productId) {
          throw new Error(`items[${index}].productId is required`);
        }

        const quantityNum = Number(rawItem.quantity);
        if (!Number.isInteger(quantityNum) || quantityNum <= 0) {
          throw new Error(`items[${index}].quantity must be a positive integer`);
        }

        return {
          productId,
          quantity: quantityNum
        };
      });

      const order = await ordersService.createOrder({
        customerId,
        items: sanitizedItems
      });
      res.status(201).json(order);
    } catch (error) {
      if (error.message && error.message.startsWith('Unsupported fields provided')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message && error.message.startsWith('Unsupported fields in items[')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message && error.message.includes('items[')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('not found') || error.message.includes('Insufficient')) {
        return res.status(400).json({ 
          error: error.message 
        });
      }
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: 'Failed to create order', 
        message: error.message 
      });
    }
  }

  async getOrderById(req, res) {
    try {
      const order = await ordersService.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch order', 
        message: error.message 
      });
    }
  }

  async getOrders(req, res) {
    try {
      const { customerId, page = 1, limit = 10 } = req.query;
      
      const result = await ordersService.getOrders({ customerId, page, limit });
      res.json(result);
    } catch (error) {
      if (error.message === 'Invalid customerId') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ 
        error: 'Failed to fetch orders', 
        message: error.message 
      });
    }
  }

  async streamOrderStatus(req, res) {
    const { id } = req.params;
    let cleanup = () => {};
    let active = false;

    try {
      const order = await ordersService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
      }
      res.write('retry: 5000\n\n');

      const buildPayload = (orderDoc) => {
        const orderIdValue = orderDoc.orderId
          ? String(orderDoc.orderId).toUpperCase()
          : String(orderDoc._id);

        return {
          orderId: orderDoc.orderId,
          id: orderIdValue,
          mongoId: orderDoc._id,
          status: orderDoc.status,
          carrier: orderDoc.carrier || null,
          estimatedDelivery: orderDoc.estimatedDelivery
            ? new Date(orderDoc.estimatedDelivery).toISOString()
            : null,
          deliveredAt: orderDoc.deliveredAt
            ? new Date(orderDoc.deliveredAt).toISOString()
            : null,
          updatedAt: orderDoc.updatedAt
            ? orderDoc.updatedAt.toISOString()
            : new Date().toISOString()
        };
      };

      const sendStatusEvent = (orderDoc, eventName = 'status') => {
        const payload = buildPayload(orderDoc);
        res.write(`event: ${eventName}\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      };

      sendStatusEvent(order);

      if (order.status !== 'DELIVERED') {
        startOrderSimulation(ordersService, order);
      } else {
        res.write('event: end\n');
        res.write(`data: ${JSON.stringify(buildPayload(order))}\n\n`);
        res.end();
        return;
      }

      active = true;
      const orderIdKey = order.orderId
        ? String(order.orderId).toUpperCase()
        : String(order._id);

      const keepAliveInterval = setInterval(() => {
        if (!active) return;
        res.write(': keep-alive\n\n');
      }, 15000);

      const handleUpdate = (updatedOrder) => {
        if (!active) return;
        const updatedOrderId = updatedOrder.orderId
          ? String(updatedOrder.orderId).toUpperCase()
          : String(updatedOrder._id);
        if (updatedOrderId !== orderIdKey) {
          return;
        }

        sendStatusEvent(updatedOrder);

        if (updatedOrder.status === 'DELIVERED') {
          res.write('event: end\n');
          res.write(`data: ${JSON.stringify(buildPayload(updatedOrder))}\n\n`);
          cleanup();
          if (!res.writableEnded) {
            res.end();
          }
        }
      };

      statusEmitter.on('order-update', handleUpdate);

      cleanup = () => {
        if (!active) return;
        active = false;
        clearInterval(keepAliveInterval);
        statusEmitter.off('order-update', handleUpdate);
      };

      req.on('close', cleanup);
      req.on('end', cleanup);
      req.on('error', cleanup);
    } catch (error) {
      cleanup();
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: 'Failed to start order stream', 
          message: error.message 
        });
      }
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({ message: 'Unexpected server error.' })}\n\n`);
      if (!res.writableEnded) {
        res.end();
      }
    }
  }
}

module.exports = new OrdersController();
