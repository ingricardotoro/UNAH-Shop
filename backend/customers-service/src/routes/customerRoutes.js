/**
 * Customer Routes - Define API endpoints
 * Handles all /api/customers routes
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Middleware for logging requests
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
};

// Apply request logging to all routes
router.use(requestLogger);

/**
 * Customer Statistics Routes
 * GET /api/customers/stats - Get customer statistics
 * Note: Place specific routes before parameterized routes
 */
router.get('/stats', customerController.getCustomerStats);

/**
 * Customer Search Routes  
 * GET /api/customers/search - Advanced search
 */
router.get('/search', customerController.searchCustomers);

/**
 * Main Customer CRUD Routes
 */

// GET /api/customers - Get all customers (paginated)
router.get('/', customerController.getCustomers);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', customerController.getCustomerById);

// POST /api/customers - Create new customer
router.post('/', customerController.createCustomer);

// PUT /api/customers/:id - Update customer by ID
router.put('/:id', customerController.updateCustomer);

// DELETE /api/customers/:id - Delete customer by ID
router.delete('/:id', customerController.deleteCustomer);

/**
 * Health check route for this service
 */
router.get('/health/check', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'customers-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;