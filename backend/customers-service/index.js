require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const customerRoutes = require('./src/routes/customerRoutes');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');
const { requestLogger } = require('./src/middleware/logger');

const app = express();
const PORT = process.env.CUSTOMERS_SERVICE_PORT || 3001;

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
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'customers-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    service: 'customers-service',
    version: '1.0.0',
    description: 'Microservicio para gestión de clientes - UNAH Shop',
    endpoints: {
      health: 'GET /health',
      customers: {
        list: 'GET /api/customers',
        get: 'GET /api/customers/:id',
        create: 'POST /api/customers',
        update: 'PUT /api/customers/:id',
        delete: 'DELETE /api/customers/:id'
      }
    },
    documentation: '/api/docs'
  });
});

// API routes
app.use('/api/customers', customerRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    service: 'customers-service',
    title: 'Customers API Documentation',
    version: '1.0.0',
    baseUrl: `http://localhost:${PORT}/api/customers`,
    endpoints: [
      {
        method: 'GET',
        path: '/api/customers',
        description: 'Obtener lista de clientes con paginación',
        query: {
          page: 'number (default: 1)',
          limit: 'number (default: 10, max: 100)',
          sort_by: 'string (created_at, updated_at, email, first_name)',
          sort_order: 'string (asc, desc)',
          search: 'string (buscar en nombre, apellido, email)'
        }
      },
      {
        method: 'GET',
        path: '/api/customers/:id',
        description: 'Obtener cliente específico por ID',
        params: { id: 'UUID del cliente' }
      },
      {
        method: 'POST',
        path: '/api/customers',
        description: 'Crear nuevo cliente',
        body: {
          email: 'string (required)',
          first_name: 'string (required)',
          last_name: 'string (required)',
          phone: 'string (optional, formato: +504 9999-9999)'
        }
      },
      {
        method: 'PUT',
        path: '/api/customers/:id',
        description: 'Actualizar cliente existente',
        body: {
          email: 'string (optional)',
          first_name: 'string (optional)',
          last_name: 'string (optional)',
          phone: 'string (optional)'
        }
      },
      {
        method: 'DELETE',
        path: '/api/customers/:id',
        description: 'Eliminar cliente'
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

// Start server
app.listen(PORT, () => {
  console.log('🚀 Customers Service iniciado exitosamente');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API info: http://localhost:${PORT}/api`);
  console.log(`📍 Documentación: http://localhost:${PORT}/api/docs`);
  console.log('📋 Endpoints disponibles:');
  console.log('   GET    /api/customers     - Listar clientes');
  console.log('   GET    /api/customers/:id - Obtener cliente');
  console.log('   POST   /api/customers     - Crear cliente');
  console.log('   PUT    /api/customers/:id - Actualizar cliente');
  console.log('   DELETE /api/customers/:id - Eliminar cliente');
});

module.exports = app;
