#!/usr/bin/env node

/**
 * Quick Test Script for Customers Service
 * Tests basic endpoints without complex setup
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Simple HTTP request function
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function quickTest() {
  console.log('🧪 Probando Customers Service...\n');

  try {
    // Test 1: Health Check
    console.log('1. Health Check...');
    const health = await makeRequest('/health');
    console.log(`   Status: ${health.status} ${health.status === 200 ? '✅' : '❌'}`);

    // Test 2: API Info
    console.log('2. API Info...');
    const apiInfo = await makeRequest('/api');
    console.log(`   Status: ${apiInfo.status} ${apiInfo.status === 200 ? '✅' : '❌'}`);

    // Test 3: Get Customers
    console.log('3. Get Customers...');
    const customers = await makeRequest('/api/customers');
    console.log(`   Status: ${customers.status} ${customers.status === 200 ? '✅' : '❌'}`);
    if (customers.data && customers.data.success) {
      console.log(`   Found: ${customers.data.data.length} customers`);
    }

    // Test 4: Get Stats
    console.log('4. Get Stats...');
    const stats = await makeRequest('/api/customers/stats');
    console.log(`   Status: ${stats.status} ${stats.status === 200 ? '✅' : '❌'}`);

    console.log('\n🎉 Pruebas básicas completadas!');
    console.log('\n📋 Para más pruebas:');
    console.log('- Visita http://localhost:3001/health en tu navegador');
    console.log('- Visita http://localhost:3001/api/docs para la documentación');
    console.log('- Usa Postman o curl para probar POST/PUT/DELETE');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Asegúrate de que el servicio esté ejecutándose:');
    console.log('   node index.js');
  }
}

quickTest();