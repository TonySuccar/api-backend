const { mongoose } = require('../../db');
const { ORDER_ID_RE, generateOrderId, normalizeOrderId } = require('./order.utils');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
}, {
  _id: false,
  strict: 'throw'
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: ORDER_ID_RE
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [orderItemSchema],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
    default: 'PENDING'
  },
  carrier: {
    type: String,
    trim: true
  },
  estimatedDelivery: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  strict: 'throw'
});

// Add indexes for efficient queries
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Update the updatedAt field on save
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (!this.orderId) {
    this.orderId = generateOrderId(this.createdAt || new Date());
  } else {
    this.orderId = normalizeOrderId(this.orderId);
  }
  next();
});

orderSchema.pre('validate', function(next) {
  if (!this.orderId) {
    this.orderId = generateOrderId(this.createdAt || new Date());
  } else {
    this.orderId = normalizeOrderId(this.orderId);
  }
  next();
});

orderSchema.pre('insertMany', function(next, docs) {
  if (!Array.isArray(docs)) return next();
  docs.forEach((doc) => {
    if (!doc.orderId) {
      doc.orderId = generateOrderId(doc.createdAt || new Date());
    } else {
      doc.orderId = normalizeOrderId(doc.orderId);
    }
  });
  next();
});

module.exports = mongoose.model('Order', orderSchema);