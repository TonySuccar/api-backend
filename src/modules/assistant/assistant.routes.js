const express = require('express');
const router = express.Router();
const assistantController = require('./assistant.controller');
const { chatLimiter } = require('../../middlewares/rateLimiter');

// POST /api/assistant/chat - Main chat endpoint
router.post('/chat', chatLimiter, assistantController.chat.bind(assistantController));

// GET /api/assistant/health - Health check
router.get('/health', assistantController.health.bind(assistantController));

// GET /api/assistant/users/:userId/conversations - Get user conversation history
router.get('/users/:userId/conversations', assistantController.getUserConversations.bind(assistantController));

// GET /api/assistant/users/:userId/stats - Get user conversation statistics
router.get('/users/:userId/stats', assistantController.getConversationStats.bind(assistantController));

module.exports = router;
