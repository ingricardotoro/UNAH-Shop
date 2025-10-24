/**
 * Error handling middleware for products-service
 * Centralizes error processing and response formatting
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  console.error('🚨 Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // FakeStore API errors
  if (err.apiError) {
    if (err.apiError.status === 404) {
      error = new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    } else if (err.apiError.timeout) {
      error = new AppError('External API timeout', 503, 'API_TIMEOUT');
    } else {
      error = new AppError('External API error', 502, 'EXTERNAL_API_ERROR');
    }
  }

  // Axios specific errors
  if (err.code === 'ECONNABORTED') {
    error = new AppError('Request timeout', 503, 'REQUEST_TIMEOUT');
  }

  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    error = new AppError('External service unavailable', 503, 'SERVICE_UNAVAILABLE');
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Invalid JSON', 400, 'INVALID_JSON');
  }

  // Cache errors
  if (err.message && err.message.includes('cache')) {
    error = new AppError('Cache operation failed', 500, 'CACHE_ERROR');
  }

  // Default to 500 server error
  if (!error.isOperational) {
    error = new AppError(
      'Internal server error', 
      500, 
      'INTERNAL_SERVER_ERROR'
    );
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.apiError || err
      })
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 handler for unmatched routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`, 
    404, 
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFoundHandler
};