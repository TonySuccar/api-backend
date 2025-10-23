const Complaint = require('./complaint.model');

class ComplaintsService {
  /**
   * Create a new complaint
   */
  async createComplaint(data) {
    try {
      const complaint = new Complaint({
        userId: data.userId,
        orderId: data.orderId || null,
        complaint: data.complaint,
        category: data.category || 'general',
        priority: data.priority || 'medium',
        source: data.source || 'web'
      });

      await complaint.save();
      
      return {
        success: true,
        complaint: {
          id: complaint._id,
          userId: complaint.userId,
          orderId: complaint.orderId,
          complaint: complaint.complaint,
          category: complaint.category,
          priority: complaint.priority,
          status: complaint.status,
          createdAt: complaint.createdAt
        }
      };
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error;
    }
  }

  /**
   * Get complaints by user ID
   */
  async getComplaintsByUser(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      
      const query = { userId };
      if (status) {
        query.status = status;
      }

      const complaints = await Complaint.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

      const total = await Complaint.countDocuments(query);

      return {
        success: true,
        complaints,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching complaints:', error);
      throw error;
    }
  }

  /**
   * Get complaint by ID
   */
  async getComplaintById(complaintId) {
    try {
      const complaint = await Complaint.findById(complaintId).lean();
      
      if (!complaint) {
        return { success: false, error: 'Complaint not found' };
      }

      return { success: true, complaint };
    } catch (error) {
      console.error('Error fetching complaint:', error);
      throw error;
    }
  }

  /**
   * Update complaint status
   */
  async updateComplaintStatus(complaintId, status, resolution = null) {
    try {
      const updateData = { status };
      
      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date();
        if (resolution) {
          updateData.resolution = resolution;
        }
      }

      const complaint = await Complaint.findByIdAndUpdate(
        complaintId,
        updateData,
        { new: true }
      ).lean();

      if (!complaint) {
        return { success: false, error: 'Complaint not found' };
      }

      return { success: true, complaint };
    } catch (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }
  }

  /**
   * Get all complaints (admin view)
   */
  async getAllComplaints(filters = {}) {
    try {
      const { page = 1, limit = 20, status, priority, category } = filters;
      
      const query = {};
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;

      const complaints = await Complaint.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

      const total = await Complaint.countDocuments(query);

      return {
        success: true,
        complaints,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching all complaints:', error);
      throw error;
    }
  }

  /**
   * Get complaint statistics
   */
  async getComplaintStats() {
    try {
      const [statusStats, categoryStats, priorityStats] = await Promise.all([
        Complaint.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Complaint.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]),
        Complaint.aggregate([
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ])
      ]);

      return {
        success: true,
        stats: {
          byStatus: statusStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byCategory: categoryStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          byPriority: priorityStats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      };
    } catch (error) {
      console.error('Error fetching complaint stats:', error);
      throw error;
    }
  }
}

module.exports = new ComplaintsService();
