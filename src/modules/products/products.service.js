const Product = require('./products.model');

class ProductsService {
  async getAllProducts(queryParams = {}) {
  const { search, tag, sort = 'createdAt', page = 1, limit = 16 } = queryParams;
    
    // Build query
    let query = {};
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Tag filter
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    // Build sort object with deterministic tie-breakers
    const sortObj = {};
    if (sort === 'price') {
      sortObj.price = 1;
      sortObj._id = 1;
    } else if (sort === '-price') {
      sortObj.price = -1;
      sortObj._id = -1;
    } else if (sort === 'name') {
      sortObj.name = 1;
      sortObj._id = 1;
    } else {
      sortObj.createdAt = -1;
      sortObj._id = -1;
    }
    
  // Calculate pagination
  const pageNum = Math.max(Number.parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(Number.parseInt(limit, 10) || 16, 1);
  const skip = (pageNum - 1) * limitNum;
    
    // Execute query
    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);
    
    const total = await Product.countDocuments(query);
    
    return {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  async getProductById(id) {
    return await Product.findById(id);
  }

  async createProduct(productData) {
    const product = new Product(productData);
    return await product.save();
  }

}

module.exports = new ProductsService();