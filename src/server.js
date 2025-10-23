require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./db');
const { errorHandler, notFoundHandler, corsOptions } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { httpLogger, logger } = require('./middlewares/logger');

// Import route modules
const customersRoutes = require('./modules/customers').routes;
const productsRoutes = require('./modules/products').routes;
const ordersRoutes = require('./modules/orders').routes;
const analyticsRoutes = require('./modules/analytics').routes;
const dashboardRoutes = require('./modules/dashboard').routes;
const assistantRoutes = require('./modules/assistant').routes;
const complaintsRoutes = require('./modules/complaints').router;

// Import middleware
const upload = require('./middlewares/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(httpLogger);
app.use(apiLimiter);

// Serve static files (uploaded images)
const uploadsRoot = upload.getUploadRoot();
app.use(upload.PUBLIC_ROUTE, express.static(uploadsRoot));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes

// Mount route modules
app.use('/api/customers', customersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/complaints', complaintsRoutes);

// File upload test endpoint
app.post('/api/upload', upload.single, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: upload.getPublicUrl(req.file.filename)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-api';
    await connectDB(mongoUri);
    
    // Start listening
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Uploads served at: http://localhost:${PORT}/uploads`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Graceful shutdown initiated (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Graceful shutdown initiated (SIGTERM)');
  process.exit(0);
});

startServer();