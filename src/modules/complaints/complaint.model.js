const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: false,
    index: true
  },
  complaint: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['damaged_item', 'wrong_item', 'late_delivery', 'poor_service', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  source: {
    type: String,
    enum: ['ai_assistant', 'web', 'email', 'phone'],
    default: 'web'
  },
  resolution: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: String
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
complaintSchema.index({ userId: 1, createdAt: -1 });
complaintSchema.index({ status: 1, priority: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
