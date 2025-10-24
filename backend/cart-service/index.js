require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Importaciones locales
const cartRoutes = require('./src/routes/cartRoutes');
const { testConnection } = require('./src/config/database');
const { errorHandler, notFoundHandler, requestLogger, logger } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3003;

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
    },
  },
}));

// Configuración de CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middleware de logging
app.use(morgan('combined'));
app.use(requestLogger);

// Parseo de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    
    res.status(200).json({
      service: 'cart-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: dbConnected,
        provider: 'Supabase'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      service: 'cart-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Bienvenido al Cart Service - API de Carrito de Compras',
    version: '1.0.0',
    description: 'Servicio para gestión de carrito de compras con persistencia en Supabase',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs',
      cart: '/api/cart'
    },
    features: [
      'Carrito por usuario o sesión',
      'Persistencia en Supabase',
      'Validación de datos',
      'Transferencia de carrito',
      'Estadísticas del carrito'
    ]
  });
});

// Documentación de la API
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Cart Service API Documentation',
    version: '1.0.0',
    description: 'API RESTful para gestión de carrito de compras',
    baseUrl: `http://localhost:${PORT}/api`,
    endpoints: {
      'GET /api/cart': {
        description: 'Obtener items del carrito',
        parameters: {
          userId: 'ID del usuario (opcional)',
          sessionId: 'ID de sesión (opcional)'
        },
        example: 'GET /api/cart?userId=123'
      },
      'POST /api/cart/items': {
        description: 'Agregar item al carrito',
        body: {
          productId: 'ID del producto (requerido)',
          quantity: 'Cantidad (requerido)',
          price: 'Precio unitario (requerido)',
          userId: 'ID del usuario (opcional)',
          sessionId: 'ID de sesión (opcional)'
        }
      },
      'PUT /api/cart/items/:id': {
        description: 'Actualizar cantidad de item',
        parameters: {
          id: 'ID del item a actualizar'
        },
        body: {
          quantity: 'Nueva cantidad'
        }
      },
      'DELETE /api/cart/items/:id': {
        description: 'Eliminar item del carrito',
        parameters: {
          id: 'ID del item a eliminar'
        }
      },
      'DELETE /api/cart': {
        description: 'Limpiar carrito completo',
        parameters: {
          userId: 'ID del usuario (opcional)',
          sessionId: 'ID de sesión (opcional)'
        }
      },
      'POST /api/cart/transfer': {
        description: 'Transferir carrito de sesión a usuario',
        body: {
          sessionId: 'ID de sesión (requerido)',
          userId: 'ID del usuario (requerido)'
        }
      },
      'GET /api/cart/stats': {
        description: 'Obtener estadísticas del carrito',
        parameters: {
          userId: 'ID del usuario (opcional)',
          sessionId: 'ID de sesión (opcional)'
        }
      }
    },
    examples: {
      'Agregar producto': {
        method: 'POST',
        url: '/api/cart/items',
        body: {
          productId: 1,
          quantity: 2,
          price: 29.99,
          sessionId: 'sess_123'
        }
      },
      'Obtener carrito': {
        method: 'GET',
        url: '/api/cart?sessionId=sess_123'
      }
    }
  });
});

// Rutas de la API
app.use('/api/cart', cartRoutes);

// Middleware de manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

// Función de inicio del servidor
const startServer = async () => {
  try {
    logger.info('🔍 Probando conexión a Supabase...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      logger.warn('⚠️  No se pudo conectar a Supabase, pero el servicio continuará');
      logger.warn('⚠️  Verifica las variables SUPABASE_URL y SUPABASE_ANON_KEY');
    }

    app.listen(PORT, () => {
      logger.info('🚀 Cart Service iniciado exitosamente');
      logger.info(`📍 Puerto: ${PORT}`);
      logger.info(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📍 Health check: http://localhost:${PORT}/health`);
      logger.info(`📍 API info: http://localhost:${PORT}/api`);
      logger.info(`📍 Documentación: http://localhost:${PORT}/api/docs`);
      logger.info('📋 Endpoints disponibles:');
      logger.info('   GET    /api/cart         - Obtener carrito');
      logger.info('   POST   /api/cart/items   - Agregar item');
      logger.info('   PUT    /api/cart/items/:id - Actualizar item');
      logger.info('   DELETE /api/cart/items/:id - Eliminar item');
      logger.info('   DELETE /api/cart         - Limpiar carrito');
      logger.info('   POST   /api/cart/transfer - Transferir carrito');
      logger.info('   GET    /api/cart/stats   - Estadísticas');
      
      if (dbConnected) {
        logger.info('✅ Base de datos: Conectada');
      } else {
        logger.warn('⚠️  Base de datos: Desconectada');
      }
    });

  } catch (error) {
    logger.error('💥 Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales de cierre graceful
process.on('SIGTERM', () => {
  logger.info('🛑 Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

// Iniciar servidor
startServer();

module.exports = app;
