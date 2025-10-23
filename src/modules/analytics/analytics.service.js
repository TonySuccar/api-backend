const Order = require('../orders/order.model');
const Product = require('../products/products.model');
const Customer = require('../customers/customers.model');

class AnalyticsService {
  /**
   * Get daily revenue using native MongoDB aggregation
   * @param {string} fromDate - Start date in YYYY-MM-DD format
   * @param {string} toDate - End date in YYYY-MM-DD format
   * @returns {Array} Array of {date, revenue, orderCount}
   */
  async getDailyRevenue(fromDate, toDate) {
    // Validate date inputs
    if (!fromDate || !toDate) {
      throw new Error('Both fromDate and toDate are required');
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    // Validate dates
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    if (from > to) {
      throw new Error('fromDate cannot be later than toDate');
    }

    // Set end time to include entire day
    to.setHours(23, 59, 59, 999);
    
    // MongoDB aggregation pipeline
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          createdAt: { $gte: from, $lte: to }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          revenue: { $sum: "$total" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          revenue: { $round: ["$revenue", 2] },
          orderCount: 1
        }
      }
    ]);
    
    return dailyRevenue;
  }

  /**
   * Get dashboard metrics overview (MOVED TO DASHBOARD MODULE)
   * This method is deprecated - use /api/dashboard/business-metrics instead
   */
  async getDashboardMetrics() {
    throw new Error('This endpoint has been moved to /api/dashboard/business-metrics');
  }

  /**
   * Get order status distribution using MongoDB aggregation
   * @returns {Object} Status distribution object
   */
  async getOrderStatusDistribution() {
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1
        }
      }
    ]);
    
    // Convert to object format
    const result = {};
    statusDistribution.forEach(item => {
      result[item.status] = item.count;
    });
    
    return result;
  }

  /**
   * Get revenue breakdown by product category using MongoDB aggregation
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Array} Array of category revenue data
   */
  async getRevenueByCategory(days = 30) {
    if (!Number.isInteger(days) || days < 1) {
      throw new Error('Days must be a positive integer');
    }

    const dateLimit = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const revenueByCategory = await Order.aggregate([
      {
        $match: {
          status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          createdAt: { $gte: dateLimit }
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          itemsSold: { $sum: "$items.quantity" },
          orderCount: { $addToSet: "$_id" }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          revenue: { $round: ["$revenue", 2] },
          itemsSold: 1,
          orderCount: { $size: "$orderCount" }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    return revenueByCategory;
  }

  /**
   * Get top selling products using MongoDB aggregation
   * @param {number} days - Number of days to look back (default: 30)
   * @param {number} limit - Number of top products to return (default: 10)
   * @returns {Array} Array of top selling products
   */
  async getTopSellingProducts(days = 30, limit = 10) {
    if (!Number.isInteger(days) || days < 1) {
      throw new Error('Days must be a positive integer');
    }
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error('Limit must be a positive integer');
    }

    const dateLimit = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const topProducts = await Order.aggregate([
      {
        $match: {
          status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          createdAt: { $gte: dateLimit }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          orderCount: { $addToSet: "$_id" }
        }
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: 1,
          totalSold: 1,
          revenue: { $round: ["$revenue", 2] },
          orderCount: { $size: "$orderCount" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit }
    ]);
    
    return topProducts;
  }

  /**
   * Get customer analytics using MongoDB aggregation
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Object} Customer analytics data
   */
  async getCustomerAnalytics(days = 30) {
    if (!Number.isInteger(days) || days < 1) {
      throw new Error('Days must be a positive integer');
    }

    const dateLimit = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const customerMetrics = await Order.aggregate([
      {
        $match: {
          status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          createdAt: { $gte: dateLimit }
        }
      },
      {
        $group: {
          _id: "$customerId",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          avgOrderValue: { $avg: "$total" }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          avgOrdersPerCustomer: { $avg: "$orderCount" },
          avgCustomerValue: { $avg: "$totalSpent" },
          totalRevenue: { $sum: "$totalSpent" }
        }
      },
      {
        $project: {
          _id: 0,
          totalCustomers: 1,
          avgOrdersPerCustomer: { $round: ["$avgOrdersPerCustomer", 2] },
          avgCustomerValue: { $round: ["$avgCustomerValue", 2] },
          totalRevenue: { $round: ["$totalRevenue", 2] }
        }
      }
    ]);
    
    return customerMetrics[0] || {
      totalCustomers: 0,
      avgOrdersPerCustomer: 0,
      avgCustomerValue: 0,
      totalRevenue: 0
    };
  }
}

module.exports = new AnalyticsService();