const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');
const { createOrderLimiter } = require('../../middlewares/rateLimiter');

// POST /api/orders - Create new order (with rate limiting)
router.post('/', createOrderLimiter, ordersController.createOrder.bind(ordersController));

// GET /api/orders/:id/stream - Stream order status updates
router.get('/:id/stream', ordersController.streamOrderStatus.bind(ordersController));

// GET /api/orders/:id - Get order by ID
router.get('/:id', ordersController.getOrderById.bind(ordersController));

// GET /api/orders?customerId=:customerId - Get orders (with optional customer filter)
router.get('/', ordersController.getOrders.bind(ordersController));

module.exports = router;