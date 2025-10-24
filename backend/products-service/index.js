require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const productsRoutes = require('./src/routes/productsRoutes');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');

// Import configs
const { testAPIConnection } = require('./src/config/fakestore');

const app = express();
const PORT = process.env.PRODUCTS_SERVICE_PORT || 3002;

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'products-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    integrations: {
      fakestore_api: 'connected',
      cache: 'active'
    }
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    service: 'products-service',
    version: '1.0.0',
    description: 'Microservicio para gestión de productos - UNAH Shop',
    endpoints: {
      health: 'GET /health',
      products: {
        list: 'GET /api/products',
        get: 'GET /api/products/:id',
        search: 'GET /api/products/search?q=query',
        categories: 'GET /api/products/categories',
        byCategory: 'GET /api/products/category/:category',
        stats: 'GET /api/products/stats'
      }
    },
    documentation: '/api/docs'
  });
});

// API routes
app.use('/api/products', productsRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    service: 'products-service',
    title: 'Products API Documentation',
    version: '1.0.0',
    baseUrl: `http://localhost:${PORT}/api/products`,
    externalAPI: 'FakeStore API (https://fakestoreapi.com)',
    features: ['Caching', 'Search', 'Filtering', 'Statistics'],
    endpoints: [
      {
        method: 'GET',
        path: '/api/products',
        description: 'Obtener lista de productos con filtros',
        query: {
          limit: 'number (default: 20, max: 100)',
          sort: 'string (asc, desc)',
          category: 'string',
          search: 'string',
          price_min: 'number',
          price_max: 'number'
        }
      },
      {
        method: 'GET',
        path: '/api/products/:id',
        description: 'Obtener producto específico por ID',
        params: { id: 'number (1-20)' }
      },
      {
        method: 'GET',
        path: '/api/products/search',
        description: 'Buscar productos por texto',
        query: { q: 'string (required, min 2 chars)' }
      },
      {
        method: 'GET',
        path: '/api/products/categories',
        description: 'Obtener todas las categorías disponibles'
      },
      {
        method: 'GET',
        path: '/api/products/category/:category',
        description: 'Obtener productos de una categoría específica'
      },
      {
        method: 'GET',
        path: '/api/products/stats',
        description: 'Obtener estadísticas de productos y cache'
      }
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: 'Endpoint no encontrado',
      path: req.originalUrl,
      method: req.method
    },
    timestamp: new Date().toISOString()
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('� SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Initialize and start server
async function startServer() {
  try {
    // Test external API connection
    console.log('🔍 Testing FakeStore API connection...');
    const apiConnected = await testAPIConnection();
    
    if (!apiConnected) {
      console.warn('⚠️  FakeStore API connection failed, but starting server anyway...');
    }

    // Start server
    app.listen(PORT, () => {
      console.log('🚀 Products Service iniciado exitosamente');
      console.log(`📍 Puerto: ${PORT}`);
      console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 API info: http://localhost:${PORT}/api`);
      console.log(`📍 Documentación: http://localhost:${PORT}/api/docs`);
      console.log('📋 Endpoints disponibles:');
      console.log('   GET    /api/products         - Listar productos');
      console.log('   GET    /api/products/:id     - Obtener producto');
      console.log('   GET    /api/products/search  - Buscar productos');
      console.log('   GET    /api/products/categories - Listar categorías');
      console.log('   GET    /api/products/stats   - Estadísticas');
    });

  } catch (error) {
    console.error('❌ Error starting server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
