/**
 * Logging middleware for customers-service
 * Provides structured logging for requests and application events
 */

const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'customers-service',
    version: '1.0.0'
  },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id'] || generateRequestId()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      responseSize: res.get('Content-Length') || 0
    });

    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Log application events
 */
const logEvent = (event, data = {}) => {
  logger.info(`Event: ${event}`, {
    event,
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log errors
 */
const logError = (error, context = {}) => {
  logger.error('Application error', {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    context,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log database operations
 */
const logDatabase = (operation, table, data = {}) => {
  logger.info('Database operation', {
    operation,
    table,
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Performance monitoring middleware
 */
const performanceLogger = (operation) => {
  return (req, res, next) => {
    const startTime = process.hrtime.bigint();
    
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      if (duration > 1000) { // Log slow operations (>1s)
        logger.warn('Slow operation detected', {
          operation,
          duration: `${duration.toFixed(2)}ms`,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode
        });
      }
    });
    
    next();
  };
};

module.exports = {
  logger,
  requestLogger,
  logEvent,
  logError,
  logDatabase,
  performanceLogger
};