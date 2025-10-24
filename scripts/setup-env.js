#!/usr/bin/env node

/**
 * Script de configuración inicial para UNAH-Shop
 * Automatiza la configuración del entorno de desarrollo
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando configuración de UNAH-Shop...\n');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// 1. Verificar Node.js version
function checkNodeVersion() {
  info('Verificando versión de Node.js...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    error(`Node.js ${nodeVersion} detectado. Se requiere Node.js 18 o superior.`);
    process.exit(1);
  }
  
  success(`Node.js ${nodeVersion} ✅`);
}

// 2. Verificar si .env.local existe
function setupEnvironment() {
  info('Configurando variables de entorno...');
  
  const envExample = path.join(__dirname, '..', '.env.example');
  const envLocal = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envLocal)) {
    if (fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envLocal);
      success('Archivo .env.local creado desde .env.example');
      warning('⚠️  IMPORTANTE: Configura las variables de entorno en .env.local');
      warning('   - Supabase URL y Keys');
      warning('   - Puertos de microservicios');
      warning('   - URLs de APIs externas');
    } else {
      error('Archivo .env.example no encontrado');
    }
  } else {
    success('Archivo .env.local ya existe');
  }
}

// 3. Crear package.json para cada microservicio
function createMicroservicePackages() {
  info('Creando configuración para microservicios...');
  
  const microservices = [
    { name: 'customers-service', port: 3001, description: 'Servicio de gestión de clientes' },
    { name: 'products-service', port: 3002, description: 'Servicio de catálogo de productos' },
    { name: 'cart-service', port: 3003, description: 'Servicio de carrito de compras' },
    { name: 'orders-service', port: 3004, description: 'Servicio de órdenes' }
  ];
  
  microservices.forEach(service => {
    const servicePath = path.join(__dirname, '..', 'backend', service.name);
    const packagePath = path.join(servicePath, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      const packageJson = {
        name: service.name,
        version: '1.0.0',
        description: service.description,
        main: 'index.js',
        scripts: {
          start: 'node index.js',
          dev: 'nodemon index.js',
          test: 'jest',
          lint: 'eslint .',
          build: 'echo "Building service..."'
        },
        dependencies: {
          express: '^4.18.2',
          cors: '^2.8.5',
          helmet: '^7.1.0',
          morgan: '^1.10.0',
          '@supabase/supabase-js': '^2.38.4',
          joi: '^17.11.0',
          axios: '^1.6.2',
          dotenv: '^16.3.1'
        },
        devDependencies: {
          nodemon: '^3.0.2',
          jest: '^29.7.0',
          supertest: '^6.3.3',
          eslint: '^8.57.0'
        },
        keywords: ['microservice', 'express', 'api', 'educativo'],
        author: 'UNAH - Proyecto Educativo',
        license: 'MIT'
      };
      
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      success(`package.json creado para ${service.name}`);
    } else {
      info(`package.json ya existe para ${service.name}`);
    }
  });
}

// 4. Crear estructura básica de archivos para microservicios
function createMicroserviceStructure() {
  info('Creando estructura básica de microservicios...');
  
  const microservices = ['customers-service', 'products-service', 'cart-service', 'orders-service'];
  
  microservices.forEach(serviceName => {
    const servicePath = path.join(__dirname, '..', 'backend', serviceName);
    
    // Crear directorios
    const dirs = ['src', 'src/routes', 'src/controllers', 'src/services', 'src/models', 'src/middleware', 'src/utils', 'tests'];
    dirs.forEach(dir => {
      const dirPath = path.join(servicePath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
    
    // Crear archivo index.js básico
    const indexPath = path.join(servicePath, 'index.js');
    if (!fs.existsSync(indexPath)) {
      const port = serviceName.includes('customers') ? 3001 :
                   serviceName.includes('products') ? 3002 :
                   serviceName.includes('cart') ? 3003 : 3004;
      
      const indexContent = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.${serviceName.toUpperCase().replace('-', '_')}_PORT || ${port};

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: '${serviceName}',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Bienvenido a ${serviceName}',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Algo salió mal!',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(\`🚀 \${serviceName} ejecutándose en puerto \${PORT}\`);
  console.log(\`📍 Health check: http://localhost:\${PORT}/health\`);
  console.log(\`📍 API: http://localhost:\${PORT}/api\`);
});

module.exports = app;
`;
      
      fs.writeFileSync(indexPath, indexContent);
      success(`index.js creado para ${serviceName}`);
    }
  });
}

// 5. Crear archivo README para cada microservicio
function createMicroserviceReadmes() {
  info('Creando documentación para microservicios...');
  
  const services = [
    { name: 'customers-service', description: 'Gestión de clientes registrados', endpoints: ['GET /api/customers', 'POST /api/customers', 'PUT /api/customers/:id', 'DELETE /api/customers/:id'] },
    { name: 'products-service', description: 'Catálogo de productos desde API externa', endpoints: ['GET /api/products', 'GET /api/products/:id', 'GET /api/products/category/:category'] },
    { name: 'cart-service', description: 'Gestión del carrito de compras', endpoints: ['GET /api/cart/:userId', 'POST /api/cart', 'PUT /api/cart/:itemId', 'DELETE /api/cart/:itemId'] },
    { name: 'orders-service', description: 'Procesamiento de órdenes', endpoints: ['POST /api/orders', 'GET /api/orders/:userId', 'GET /api/orders/:id'] }
  ];
  
  services.forEach(service => {
    const readmePath = path.join(__dirname, '..', 'backend', service.name, 'README.md');
    
    if (!fs.existsSync(readmePath)) {
      const readmeContent = `# ${service.name}

## Descripción
${service.description}

## Instalación
\`\`\`bash
npm install
\`\`\`

## Desarrollo
\`\`\`bash
npm run dev
\`\`\`

## Endpoints

${service.endpoints.map(endpoint => `- \`${endpoint}\``).join('\n')}

## Variables de Entorno Requeridas
\`\`\`
${service.name.toUpperCase().replace('-', '_')}_PORT=30xx
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

## Testing
\`\`\`bash
npm test
\`\`\`

## Arquitectura
\`\`\`
${service.name}/
├── src/
│   ├── routes/         # Definición de rutas
│   ├── controllers/    # Lógica de controladores
│   ├── services/       # Lógica de negocio
│   ├── models/         # Modelos de datos
│   ├── middleware/     # Middleware personalizado
│   └── utils/          # Utilidades
├── tests/              # Pruebas unitarias
└── index.js           # Punto de entrada
\`\`\`
`;
      
      fs.writeFileSync(readmePath, readmeContent);
      success(`README.md creado para ${service.name}`);
    }
  });
}

// 6. Crear estructura frontend básica
function createFrontendStructure() {
  info('Preparando estructura del frontend...');
  
  const frontendPackage = path.join(__dirname, '..', 'frontend', 'package.json');
  
  if (!fs.existsSync(frontendPackage)) {
    const packageJson = {
      name: 'unah-shop-frontend',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        test: 'jest --watch',
        'test:ci': 'jest'
      },
      dependencies: {
        next: '14.0.4',
        react: '^18',
        'react-dom': '^18',
        '@mui/material': '^5.15.0',
        '@emotion/react': '^11.11.1',
        '@emotion/styled': '^11.11.0',
        '@mui/icons-material': '^5.15.0',
        axios: '^1.6.2'
      },
      devDependencies: {
        '@types/node': '^20',
        '@types/react': '^18',
        '@types/react-dom': '^18',
        eslint: '^8',
        'eslint-config-next': '14.0.4',
        jest: '^29.7.0',
        '@testing-library/react': '^13.4.0',
        '@testing-library/jest-dom': '^6.1.5'
      }
    };
    
    fs.writeFileSync(frontendPackage, JSON.stringify(packageJson, null, 2));
    success('package.json creado para frontend');
  }
}

// 7. Mostrar próximos pasos
function showNextSteps() {
  log('\n🎉 ¡Configuración completada!', 'green');
  log('\n📋 Próximos pasos:', 'bright');
  
  const steps = [
    '1. Configurar variables de entorno en .env.local',
    '2. Crear proyecto en Supabase y obtener credenciales', 
    '3. Ejecutar: npm run install:all',
    '4. Inicializar frontend: cd frontend && npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"',
    '5. Probar microservicios: npm run dev:backend',
    '6. Probar frontend: npm run dev:frontend',
    '7. Desarrollar siguiendo el plan en docs/PLAN_DESARROLLO.md'
  ];
  
  steps.forEach(step => {
    log(`   ${step}`, 'cyan');
  });
  
  log('\n📖 Documentación disponible:', 'bright');
  log('   - README.md - Información general', 'cyan');
  log('   - docs/PLAN_DESARROLLO.md - Plan detallado', 'cyan');
  log('   - docs/ARQUITECTURA.md - Arquitectura del sistema', 'cyan');
  
  log('\n🚀 ¡Comencemos a desarrollar!', 'green');
}

// Ejecutar configuración
async function main() {
  try {
    checkNodeVersion();
    setupEnvironment();
    createMicroservicePackages();
    createMicroserviceStructure();
    createMicroserviceReadmes();
    createFrontendStructure();
    showNextSteps();
  } catch (err) {
    error(`Error durante la configuración: ${err.message}`);
    process.exit(1);
  }
}

main();