/**
 * FakeStore API Configuration
 * External API integration for product data
 */

const axios = require('axios');

// FakeStore API Base Configuration
const FAKESTORE_API = {
  BASE_URL: 'https://fakestoreapi.com',
  ENDPOINTS: {
    PRODUCTS: '/products',
    CATEGORIES: '/products/categories',
    PRODUCT_BY_ID: '/products',
    PRODUCTS_BY_CATEGORY: '/products/category'
  },
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3
};

// Create axios instance for FakeStore API
const fakestoreClient = axios.create({
  baseURL: FAKESTORE_API.BASE_URL,
  timeout: FAKESTORE_API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'UNAH-Shop-Products-Service/1.0.0'
  }
});

// Request interceptor for logging
fakestoreClient.interceptors.request.use(
  (config) => {
    console.log(`🌐 FakeStore API Request: ${config.method.toUpperCase()} ${config.url}`);
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    console.error('❌ FakeStore API Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
fakestoreClient.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`✅ FakeStore API Response: ${response.status} ${response.config.url} (${duration}ms)`);
    return response;
  },
  (error) => {
    const duration = error.config?.metadata ? new Date() - error.config.metadata.startTime : 0;
    console.error(`❌ FakeStore API Error: ${error.response?.status || 'Network Error'} ${error.config?.url} (${duration}ms)`);
    
    // Enhance error with more context
    if (error.response) {
      error.apiError = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url
      };
    } else if (error.request) {
      error.apiError = {
        message: 'No response received from FakeStore API',
        timeout: error.code === 'ECONNABORTED',
        url: error.config?.url
      };
    }
    
    return Promise.reject(error);
  }
);

// Test API connection
const testAPIConnection = async () => {
  try {
    console.log('🔍 Testing FakeStore API connection...');
    const response = await fakestoreClient.get('/products?limit=1');
    
    if (response.status === 200 && response.data.length > 0) {
      console.log('✅ FakeStore API connection successful');
      console.log(`📊 Sample product: ${response.data[0].title}`);
      return true;
    } else {
      console.warn('⚠️  FakeStore API returned unexpected data');
      return false;
    }
  } catch (error) {
    console.error('❌ FakeStore API connection failed:', error.message);
    return false;
  }
};

// Retry mechanism for failed requests
const withRetry = async (apiCall, maxRetries = FAKESTORE_API.RETRY_ATTEMPTS) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        console.error(`❌ All ${maxRetries} retry attempts failed for API call`);
        break;
      }
      
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
      console.warn(`⚠️  Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

module.exports = {
  fakestoreClient,
  FAKESTORE_API,
  testAPIConnection,
  withRetry
};