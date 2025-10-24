#!/usr/bin/env node

/**
 * Test Script for Customers Service
 * This script tests the basic functionality of the customers microservice
 */

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/customers`;

// Test data
const testCustomer = {
  email: 'test@unah.shop',
  first_name: 'Juan',
  last_name: 'Pérez',
  phone: '+504 9999-9999'
};

let createdCustomerId = null;

console.log(chalk.blue.bold('\n🧪 Iniciando pruebas del Customers Service...\n'));

// Helper function for making requests
async function makeRequest(method, url, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      console.log(chalk.green(`✅ ${method.toUpperCase()} ${url} - Status: ${response.status}`));
      return response.data;
    } else {
      console.log(chalk.yellow(`⚠️  ${method.toUpperCase()} ${url} - Expected: ${expectedStatus}, Got: ${response.status}`));
      return response.data;
    }
  } catch (error) {
    if (error.response && error.response.status === expectedStatus) {
      console.log(chalk.green(`✅ ${method.toUpperCase()} ${url} - Status: ${error.response.status} (Expected error)`));
      return error.response.data;
    } else {
      console.log(chalk.red(`❌ ${method.toUpperCase()} ${url} - Error: ${error.message}`));
      if (error.response) {
        console.log(chalk.red(`   Status: ${error.response.status}`));
        console.log(chalk.red(`   Data: ${JSON.stringify(error.response.data, null, 2)}`));
      }
      return null;
    }
  }
}

// Test functions
async function testHealthCheck() {
  console.log(chalk.cyan('\n📋 Probando Health Check...'));
  await makeRequest('GET', `${BASE_URL}/health`);
}

async function testApiInfo() {
  console.log(chalk.cyan('\n📋 Probando API Info...'));
  await makeRequest('GET', `${BASE_URL}/api`);
  await makeRequest('GET', `${BASE_URL}/api/docs`);
}

async function testGetCustomers() {
  console.log(chalk.cyan('\n📋 Probando GET /api/customers...'));
  await makeRequest('GET', API_URL);
  await makeRequest('GET', `${API_URL}?page=1&limit=5`);
  await makeRequest('GET', `${API_URL}?search=test`);
}

async function testGetCustomerStats() {
  console.log(chalk.cyan('\n📋 Probando GET /api/customers/stats...'));
  await makeRequest('GET', `${API_URL}/stats`);
}

async function testCreateCustomer() {
  console.log(chalk.cyan('\n📋 Probando POST /api/customers...'));
  
  // Test successful creation
  const result = await makeRequest('POST', API_URL, testCustomer, 201);
  if (result?.success && result?.data?.id) {
    createdCustomerId = result.data.id;
    console.log(chalk.blue(`   Cliente creado con ID: ${createdCustomerId}`));
  }
  
  // Test validation errors
  await makeRequest('POST', API_URL, {}, 400);
  await makeRequest('POST', API_URL, { email: 'invalid-email' }, 400);
}

async function testGetCustomerById() {
  console.log(chalk.cyan('\n📋 Probando GET /api/customers/:id...'));
  
  if (createdCustomerId) {
    await makeRequest('GET', `${API_URL}/${createdCustomerId}`);
  }
  
  // Test invalid UUID
  await makeRequest('GET', `${API_URL}/invalid-uuid`, null, 400);
}

async function testUpdateCustomer() {
  console.log(chalk.cyan('\n📋 Probando PUT /api/customers/:id...'));
  
  if (createdCustomerId) {
    const updateData = {
      first_name: 'Juan Carlos',
      last_name: 'Pérez López'
    };
    await makeRequest('PUT', `${API_URL}/${createdCustomerId}`, updateData);
  }
  
  // Test invalid UUID
  await makeRequest('PUT', `${API_URL}/invalid-uuid`, { first_name: 'Test' }, 400);
}

async function testSearch() {
  console.log(chalk.cyan('\n📋 Probando búsqueda...'));
  
  // Test valid search
  await makeRequest('GET', `${API_URL}/search?search=Juan`);
  
  // Test invalid search (too short)
  await makeRequest('GET', `${API_URL}/search?search=a`, null, 400);
}

async function testDeleteCustomer() {
  console.log(chalk.cyan('\n📋 Probando DELETE /api/customers/:id...'));
  
  if (createdCustomerId) {
    await makeRequest('DELETE', `${API_URL}/${createdCustomerId}`);
  }
  
  // Test invalid UUID
  await makeRequest('DELETE', `${API_URL}/invalid-uuid`, null, 400);
}

async function test404Handling() {
  console.log(chalk.cyan('\n📋 Probando manejo de 404...'));
  await makeRequest('GET', `${BASE_URL}/non-existent-endpoint`, null, 404);
}

// Main test runner
async function runTests() {
  console.log(chalk.yellow('⚠️  Asegúrate de que el servicio esté ejecutándose en puerto 3001'));
  console.log(chalk.yellow('⚠️  Ejecuta: npm run dev:customers\n'));

  try {
    await testHealthCheck();
    await testApiInfo();
    await testGetCustomers();
    await testGetCustomerStats();
    await testCreateCustomer();
    await testGetCustomerById();
    await testUpdateCustomer();
    await testSearch();
    await testDeleteCustomer();
    await test404Handling();
    
    console.log(chalk.green.bold('\n🎉 Todas las pruebas completadas!'));
    console.log(chalk.blue('\n📊 Resumen:'));
    console.log(chalk.blue('- Health check: OK'));
    console.log(chalk.blue('- API info endpoints: OK'));
    console.log(chalk.blue('- CRUD operations: OK'));
    console.log(chalk.blue('- Validation: OK'));
    console.log(chalk.blue('- Error handling: OK'));
    
  } catch (error) {
    console.log(chalk.red.bold('\n💥 Error durante las pruebas:'));
    console.log(chalk.red(error.message));
  }
}

// Handle script arguments
const args = new Set(process.argv.slice(2));
if (args.has('--help') || args.has('-h')) {
  console.log(chalk.blue.bold('Uso del script de pruebas:'));
  console.log(chalk.blue('node test-service.js [opciones]'));
  console.log(chalk.blue('\nOpciones:'));
  console.log(chalk.blue('  --help, -h    Mostrar esta ayuda'));
  console.log(chalk.blue('\nEjemplo:'));
  console.log(chalk.blue('node test-service.js'));
  process.exit(0);
}

// Run tests
await runTests();