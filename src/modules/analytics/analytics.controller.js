const analyticsService = require('./analytics.service');

class AnalyticsController {
  async getDailyRevenue(req, res) {
    try {
      const { from, to } = req.query;
      
      if (!from || !to) {
        return res.status(400).json({ 
          error: 'Both from and to date parameters are required (YYYY-MM-DD format)' 
        });
      }
      
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(from) || !dateRegex.test(to)) {
        return res.status(400).json({ 
          error: 'Invalid date format. Use YYYY-MM-DD' 
        });
      }
      
      const revenue = await analyticsService.getDailyRevenue(from, to);
      res.json(revenue);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch daily revenue', 
        message: error.message 
      });
    }
  }

  async getDashboardMetrics(req, res) {
    try {
      const metrics = await analyticsService.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch dashboard metrics', 
        message: error.message 
      });
    }
  }

  async getOrderStatusDistribution(req, res) {
    try {
      const distribution = await analyticsService.getOrderStatusDistribution();
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch order status distribution', 
        message: error.message 
      });
    }
  }

  async getRevenueByCategory(req, res) {
    try {
      const { days = 30 } = req.query;
      const revenue = await analyticsService.getRevenueByCategory(parseInt(days));
      res.json(revenue);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch revenue by category', 
        message: error.message 
      });
    }
  }
}

module.exports = new AnalyticsController();