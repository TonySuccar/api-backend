const analyticsService = require('./analytics.service');

class AnalyticsController {
  /**
   * GET /api/analytics/daily-revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
   * Returns daily revenue data using native database aggregation
   */
  async getDailyRevenue(req, res) {
    try {
      const { from, to } = req.query;
      
      if (!from || !to) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required parameters',
          message: 'Both from and to date parameters are required (YYYY-MM-DD format)' 
        });
      }
      
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(from) || !dateRegex.test(to)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid date format',
          message: 'Use YYYY-MM-DD format for dates' 
        });
      }
      
      const revenue = await analyticsService.getDailyRevenue(from, to);
      
      res.json({
        success: true,
        data: revenue,
        period: { from, to },
        count: revenue.length
      });
    } catch (error) {
      console.error('Error in getDailyRevenue:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch daily revenue', 
        message: error.message 
      });
    }
  }

  /**
   * GET /api/analytics/dashboard-metrics (DEPRECATED)
   * This endpoint has been moved to /api/dashboard/business-metrics
   */
  async getDashboardMetrics(req, res) {
    return res.status(410).json({
      success: false,
      error: 'Endpoint moved',
      message: 'This endpoint has been moved to /api/dashboard/business-metrics',
      redirectTo: '/api/dashboard/business-metrics'
    });
  }

  /**
   * GET /api/analytics/order-status
   * Returns order status distribution
   */
  async getOrderStatusDistribution(req, res) {
    try {
      const distribution = await analyticsService.getOrderStatusDistribution();
      
      res.json({
        success: true,
        data: distribution
      });
    } catch (error) {
      console.error('Error in getOrderStatusDistribution:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch order status distribution', 
        message: error.message 
      });
    }
  }

  /**
   * GET /api/analytics/revenue-by-category?days=30
   * Returns revenue breakdown by product category
   */
  async getRevenueByCategory(req, res) {
    try {
      const { days = 30 } = req.query;
      const parsedDays = parseInt(days);
      
      if (isNaN(parsedDays) || parsedDays < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid days parameter',
          message: 'Days must be a positive integer'
        });
      }
      
      const revenue = await analyticsService.getRevenueByCategory(parsedDays);
      
      res.json({
        success: true,
        data: revenue,
        period: `${parsedDays} days`,
        count: revenue.length
      });
    } catch (error) {
      console.error('Error in getRevenueByCategory:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch revenue by category', 
        message: error.message 
      });
    }
  }

  /**
   * GET /api/analytics/top-products?days=30&limit=10
   * Returns top selling products
   */
  async getTopSellingProducts(req, res) {
    try {
      const { days = 30, limit = 10 } = req.query;
      const parsedDays = parseInt(days);
      const parsedLimit = parseInt(limit);
      
      if (isNaN(parsedDays) || parsedDays < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid days parameter',
          message: 'Days must be a positive integer'
        });
      }
      
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid limit parameter',
          message: 'Limit must be a positive integer between 1 and 100'
        });
      }
      
      const products = await analyticsService.getTopSellingProducts(parsedDays, parsedLimit);
      
      res.json({
        success: true,
        data: products,
        period: `${parsedDays} days`,
        count: products.length
      });
    } catch (error) {
      console.error('Error in getTopSellingProducts:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch top selling products', 
        message: error.message 
      });
    }
  }

  /**
   * GET /api/analytics/customer-analytics?days=30
   * Returns customer analytics data
   */
  async getCustomerAnalytics(req, res) {
    try {
      const { days = 30 } = req.query;
      const parsedDays = parseInt(days);
      
      if (isNaN(parsedDays) || parsedDays < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid days parameter',
          message: 'Days must be a positive integer'
        });
      }
      
      const analytics = await analyticsService.getCustomerAnalytics(parsedDays);
      
      res.json({
        success: true,
        data: analytics,
        period: `${parsedDays} days`
      });
    } catch (error) {
      console.error('Error in getCustomerAnalytics:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch customer analytics', 
        message: error.message 
      });
    }
  }
}

module.exports = new AnalyticsController();