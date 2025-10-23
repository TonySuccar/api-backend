const express = require('express');
const router = express.Router();
const customersController = require('./customers.controller');

// GET /api/customers?email=user@example.com - Look up customer by email
// GET /api/customers - List all customers with pagination
router.get('/', customersController.getCustomers.bind(customersController));

// GET /api/customers/:id - Get customer profile by ID
router.get('/:id', customersController.getCustomerById.bind(customersController));

module.exports = router;