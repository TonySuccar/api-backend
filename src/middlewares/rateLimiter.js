const rateLimit = require('express-rate-limit');

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded for this endpoint. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create order rate limiting
const createOrderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Maximum 10 orders per minute per IP
  message: {
    error: 'Too many order creation attempts',
    message: 'Please wait before creating another order.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat assistant rate limiting
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Maximum 20 chat messages per minute per IP
  message: {
    error: 'Too many chat requests',
    message: 'Please slow down. You can send up to 20 messages per minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  strictLimiter,
  createOrderLimiter,
  chatLimiter
};