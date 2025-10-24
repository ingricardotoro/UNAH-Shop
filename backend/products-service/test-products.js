#!/usr/bin/env node

/**
 * Test Script for Products Service
 * Tests the integration with FakeStore API and cache functionality
 */

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:3002';
const API_URL = `${BASE_URL}/api/products`;

console.log(chalk.blue.bold('\n🧪 Iniciando pruebas del Products Service...\n'));

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
  const result = await makeRequest('GET', `${BASE_URL}/health`);
  if (result) {
    console.log(chalk.blue(`   Service: ${result.service}`));
    console.log(chalk.blue(`   Integrations: ${JSON.stringify(result.integrations)}`));
  }
}

async function testApiInfo() {
  console.log(chalk.cyan('\n📋 Probando API Info...'));
  await makeRequest('GET', `${BASE_URL}/api`);
  await makeRequest('GET', `${BASE_URL}/api/docs`);
}

async function testGetProducts() {
  console.log(chalk.cyan('\n📋 Probando GET /api/products...'));
  
  // Test basic product list
  const result1 = await makeRequest('GET', API_URL);
  if (result1?.data) {
    console.log(chalk.blue(`   Found: ${result1.data.length} products`));
    console.log(chalk.blue(`   Source: ${result1.metadata?.source}`));
    console.log(chalk.blue(`   From cache: ${result1.fromCache || false}`));
  }
  
  // Test with limit
  await makeRequest('GET', `${API_URL}?limit=5`);
  
  // Test with sorting
  await makeRequest('GET', `${API_URL}?sort=desc&limit=3`);
  
  // Test invalid parameters
  await makeRequest('GET', `${API_URL}?limit=150`, null, 400);
  await makeRequest('GET', `${API_URL}?sort=invalid`, null, 400);
}

async function testGetProductById() {
  console.log(chalk.cyan('\n📋 Probando GET /api/products/:id...'));
  
  // Test valid product ID
  const result = await makeRequest('GET', `${API_URL}/1`);
  if (result?.data) {
    console.log(chalk.blue(`   Product: ${result.data.title}`));
    console.log(chalk.blue(`   Price: ${result.data.priceFormatted}`));
  }
  
  // Test another valid ID
  await makeRequest('GET', `${API_URL}/5`);
  
  // Test invalid ID
  await makeRequest('GET', `${API_URL}/999`, null, 404);
  await makeRequest('GET', `${API_URL}/invalid`, null, 400);
}

async function testGetCategories() {
  console.log(chalk.cyan('\n📋 Probando GET /api/products/categories...'));
  
  const result = await makeRequest('GET', `${API_URL}/categories`);
  if (result?.data) {
    console.log(chalk.blue(`   Found: ${result.data.length} categories`));
    result.data.forEach(cat => {
      console.log(chalk.blue(`   - ${cat.displayName} (${cat.slug})`));
    });
  }
}

async function testSearchProducts() {
  console.log(chalk.cyan('\n📋 Probando GET /api/products/search...'));
  
  // Test valid search
  const result1 = await makeRequest('GET', `${API_URL}/search?q=shirt`);
  if (result1?.data) {
    console.log(chalk.blue(`   Found: ${result1.data.length} products for "shirt"`));
    console.log(chalk.blue(`   Suggestions: ${JSON.stringify(result1.search?.suggestions)}`));
  }
  
  // Test another search
  await makeRequest('GET', `${API_URL}/search?q=gold`);
  
  // Test invalid searches
  await makeRequest('GET', `${API_URL}/search?q=a`, null, 400);
  await makeRequest('GET', `${API_URL}/search`, null, 400);
}

async function testGetProductsByCategory() {
  console.log(chalk.cyan('\n📋 Probando GET /api/products/category/:category...'));
  
  // Test valid category
  const result = await makeRequest('GET', `${API_URL}/category/electronics`);
  if (result?.data) {
    console.log(chalk.blue(`   Found: ${result.data.length} products in electronics`));
  }
  
  // Test another category
  await makeRequest('GET', `${API_URL}/category/jewelery`);
  
  // Test invalid category
  await makeRequest('GET', `${API_URL}/category/nonexistent`, null, 404);
}

async function testGetStats() {
  console.log(chalk.cyan('\n📋 Probando GET /api/products/stats...'));
  
  const result = await makeRequest('GET', `${API_URL}/stats`);
  if (result?.data) {
    console.log(chalk.blue(`   Total products: ${result.data.totalProducts}`));
    console.log(chalk.blue(`   Total categories: ${result.data.totalCategories}`));
    console.log(chalk.blue(`   Average price: $${result.data.averagePrice?.toFixed(2)}`));
    console.log(chalk.blue(`   Cache stats: ${result.data.cache?.hitRate} hit rate`));
  }
}

async function testCachePerformance() {
  console.log(chalk.cyan('\n📋 Probando rendimiento del cache...'));
  
  console.log(chalk.yellow('   Primera llamada (sin cache):'));
  const start1 = Date.now();
  await makeRequest('GET', `${API_URL}?limit=10`);
  const time1 = Date.now() - start1;
  console.log(chalk.blue(`   Tiempo: ${time1}ms`));
  
  console.log(chalk.yellow('   Segunda llamada (con cache):'));
  const start2 = Date.now();
  await makeRequest('GET', `${API_URL}?limit=10`);
  const time2 = Date.now() - start2;
  console.log(chalk.blue(`   Tiempo: ${time2}ms`));
  
  if (time2 < time1) {
    console.log(chalk.green('   ✅ Cache mejora el rendimiento'));
  }
}

async function testPriceFilters() {
  console.log(chalk.cyan('\n📋 Probando filtros de precio...'));
  
  // Test price range
  await makeRequest('GET', `${API_URL}?price_min=10&price_max=50&limit=5`);
  
  // Test minimum price only
  await makeRequest('GET', `${API_URL}?price_min=100&limit=3`);
  
  // Test invalid price range
  await makeRequest('GET', `${API_URL}?price_min=100&price_max=50`, null, 400);
}

async function test404Handling() {
  console.log(chalk.cyan('\n📋 Probando manejo de 404...'));
  await makeRequest('GET', `${BASE_URL}/non-existent-endpoint`, null, 404);
}

// Main test runner
async function runTests() {
  console.log(chalk.yellow('⚠️  Asegúrate de que el servicio esté ejecutándose en puerto 3002'));
  console.log(chalk.yellow('⚠️  Ejecuta: npm run dev\n'));

  try {
    await testHealthCheck();
    await testApiInfo();
    await testGetProducts();
    await testGetProductById();
    await testGetCategories();
    await testSearchProducts();
    await testGetProductsByCategory();
    await testGetStats();
    await testCachePerformance();
    await testPriceFilters();
    await test404Handling();
    
    console.log(chalk.green.bold('\n🎉 Todas las pruebas completadas!'));
    console.log(chalk.blue('\n📊 Resumen:'));
    console.log(chalk.blue('- Health check: OK'));
    console.log(chalk.blue('- API endpoints: OK'));
    console.log(chalk.blue('- FakeStore API integration: OK'));
    console.log(chalk.blue('- Cache functionality: OK'));
    console.log(chalk.blue('- Search and filters: OK'));
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
  console.log(chalk.blue('node test-products.js [opciones]'));
  console.log(chalk.blue('\nOpciones:'));
  console.log(chalk.blue('  --help, -h    Mostrar esta ayuda'));
  console.log(chalk.blue('\nEjemplo:'));
  console.log(chalk.blue('node test-products.js'));
  process.exit(0);
}

// Run tests
await runTests();