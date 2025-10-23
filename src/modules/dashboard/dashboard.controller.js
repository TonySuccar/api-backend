const dashboardService = require('./dashboard.service');

class DashboardController {
  async getBusinessMetrics(req, res) {
    try {
      const metrics = await dashboardService.getBusinessMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch business metrics', 
        message: error.message 
      });
    }
  }

  async getPerformanceMetrics(req, res) {
    try {
      const metrics = await dashboardService.getPerformanceMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch performance metrics', 
        message: error.message 
      });
    }
  }

  async getAssistantStats(req, res) {
    try {
      const stats = await dashboardService.getAssistantStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch assistant statistics', 
        message: error.message 
      });
    }
  }

  async getRecentActivity(req, res) {
    try {
      const activity = await dashboardService.getRecentActivity();
      res.json(activity);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch recent activity', 
        message: error.message 
      });
    }
  }

  async getOverview(req, res) {
    try {
      // Combine multiple metrics for a dashboard overview
      const [businessMetrics, performance, recentActivity] = await Promise.all([
        dashboardService.getBusinessMetrics(),
        dashboardService.getPerformanceMetrics(),
        dashboardService.getRecentActivity()
      ]);

      res.json({
        business: businessMetrics,
        performance,
        recentActivity
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch dashboard overview', 
        message: error.message 
      });
    }
  }
}

module.exports = new DashboardController();