const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');

// GET /api/analytics/daily-revenue?from=YYYY-MM-DD&to=YYYY-MM-DD - Daily revenue data
router.get('/daily-revenue', analyticsController.getDailyRevenue.bind(analyticsController));

// GET /api/analytics/dashboard-metrics - Dashboard overview metrics
router.get('/dashboard-metrics', analyticsController.getDashboardMetrics.bind(analyticsController));

// GET /api/analytics/order-status - Get order status distribution
router.get('/order-status', analyticsController.getOrderStatusDistribution.bind(analyticsController));

// GET /api/analytics/revenue-by-category - Get revenue breakdown by product category
router.get('/revenue-by-category', analyticsController.getRevenueByCategory.bind(analyticsController));

module.exports = router;