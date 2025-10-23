const Order = require('../orders/order.model');
const Product = require('../products/products.model');
const Customer = require('../customers/customers.model');

class AnalyticsService {
  async getDailyRevenue(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999); // Include the entire end date
    
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
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: "$total" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    return dailyRevenue.map(day => ({
      date: day._id,
      revenue: Math.round(day.revenue * 100) / 100,
      orderCount: day.orderCount,
      avgOrderValue: Math.round(day.avgOrderValue * 100) / 100
    }));
  }

  async getDashboardMetrics() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Today's metrics
    const todayOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay },
          status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          orderCount: { $sum: 1 }
        }
      }
    ]);
    
    // Last 30 days metrics
    const last30DaysMetrics = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days },
          status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: "$total" }
        }
      }
    ]);
    
    // Total customers
    const totalCustomers = await Customer.countDocuments();
    
    // New customers this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newCustomers = await Customer.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    
    // Total products
    const totalProducts = await Product.countDocuments();
    
    // Low stock products (stock < 10)
    const lowStockProducts = await Product.countDocuments({
      stock: { $lt: 10 }
    });
    
    // Top selling products
    const topProducts = await Order.aggregate([
      {
        $match: {
          status: { $in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          createdAt: { $gte: last30Days }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);
    
    return {
      today: {
        revenue: todayOrders[0]?.revenue || 0,
        orders: todayOrders[0]?.orderCount || 0
      },
      last30Days: {
        revenue: last30DaysMetrics[0]?.revenue || 0,
        orders: last30DaysMetrics[0]?.orderCount || 0,
        avgOrderValue: last30DaysMetrics[0]?.avgOrderValue || 0
      },
      customers: {
        total: totalCustomers,
        newThisMonth: newCustomers
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts
      },
      topProducts: topProducts.map(product => ({
        name: product.name,
        totalSold: product.totalSold,
        revenue: Math.round(product.revenue * 100) / 100
      }))
    };
  }

  async getOrderStatusDistribution() {
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    return statusDistribution.reduce((acc, status) => {
      acc[status._id] = status.count;
      return acc;
    }, {});
  }

  async getRevenueByCategory(days = 30) {
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
          itemsSold: { $sum: "$items.quantity" }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    return revenueByCategory.map(category => ({
      category: category._id,
      revenue: Math.round(category.revenue * 100) / 100,
      itemsSold: category.itemsSold
    }));
  }
}

module.exports = new AnalyticsService();