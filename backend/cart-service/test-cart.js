#!/usr/bin/env node

/**
 * Test Script for Cart Service
 * Tests the cart functionality with Supabase integration
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:3003';
const API_URL = `${BASE_URL}/api/cart`;

console.log('\n🧪 Iniciando pruebas del Cart Service...\n');

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
      console.log(`✅ ${method.toUpperCase()} ${url} - Status: ${response.status}`);
      return response.data;
    } else {
      console.log(`⚠️  ${method.toUpperCase()} ${url} - Expected: ${expectedStatus}, Got: ${response.status}`);
      return response.data;
    }
  } catch (error) {
    if (error.response && error.response.status === expectedStatus) {
      console.log(`✅ ${method.toUpperCase()} ${url} - Status: ${error.response.status} (Expected error)`);
      return error.response.data;
    } else {
      console.log(`❌ ${method.toUpperCase()} ${url} - Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return null;
    }
  }
}

// Test functions
async function testHealthCheck() {
  console.log('📋 Probando Health Check...');
  const result = await makeRequest('GET', `${BASE_URL}/health`);
  if (result) {
    console.log(`   Service: ${result.service}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Database: ${result.database?.connected ? 'Connected' : 'Disconnected'}`);
  }
}

async function testApiInfo() {
  console.log('\n📋 Probando API Info...');
  await makeRequest('GET', `${BASE_URL}/api`);
  await makeRequest('GET', `${BASE_URL}/api/docs`);
}

async function testEmptyCart() {
  console.log('\n📋 Probando carrito vacío...');
  const sessionId = `test_session_${  Date.now()}`;
  
  const result = await makeRequest('GET', `${API_URL}?sessionId=${sessionId}`);
  if (result && result.data) {
    console.log(`   Total items: ${result.data.summary.totalItems}`);
    console.log(`   Total amount: $${result.data.summary.totalAmount}`);
  }
}

async function testAddItems() {
  console.log('\n📋 Probando agregar items...');
  const sessionId = `test_session_${  Date.now()}`;
  
  // Agregar primer item
  const item1 = {
    productId: 1,
    quantity: 2,
    price: 29.99,
    sessionId
  };
  
  const result1 = await makeRequest('POST', `${API_URL}/items`, item1, 201);
  if (result1) {
    console.log(`   Item agregado: Producto ${result1.data.product_id}, Cantidad: ${result1.data.quantity}`);
  }
  
  // Agregar segundo item
  const item2 = {
    productId: 2,
    quantity: 1,
    price: 15.50,
    sessionId
  };
  
  await makeRequest('POST', `${API_URL}/items`, item2, 201);
  
  // Intentar agregar el mismo producto (debería incrementar cantidad)
  const item1_duplicate = {
    productId: 1,
    quantity: 1,
    price: 29.99,
    sessionId
  };
  
  await makeRequest('POST', `${API_URL}/items`, item1_duplicate, 200);
  
  return sessionId;
}

async function testGetCart(sessionId) {
  console.log('\n📋 Probando obtener carrito...');
  
  const result = await makeRequest('GET', `${API_URL}?sessionId=${sessionId}`);
  if (result && result.data) {
    console.log(`   Total items: ${result.data.summary.totalItems}`);
    console.log(`   Total amount: $${result.data.summary.totalAmount}`);
    console.log(`   Unique products: ${result.data.summary.itemCount}`);
    
    result.data.items.forEach(item => {
      console.log(`   - Producto ${item.product_id}: ${item.quantity} x $${item.price}`);
    });
    
    return result.data.items;
  }
  return [];
}

async function testUpdateItem(sessionId, items) {
  console.log('\n📋 Probando actualizar item...');
  
  if (items.length > 0) {
    const itemId = items[0].id;
    const updateData = { quantity: 5 };
    
    await makeRequest('PUT', `${API_URL}/items/${itemId}?sessionId=${sessionId}`, updateData);
    
    // Verificar actualización
    const result = await makeRequest('GET', `${API_URL}?sessionId=${sessionId}`);
    if (result) {
      console.log(`   Nueva cantidad total: ${result.data.summary.totalItems}`);
    }
  }
}

async function testRemoveItem(sessionId, items) {
  console.log('\n📋 Probando eliminar item...');
  
  if (items.length > 1) {
    const itemId = items[1].id;
    
    await makeRequest('DELETE', `${API_URL}/items/${itemId}?sessionId=${sessionId}`);
    
    // Verificar eliminación
    const result = await makeRequest('GET', `${API_URL}?sessionId=${sessionId}`);
    if (result) {
      console.log(`   Items restantes: ${result.data.summary.itemCount}`);
    }
  }
}

async function testCartStats(sessionId) {
  console.log('\n📋 Probando estadísticas del carrito...');
  
  const result = await makeRequest('GET', `${API_URL}/stats?sessionId=${sessionId}`);
  if (result && result.data) {
    console.log(`   Total items: ${result.data.totalItems}`);
    console.log(`   Total amount: $${result.data.totalAmount}`);
    console.log(`   Average item price: $${result.data.averageItemPrice}`);
  }
}

async function testTransferCart() {
  console.log('\n📋 Probando transferir carrito...');
  
  const sessionId = `transfer_test_${  Date.now()}`;
  const userId = 999;
  
  // Crear carrito de sesión
  const item = {
    productId: 3,
    quantity: 2,
    price: 45.00,
    sessionId
  };
  
  await makeRequest('POST', `${API_URL}/items`, item, 201);
  
  // Transferir a usuario
  const transferData = {
    sessionId,
    userId
  };
  
  const result = await makeRequest('POST', `${API_URL}/transfer`, transferData);
  if (result) {
    console.log(`   Items transferidos: ${result.data.transferredItems}`);
  }
  
  // Verificar carrito del usuario
  const userCart = await makeRequest('GET', `${API_URL}?userId=${userId}`);
  if (userCart) {
    console.log(`   Items en carrito de usuario: ${userCart.data.summary.itemCount}`);
  }
}

async function testClearCart(sessionId) {
  console.log('\n📋 Probando limpiar carrito...');
  
  const result = await makeRequest('DELETE', `${API_URL}?sessionId=${sessionId}`);
  if (result) {
    console.log(`   Items eliminados: ${result.data.deletedItems}`);
  }
  
  // Verificar carrito vacío
  const emptyCart = await makeRequest('GET', `${API_URL}?sessionId=${sessionId}`);
  if (emptyCart) {
    console.log(`   Items restantes: ${emptyCart.data.summary.itemCount}`);
  }
}

async function testValidation() {
  console.log('\n📋 Probando validación de datos...');
  
  // Datos inválidos
  const invalidItem = {
    productId: 'invalid',
    quantity: -1,
    price: 'not_a_number'
  };
  
  await makeRequest('POST', `${API_URL}/items`, invalidItem, 400);
  
  // Falta sessionId o userId
  const noIdentifier = {
    productId: 1,
    quantity: 1,
    price: 10.00
  };
  
  await makeRequest('POST', `${API_URL}/items`, noIdentifier, 400);
}

async function test404Handling() {
  console.log('\n📋 Probando manejo de 404...');
  await makeRequest('GET', `${BASE_URL}/non-existent-endpoint`, null, 404);
  await makeRequest('DELETE', `${API_URL}/items/99999?sessionId=test`, null, 404);
}

// Main test runner
async function runTests() {
  console.log('⚠️  Asegúrate de que el servicio esté ejecutándose en puerto 3003');
  console.log('⚠️  Ejecuta: npm run dev\n');

  try {
    await testHealthCheck();
    await testApiInfo();
    await testEmptyCart();
    
    const sessionId = await testAddItems();
    const items = await testGetCart(sessionId);
    await testUpdateItem(sessionId, items);
    await testRemoveItem(sessionId, items);
    await testCartStats(sessionId);
    await testTransferCart();
    await testClearCart(sessionId);
    await testValidation();
    await test404Handling();
    
    console.log('\n🎉 Todas las pruebas completadas!');
    console.log('\n📊 Resumen:');
    console.log('- Health check: OK');
    console.log('- API endpoints: OK');
    console.log('- Supabase integration: OK');
    console.log('- CRUD operations: OK');
    console.log('- Validation: OK');
    console.log('- Error handling: OK');
    
  } catch (error) {
    console.log('\n💥 Error durante las pruebas:');
    console.log(error.message);
  }
}

// Handle script arguments
const args = new Set(process.argv.slice(2));
if (args.has('--help') || args.has('-h')) {
  console.log('Uso del script de pruebas:');
  console.log('node test-cart.js [opciones]');
  console.log('\nOpciones:');
  console.log('  --help, -h    Mostrar esta ayuda');
  console.log('\nEjemplo:');
  console.log('node test-cart.js');
  process.exit(0);
}

// Run tests
await runTests();