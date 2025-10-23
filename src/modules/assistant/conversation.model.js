const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  question: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    required: true,
  },
  intent: {
    type: String,
    required: true,
    enum: ['policy_question', 'order_status', 'product_search', 'complaint', 'chitchat', 'off_topic', 'violation', 'unknown'],
  },
  accuracy: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  llmUsed: {
    type: Boolean,
    default: false,
  },
  citations: [{
    type: String,
  }],
  functionsCalled: [{
    type: String,
  }],
  piiDetected: {
    type: Boolean,
    default: false,
  },
  piiTypes: [{
    type: String,
  }],
  processingTime: {
    type: Number, // in milliseconds
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
conversationSchema.index({ userId: 1, timestamp: -1 });
conversationSchema.index({ intent: 1 });
conversationSchema.index({ timestamp: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
