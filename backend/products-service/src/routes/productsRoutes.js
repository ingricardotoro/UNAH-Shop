/**
 * Products Routes - Define API endpoints
 * Handles all /api/products routes
 */

const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const { cacheMiddleware, CACHE_CONFIG } = require('../config/cache');

// Middleware for logging requests
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
};

// Apply request logging to all routes
router.use(requestLogger);

/**
 * Product Statistics and Utilities Routes
 * Note: Place specific routes before parameterized routes
 */

// GET /api/products/stats - Get product statistics
router.get('/stats', productsController.getProductStats);

// GET /api/products/categories - Get all categories
router.get('/categories', 
  cacheMiddleware(
    () => CACHE_CONFIG.KEYS.CATEGORIES_LIST, 
    CACHE_CONFIG.CATEGORIES
  ),
  productsController.getCategories
);

// GET /api/products/search - Search products
router.get('/search', productsController.searchProducts);

// DELETE /api/products/cache - Clear cache (utility)
router.delete('/cache', productsController.clearCache);

/**
 * Main Products CRUD Routes
 */

// GET /api/products - Get all products with filtering
router.get('/', productsController.getProducts);

// GET /api/products/:id - Get product by ID
router.get('/:id', 
  cacheMiddleware(
    (req) => `${CACHE_CONFIG.KEYS.PRODUCT_BY_ID}${req.params.id}`,
    CACHE_CONFIG.SINGLE_PRODUCT
  ),
  productsController.getProductById
);

/**
 * Category-specific Routes
 */

// GET /api/products/category/:category - Get products by category
router.get('/category/:category', productsController.getProductsByCategory);

/**
 * Health check route for this service
 */
router.get('/health/check', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'products-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    integrations: {
      fakestore_api: 'connected',
      cache: 'active'
    }
  });
});

module.exports = router;