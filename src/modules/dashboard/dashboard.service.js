const Order = require('../orders/order.model');
const Product = require('../products/products.model');
const Customer = require('../customers/customers.model');

class DashboardService {
  async getBusinessMetrics() {
    const today = new Date();
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Revenue metrics
    const revenueMetrics = await Order.aggregate([
      {
        $match: {
          status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: "$total" }
        }
      }
    ]);
    
    // Last 30 days revenue
    const last30DaysRevenue = await Order.aggregate([
      {
        $match: {
          status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          createdAt: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          orders: { $sum: 1 }
        }
      }
    ]);
    
    // Last 7 days revenue for comparison
    const last7DaysRevenue = await Order.aggregate([
      {
        $match: {
          status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          createdAt: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          orders: { $sum: 1 }
        }
      }
    ]);
    
    // Customer metrics
    const customerMetrics = await Customer.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          last30Days: [
            { $match: { createdAt: { $gte: last30Days } } },
            { $count: "count" }
          ],
          last7Days: [
            { $match: { createdAt: { $gte: last7Days } } },
            { $count: "count" }
          ]
        }
      }
    ]);
    
    const total = revenueMetrics[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
    const last30 = last30DaysRevenue[0] || { revenue: 0, orders: 0 };
    const last7 = last7DaysRevenue[0] || { revenue: 0, orders: 0 };
    const customers = customerMetrics[0];
    
    return {
      revenue: {
        total: Math.round(total.totalRevenue * 100) / 100,
        last30Days: Math.round(last30.revenue * 100) / 100,
        last7Days: Math.round(last7.revenue * 100) / 100,
        growth30Days: last30.revenue > 0 ? 
          Math.round(((last30.revenue / (total.totalRevenue - last30.revenue)) * 100) * 100) / 100 : 0
      },
      orders: {
        total: total.totalOrders,
        last30Days: last30.orders,
        last7Days: last7.orders,
        avgOrderValue: Math.round(total.avgOrderValue * 100) / 100
      },
      customers: {
        total: customers.total[0]?.count || 0,
        last30Days: customers.last30Days[0]?.count || 0,
        last7Days: customers.last7Days[0]?.count || 0
      }
    };
  }

  async getPerformanceMetrics() {
    // Simulated performance metrics (in a real app, you'd collect these from monitoring systems)
    const metrics = {
      apiLatency: {
        avg: Math.round((Math.random() * 100 + 50) * 100) / 100, // 50-150ms
        p95: Math.round((Math.random() * 200 + 100) * 100) / 100, // 100-300ms
        p99: Math.round((Math.random() * 500 + 200) * 100) / 100  // 200-700ms
      },
      sseConnections: {
        active: Math.floor(Math.random() * 100) + 10, // 10-110 connections
        peak24h: Math.floor(Math.random() * 200) + 50, // 50-250 connections
        avgDuration: Math.round((Math.random() * 300 + 60) * 100) / 100 // 1-6 minutes
      },
      database: {
        connectionsActive: Math.floor(Math.random() * 20) + 5, // 5-25 connections
        connectionsMax: 50,
        queryAvgTime: Math.round((Math.random() * 50 + 10) * 100) / 100, // 10-60ms
        slowQueries24h: Math.floor(Math.random() * 10) // 0-10 slow queries
      },
      server: {
        uptime: Math.floor(Math.random() * 168) + 24, // 24-192 hours
        memoryUsage: Math.round((Math.random() * 30 + 40) * 100) / 100, // 40-70%
        cpuUsage: Math.round((Math.random() * 40 + 20) * 100) / 100 // 20-60%
      }
    };
    
    return metrics;
  }

  async getAssistantStats() {
    // Simulated AI assistant statistics (in a real app, you'd collect these from your AI service)
    const intents = ['product_search', 'order_status', 'customer_support', 'recommendations', 'complaints'];
    const functions = ['searchProducts', 'getOrderDetails', 'createTicket', 'getRecommendations', 'processRefund'];
    
    const intentDistribution = intents.reduce((acc, intent) => {
      acc[intent] = Math.floor(Math.random() * 100) + 10;
      return acc;
    }, {});
    
    const functionCalls = functions.reduce((acc, func) => {
      acc[func] = {
        total: Math.floor(Math.random() * 500) + 50,
        success: Math.floor(Math.random() * 90) + 85, // 85-95% success rate
        avgResponseTime: Math.round((Math.random() * 2000 + 500) * 100) / 100 // 500-2500ms
      };
      return acc;
    }, {});
    
    return {
      totalInteractions: Math.floor(Math.random() * 1000) + 500,
      intentDistribution,
      functionCalls,
      satisfaction: {
        rating: Math.round((Math.random() * 1 + 4) * 100) / 100, // 4.0-5.0
        totalRatings: Math.floor(Math.random() * 200) + 100
      },
      responseTime: {
        avg: Math.round((Math.random() * 1000 + 500) * 100) / 100, // 500-1500ms
        p95: Math.round((Math.random() * 2000 + 1000) * 100) / 100 // 1000-3000ms
      }
    };
  }

  async getRecentActivity() {
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'name email')
      .select('total status createdAt customerId');
    
    // Get new customers
    const newCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');
    
    // Get low stock products
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .sort({ stock: 1 })
      .limit(5)
      .select('name stock category');
    
    return {
      recentOrders: recentOrders.map(order => ({
        id: order._id,
        customerName: order.customerId?.name || 'Unknown',
        customerEmail: order.customerId?.email || 'Unknown',
        total: order.total,
        status: order.status,
        createdAt: order.createdAt
      })),
      newCustomers: newCustomers.map(customer => ({
        id: customer._id,
        name: customer.name,
        email: customer.email,
        createdAt: customer.createdAt
      })),
      lowStockProducts: lowStockProducts.map(product => ({
        id: product._id,
        name: product.name,
        stock: product.stock,
        category: product.category
      }))
    };
  }
}

module.exports = new DashboardService();