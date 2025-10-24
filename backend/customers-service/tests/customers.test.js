/**
 * Customer Service Tests
 * Basic test examples for the customers microservice
 */

const request = require('supertest');
const app = require('../index');

describe('Customers Service', () => {
  
  // Health check tests
  describe('Health Check', () => {
    test('GET /health should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'customers-service');
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  // API info tests
  describe('API Info', () => {
    test('GET /api should return service information', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'customers-service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });

    test('GET /api/docs should return API documentation', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);

      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('endpoints');
      expect(Array.isArray(response.body.endpoints)).toBe(true);
    });
  });

  // Customer endpoints tests
  describe('Customer Endpoints', () => {
    test('GET /api/customers should return customers list', async () => {
      const response = await request(app)
        .get('/api/customers')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    });

    test('GET /api/customers/stats should return statistics', async () => {
      const response = await request(app)
        .get('/api/customers/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    test('POST /api/customers should validate required fields', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('GET /api/customers/:id should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/customers/invalid-uuid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    test('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'ENDPOINT_NOT_FOUND');
    });
  });

  // Search functionality tests
  describe('Search Functionality', () => {
    test('GET /api/customers/search should require minimum search length', async () => {
      const response = await request(app)
        .get('/api/customers/search?search=a')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('2 caracteres');
    });

    test('GET /api/customers/search should accept valid search', async () => {
      const response = await request(app)
        .get('/api/customers/search?search=test')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });
});

// Integration tests (if database is available)
describe('Customer Integration Tests', () => {
  // These tests would run against a test database
  // and test the actual CRUD operations

  beforeAll(async () => {
    // Setup test database or mock
    console.log('Setting up integration tests...');
  });

  afterAll(async () => {
    // Cleanup test data
    console.log('Cleaning up integration tests...');
  });

  describe('Customer CRUD Operations', () => {
    test('should create a new customer', async () => {
      const customerData = {
        email: 'test@unah.shop',
        first_name: 'Test',
        last_name: 'User',
        phone: '+504 9999-9999'
      };

      // Note: This test would need a test database to actually work
      // For now, it's just a template
      console.log('Test customer creation with:', customerData);
    });

    test('should retrieve created customer', async () => {
      // Test getting the customer by ID
      console.log('Test customer retrieval');
    });

    test('should update customer data', async () => {
      // Test updating customer information
      console.log('Test customer update');
    });

    test('should delete customer', async () => {
      // Test customer deletion
      console.log('Test customer deletion');
    });
  });
});

// Performance tests
describe('Performance Tests', () => {
  test('should handle multiple concurrent requests', async () => {
    const promises = new Array(10).fill().map(() => 
      request(app).get('/health')
    );

    const responses = await Promise.all(promises);
    
    for (const response of responses) {
      expect(response.status).toBe(200);
    }
  });
});