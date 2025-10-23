const assistantService = require('./assistant.service');
const { logger } = require('../../middlewares/logger');
const Conversation = require('./conversation.model');

class AssistantController {
  async chat(req, res) {
    try {
      const { message, context, userId } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Message is required and must be a non-empty string',
        });
      }

      if (!userId || typeof userId !== 'string' || !userId.trim()) {
        return res.status(400).json({
          success: false,
          error: 'userId is required and must be a non-empty string',
        });
      }

      // Log incoming request (sanitized)
      logger.info('Assistant chat request received', {
        userId,
        messageLength: message.length,
        hasContext: !!context,
        ip: req.ip,
      });

      // Process message
      const result = await assistantService.processMessage(message, context, userId);

      // Determine accuracy based on intent and response quality
      let accuracy = 'medium';
      if (result.intent === 'violation' || result.intent === 'off_topic') {
        accuracy = 'high'; // Fast-path responses are always accurate
      } else if (result.citations && result.citations.length > 0) {
        accuracy = 'high'; // Policy answers with citations are high accuracy
      } else if (result.llmUsed && result.functionsCalled && result.functionsCalled.length > 0) {
        accuracy = 'high'; // Function calls are deterministic
      } else if (result.intent === 'chitchat') {
        accuracy = 'high'; // Chitchat responses are predefined
      } else {
        accuracy = 'medium'; // Default for other LLM responses
      }

      // Save conversation to database
      try {
        const conversation = new Conversation({
          userId: userId.trim(),
          question: message,
          response: result.response,
          intent: result.intent,
          accuracy,
          llmUsed: result.llmUsed,
          citations: result.citations || [],
          functionsCalled: result.functionsCalled || [],
          piiDetected: result.piiDetected,
          piiTypes: result.piiTypes || [],
          processingTime: result.processingTime,
        });
        
        await conversation.save();
        
        logger.info('Conversation saved', {
          userId,
          conversationId: conversation._id,
          intent: result.intent,
          accuracy,
        });
      } catch (dbError) {
        // Log error but don't fail the request
        logger.error('Failed to save conversation', {
          userId,
          error: dbError.message,
        });
      }

      // Log response
      logger.info('Assistant response generated', {
        userId,
        intent: result.intent,
        accuracy,
        llmUsed: result.llmUsed,
        processingTime: result.processingTime,
        piiDetected: result.piiDetected,
        citationsCount: result.citations?.length || 0,
      });

      // Return response with accuracy
      return res.json({
        success: true,
        accuracy,
        ...result,
      });
    } catch (error) {
      logger.error('Assistant chat error', {
        error: error.message,
        stack: error.stack,
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to process message',
        message: error.message,
      });
    }
  }

  async health(req, res) {
    try {
      const llmEndpoint = process.env.LLM_ENDPOINT || 'Not configured';
      
      return res.json({
        status: 'ok',
        service: 'assistant',
        llmEndpoint,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        error: error.message,
      });
    }
  }

  async getUserConversations(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50, page = 1 } = req.query;

      const limitNum = Math.max(Number.parseInt(limit, 10) || 50, 1);
      const pageNum = Math.max(Number.parseInt(page, 10) || 1, 1);
      const skip = (pageNum - 1) * limitNum;

      const [conversations, total] = await Promise.all([
        Conversation.find({ userId })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limitNum)
          .select('-__v'),
        Conversation.countDocuments({ userId })
      ]);

      return res.json({
        success: true,
        userId,
        conversations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      logger.error('Failed to fetch user conversations', {
        userId: req.params.userId,
        error: error.message,
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch conversations',
      });
    }
  }

  async getConversationStats(req, res) {
    try {
      const { userId } = req.params;

      const stats = await Conversation.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalConversations: { $sum: 1 },
            avgProcessingTime: { $avg: '$processingTime' },
            intents: { $push: '$intent' },
            accuracies: { $push: '$accuracy' },
            llmUsedCount: {
              $sum: { $cond: ['$llmUsed', 1, 0] }
            },
            piiDetectedCount: {
              $sum: { $cond: ['$piiDetected', 1, 0] }
            },
          }
        }
      ]);

      if (!stats.length) {
        return res.json({
          success: true,
          userId,
          stats: {
            totalConversations: 0,
            avgProcessingTime: 0,
            intentBreakdown: {},
            accuracyBreakdown: {},
            llmUsedPercentage: 0,
            piiDetectedPercentage: 0,
          }
        });
      }

      const result = stats[0];
      
      // Count intent occurrences
      const intentBreakdown = result.intents.reduce((acc, intent) => {
        acc[intent] = (acc[intent] || 0) + 1;
        return acc;
      }, {});

      // Count accuracy occurrences
      const accuracyBreakdown = result.accuracies.reduce((acc, accuracy) => {
        acc[accuracy] = (acc[accuracy] || 0) + 1;
        return acc;
      }, {});

      return res.json({
        success: true,
        userId,
        stats: {
          totalConversations: result.totalConversations,
          avgProcessingTime: Math.round(result.avgProcessingTime),
          intentBreakdown,
          accuracyBreakdown,
          llmUsedPercentage: Math.round((result.llmUsedCount / result.totalConversations) * 100),
          piiDetectedPercentage: Math.round((result.piiDetectedCount / result.totalConversations) * 100),
        }
      });
    } catch (error) {
      logger.error('Failed to fetch conversation stats', {
        userId: req.params.userId,
        error: error.message,
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch stats',
      });
    }
  }
}

module.exports = new AssistantController();
