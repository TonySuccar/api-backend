const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');

// Analytics endpoints
// GET /api/analytics/daily-revenue?from=YYYY-MM-DD&to=YYYY-MM-DD - Daily revenue data with native DB aggregation
router.get('/daily-revenue', analyticsController.getDailyRevenue.bind(analyticsController));

// GET /api/analytics/dashboard-metrics - DEPRECATED - moved to /api/dashboard/business-metrics
router.get('/dashboard-metrics', analyticsController.getDashboardMetrics.bind(analyticsController));

// GET /api/analytics/order-status - Get order status distribution
router.get('/order-status', analyticsController.getOrderStatusDistribution.bind(analyticsController));

// GET /api/analytics/revenue-by-category?days=30 - Get revenue breakdown by product category
router.get('/revenue-by-category', analyticsController.getRevenueByCategory.bind(analyticsController));

// GET /api/analytics/top-products?days=30&limit=10 - Get top selling products
router.get('/top-products', analyticsController.getTopSellingProducts.bind(analyticsController));

// GET /api/analytics/customer-analytics?days=30 - Get customer analytics data
router.get('/customer-analytics', analyticsController.getCustomerAnalytics.bind(analyticsController));

module.exports = router;