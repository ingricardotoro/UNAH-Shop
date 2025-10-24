const winston = require('winston');

// Configurar logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * Middleware para manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error en orders-service:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    ip: req.ip
  });

  // Error de Supabase
  if (err.code) {
    switch (err.code) {
      case 'PGRST116':
        return res.status(404).json({
          success: false,
          message: 'Recurso no encontrado',
          error: 'NOT_FOUND'
        });
      case '23505':
        return res.status(409).json({
          success: false,
          message: 'Conflicto: el recurso ya existe',
          error: 'DUPLICATE_RESOURCE'
        });
      case '23502':
        return res.status(400).json({
          success: false,
          message: 'Datos requeridos faltantes',
          error: 'MISSING_REQUIRED_FIELD'
        });
      case '23503':
        return res.status(400).json({
          success: false,
          message: 'Referencia inválida',
          error: 'INVALID_REFERENCE'
        });
      case 'ECONNREFUSED':
        return res.status(503).json({
          success: false,
          message: 'Servicio no disponible',
          error: 'SERVICE_UNAVAILABLE'
        });
      default:
        logger.error('Error de Supabase no manejado:', err.code);
    }
  }

  // Error de validación de Joi
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: err.details.map(detail => detail.message),
      error: 'VALIDATION_ERROR'
    });
  }

  // Error de Axios (comunicación con otros servicios)
  if (err.isAxiosError) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Error de comunicación con servicio externo',
        error: 'EXTERNAL_SERVICE_ERROR'
      });
    }
    
    if (err.response) {
      return res.status(err.response.status || 500).json({
        success: false,
        message: 'Error en servicio externo',
        error: 'EXTERNAL_SERVICE_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.response.data : undefined
      });
    }
  }

  // Error personalizado
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.code || 'CUSTOM_ERROR'
    });
  }

  // Error genérico del servidor
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
};

/**
 * Middleware para rutas no encontradas
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    error: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
};

/**
 * Middleware de logging de requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger,
  logger
};