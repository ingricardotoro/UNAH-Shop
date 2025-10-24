require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Importaciones locales
const ordersRoutes = require('./src/routes/ordersRoutes');
const { testConnection } = require('./src/config/database');
const { errorHandler, notFoundHandler, requestLogger, logger } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3004;

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
    
    // Verificar conectividad con cart-service
    let cartServiceStatus = false;
    try {
      const axios = require('axios');
      const cartResponse = await axios.get('http://localhost:3003/health', { timeout: 2000 });
      cartServiceStatus = cartResponse.status === 200;
    } catch (error) {
      cartServiceStatus = false;
    }
    
    res.status(200).json({
      service: 'orders-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: dbConnected,
        provider: 'Supabase'
      },
      services: {
        cartService: cartServiceStatus ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      service: 'orders-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Bienvenido al Orders Service - API de Gestión de Órdenes',
    version: '1.0.0',
    description: 'Servicio para gestión de órdenes de compra con integración al carrito',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs',
      orders: '/api/orders'
    },
    features: [
      'Creación de órdenes desde carrito',
      'Gestión de estados de orden',
      'Integración con cart-service',
      'Búsqueda y filtrado',
      'Estadísticas de órdenes',
      'Validación completa de datos'
    ]
  });
});

// Documentación de la API
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Orders Service API Documentation',
    version: '1.0.0',
    description: 'API RESTful para gestión de órdenes de compra',
    baseUrl: `http://localhost:${PORT}/api`,
    endpoints: {
      'POST /api/orders': {
        description: 'Crear nueva orden desde carrito',
        body: {
          userId: 'ID del usuario (opcional)',
          sessionId: 'ID de sesión (opcional)', 
          customerInfo: {
            name: 'Nombre del cliente (requerido)',
            email: 'Email del cliente (requerido)',
            phone: 'Teléfono (opcional)'
          },
          paymentMethod: {
            type: 'Tipo de pago: credit_card, debit_card, paypal, cash_on_delivery',
            provider: 'Proveedor del pago (opcional)', 
            last4: 'Últimos 4 dígitos (opcional)'
          },
          shippingAddress: {
            street: 'Dirección completa (requerido)',
            city: 'Ciudad (requerido)',
            state: 'Estado/Departamento (requerido)',
            zipCode: 'Código postal (requerido)',
            country: 'País (por defecto: Honduras)'
          }
        }
      },
      'GET /api/orders': {
        description: 'Obtener órdenes del usuario',
        parameters: {
          userId: 'ID del usuario (requerido)',
          status: 'Filtrar por estado (opcional)',
          limit: 'Límite de resultados (por defecto: 10)',
          offset: 'Desplazamiento (por defecto: 0)',
          orderBy: 'Campo para ordenar (por defecto: created_at)',
          orderDirection: 'Dirección del orden: asc, desc (por defecto: desc)'
        }
      },
      'GET /api/orders/:id': {
        description: 'Obtener orden específica',
        parameters: {
          id: 'ID de la orden'
        }
      },
      'PUT /api/orders/:id/status': {
        description: 'Actualizar estado de orden',
        parameters: {
          id: 'ID de la orden',
          userId: 'ID del usuario (opcional, para verificar propiedad)'
        },
        body: {
          status: 'Nuevo estado: pending, confirmed, processing, shipped, delivered, cancelled'
        }
      },
      'GET /api/orders/search': {
        description: 'Buscar órdenes',
        parameters: {
          q: 'Término de búsqueda (número de orden, nombre, email)',
          limit: 'Límite de resultados (por defecto: 10)',
          offset: 'Desplazamiento (por defecto: 0)'
        }
      },
      'GET /api/orders/stats': {
        description: 'Obtener estadísticas de órdenes',
        parameters: {
          userId: 'ID del usuario (opcional, para estadísticas específicas)',
          timeRange: 'Rango de tiempo: 7d, 30d, 90d, 1y (por defecto: 30d)'
        }
      }
    },
    orderStates: {
      pending: 'Orden creada, pendiente de confirmación',
      confirmed: 'Orden confirmada, pendiente de procesamiento',
      processing: 'Orden en procesamiento',
      shipped: 'Orden enviada',
      delivered: 'Orden entregada',
      cancelled: 'Orden cancelada'
    },
    examples: {
      'Crear orden': {
        method: 'POST',
        url: '/api/orders',
        body: {
          sessionId: 'sess_123',
          customerInfo: {
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '+504 1234-5678'
          },
          paymentMethod: {
            type: 'credit_card',
            provider: 'Visa',
            last4: '1234'
          },
          shippingAddress: {
            street: 'Col. Miraflores, Calle Principal #123',
            city: 'Tegucigalpa',
            state: 'Francisco Morazán',
            zipCode: '11101',
            country: 'Honduras'
          }
        }
      }
    }
  });
});

// Rutas de la API
app.use('/api/orders', ordersRoutes);

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
      logger.info('🚀 Orders Service iniciado exitosamente');
      logger.info(`📍 Puerto: ${PORT}`);
      logger.info(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📍 Health check: http://localhost:${PORT}/health`);
      logger.info(`📍 API info: http://localhost:${PORT}/api`);
      logger.info(`📍 Documentación: http://localhost:${PORT}/api/docs`);
      logger.info('📋 Endpoints disponibles:');
      logger.info('   POST   /api/orders         - Crear orden');
      logger.info('   GET    /api/orders         - Obtener órdenes');
      logger.info('   GET    /api/orders/:id     - Obtener orden específica');
      logger.info('   PUT    /api/orders/:id/status - Actualizar estado');
      logger.info('   GET    /api/orders/search  - Buscar órdenes');
      logger.info('   GET    /api/orders/stats   - Estadísticas');
      
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
