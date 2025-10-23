const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const upload = require('../../middlewares/upload');

// GET /api/products?search=&tag=&sort=&page=&limit= - List products with filters
router.get('/', productsController.getAllProducts.bind(productsController));

// GET /api/products/:id - Get product by ID
router.get('/:id', productsController.getProductById.bind(productsController));

// POST /api/products - Create new product (supports file upload)
router.post('/', upload.single, productsController.createProduct.bind(productsController));

module.exports = router;