/**
 * Error handling middleware for customers-service
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

  // Supabase errors
  if (err.code === 'PGRST116') {
    error = new AppError('Cliente no encontrado', 404, 'CUSTOMER_NOT_FOUND');
  }
  
  if (err.code === '23505') {
    error = new AppError('Email ya registrado', 409, 'EMAIL_ALREADY_EXISTS');
  }

  if (err.code === '23503') {
    error = new AppError('Referencia inválida', 400, 'INVALID_REFERENCE');
  }

  // Joi validation errors
  if (err.isJoi || err.name === 'ValidationError') {
    const message = err.details ? 
      err.details.map(detail => detail.message).join(', ') : 
      'Datos de entrada inválidos';
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('JSON inválido', 400, 'INVALID_JSON');
  }

  // Default to 500 server error
  if (!error.isOperational) {
    error = new AppError(
      'Error interno del servidor', 
      500, 
      'INTERNAL_SERVER_ERROR'
    );
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
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
    `Ruta ${req.originalUrl} no encontrada`, 
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