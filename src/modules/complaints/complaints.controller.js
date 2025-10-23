const complaintsService = require('./complaints.service');
const { logger } = require('../../middlewares/logger');

class ComplaintsController {
  /**
   * POST /api/complaints - Create new complaint
   */
  async createComplaint(req, res) {
    try {
      const { userId, orderId, complaint, category, priority, source } = req.body;

      // Validation
      if (!userId || !complaint) {
        return res.status(400).json({
          success: false,
          error: 'userId and complaint are required'
        });
      }

      const result = await complaintsService.createComplaint({
        userId,
        orderId,
        complaint,
        category,
        priority,
        source
      });

      logger.info(`Complaint created: ${result.complaint.id} by user ${userId}`);

      return res.status(201).json(result.complaint);
    } catch (error) {
      logger.error('Error in createComplaint:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create complaint'
      });
    }
  }

  /**
   * GET /api/complaints/user/:userId - Get complaints by user
   */
  async getComplaintsByUser(req, res) {
    try {
      const { userId } = req.params;
      const { page, limit, status } = req.query;

      const result = await complaintsService.getComplaintsByUser(userId, {
        page,
        limit,
        status
      });

      return res.json(result);
    } catch (error) {
      logger.error('Error in getComplaintsByUser:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch complaints'
      });
    }
  }

  /**
   * GET /api/complaints/:id - Get complaint by ID
   */
  async getComplaintById(req, res) {
    try {
      const { id } = req.params;

      const result = await complaintsService.getComplaintById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.json(result.complaint);
    } catch (error) {
      logger.error('Error in getComplaintById:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch complaint'
      });
    }
  }

  /**
   * PATCH /api/complaints/:id - Update complaint status
   */
  async updateComplaintStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, resolution } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required'
        });
      }

      const result = await complaintsService.updateComplaintStatus(id, status, resolution);

      if (!result.success) {
        return res.status(404).json(result);
      }

      logger.info(`Complaint ${id} status updated to ${status}`);

      return res.json(result.complaint);
    } catch (error) {
      logger.error('Error in updateComplaintStatus:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update complaint'
      });
    }
  }

  /**
   * GET /api/complaints - Get all complaints (admin)
   */
  async getAllComplaints(req, res) {
    try {
      const { page, limit, status, priority, category } = req.query;

      const result = await complaintsService.getAllComplaints({
        page,
        limit,
        status,
        priority,
        category
      });

      return res.json(result);
    } catch (error) {
      logger.error('Error in getAllComplaints:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch complaints'
      });
    }
  }

  /**
   * GET /api/complaints/stats - Get complaint statistics
   */
  async getComplaintStats(req, res) {
    try {
      const result = await complaintsService.getComplaintStats();
      return res.json(result);
    } catch (error) {
      logger.error('Error in getComplaintStats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch complaint statistics'
      });
    }
  }
}

module.exports = new ComplaintsController();
