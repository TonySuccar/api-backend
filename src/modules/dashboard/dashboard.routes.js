const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');

// GET /api/dashboard/business-metrics - Revenue, orders, avg order value
router.get('/business-metrics', dashboardController.getBusinessMetrics.bind(dashboardController));

// GET /api/dashboard/performance - API latency, SSE connections
router.get('/performance', dashboardController.getPerformanceMetrics.bind(dashboardController));

// GET /api/dashboard/assistant-stats - Intent distribution, function calls
router.get('/assistant-stats', dashboardController.getAssistantStats.bind(dashboardController));

// GET /api/dashboard/recent-activity - Get recent orders, customers, and alerts
router.get('/recent-activity', dashboardController.getRecentActivity.bind(dashboardController));

// GET /api/dashboard/overview - Get combined dashboard data
router.get('/overview', dashboardController.getOverview.bind(dashboardController));

module.exports = router;