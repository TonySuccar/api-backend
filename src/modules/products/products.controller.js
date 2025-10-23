const productsService = require('./products.service');
const uploadUtils = require('../../middlewares/upload');

class ProductsController {
  async getAllProducts(req, res) {
    try {
      const result = await productsService.getAllProducts(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch products', 
        message: error.message 
      });
    }
  }

  async getProductById(req, res) {
    try {
      const product = await productsService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch product', 
        message: error.message 
      });
    }
  }

  async createProduct(req, res) {
    try {
      const allowedFields = new Set(['name', 'description', 'price', 'category', 'tags', 'stock']);
      const incomingFields = Object.keys(req.body || {});
      const unsupported = incomingFields.filter((field) => !allowedFields.has(field));

      if (unsupported.length > 0) {
        return res.status(400).json({
          error: `Unsupported fields provided: ${unsupported.join(', ')}`
        });
      }

      const payload = {
        name: typeof req.body?.name === 'string' ? req.body.name.trim() : '',
        description: typeof req.body?.description === 'string' ? req.body.description.trim() : '',
        price: req.body?.price,
        category: typeof req.body?.category === 'string' ? req.body.category.trim() : '',
        tags: req.body?.tags,
        stock: req.body?.stock
      };

      if (!req.file) {
        return res.status(400).json({ error: 'Product image is required' });
      }

      if (!payload.name) {
        return res.status(400).json({ error: 'Product name is required' });
      }

      if (!payload.description) {
        return res.status(400).json({ error: 'Product description is required' });
      }

      if (!payload.category) {
        return res.status(400).json({ error: 'Product category is required' });
      }

      if (typeof payload.price !== 'undefined') {
        const priceNum = Number(payload.price);
        if (Number.isFinite(priceNum)) {
          payload.price = priceNum;
        } else {
          delete payload.price;
        }
      }

      if (typeof payload.price === 'undefined') {
        return res.status(400).json({ error: 'Product price is required' });
      }

      if (payload.price < 0) {
        return res.status(400).json({ error: 'Product price must be zero or greater' });
      }

      if (typeof payload.stock !== 'undefined') {
        const stockNum = Number(payload.stock);
        if (Number.isFinite(stockNum)) {
          payload.stock = stockNum;
        } else {
          delete payload.stock;
        }
      }

      if (typeof payload.stock === 'undefined') {
        return res.status(400).json({ error: 'Product stock is required' });
      }

      if (payload.stock < 0) {
        return res.status(400).json({ error: 'Product stock must be zero or greater' });
      }

      if (Array.isArray(payload.tags)) {
        payload.tags = payload.tags.map((tag) => String(tag).trim()).filter(Boolean);
      } else if (typeof payload.tags === 'string') {
        try {
          const parsed = JSON.parse(payload.tags);
          if (Array.isArray(parsed)) {
            payload.tags = parsed.map((tag) => String(tag).trim()).filter(Boolean);
          } else {
            payload.tags = payload.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
          }
        } catch (error) {
          payload.tags = payload.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
        }
      }

      if (!payload.tags || payload.tags.length === 0) {
        delete payload.tags;
      }

      payload.imageUrl = uploadUtils.getPublicUrl(req.file.filename, req.uploadSubDir);

      const product = await productsService.createProduct(payload);
      res.status(201).json(product);
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: 'Failed to create product', 
        message: error.message 
      });
    }
  }

}

module.exports = new ProductsController();