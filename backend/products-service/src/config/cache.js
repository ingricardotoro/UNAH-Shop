/**
 * Cache Configuration for Products Service
 * Memory-based caching system for API responses
 */

const NodeCache = require('node-cache');

// Cache configuration
const CACHE_CONFIG = {
  // Cache durations in seconds
  PRODUCTS_LIST: 300,      // 5 minutes for products list
  SINGLE_PRODUCT: 600,     // 10 minutes for individual products
  CATEGORIES: 1800,        // 30 minutes for categories
  SEARCH_RESULTS: 180,     // 3 minutes for search results
  
  // Cache keys
  KEYS: {
    ALL_PRODUCTS: 'products:all',
    PRODUCT_BY_ID: 'product:id:',
    CATEGORIES_LIST: 'categories:all',
    PRODUCTS_BY_CATEGORY: 'products:category:',
    SEARCH_RESULTS: 'search:',
    STATS: 'stats:products'
  },
  
  // Cache settings
  CHECK_PERIOD: 120,       // Check for expired keys every 2 minutes
  MAX_KEYS: 1000,         // Maximum number of keys in cache
  USE_CLONES: true        // Clone objects when storing/retrieving
};

// Create cache instances
const productsCache = new NodeCache({
  stdTTL: CACHE_CONFIG.PRODUCTS_LIST,
  checkperiod: CACHE_CONFIG.CHECK_PERIOD,
  maxKeys: CACHE_CONFIG.MAX_KEYS,
  useClones: CACHE_CONFIG.USE_CLONES
});

// Cache statistics tracking
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0
};

// Cache utility functions
const cacheUtils = {
  /**
   * Generate cache key for products list with filters
   */
  generateProductsKey(filters = {}) {
    const { category, limit, sort, search } = filters;
    let key = CACHE_CONFIG.KEYS.ALL_PRODUCTS;
    
    if (category) key += `:cat:${category}`;
    if (limit) key += `:limit:${limit}`;
    if (sort) key += `:sort:${sort}`;
    if (search) key += `:search:${search}`;
    
    return key;
  },

  /**
   * Generate cache key for search results
   */
  generateSearchKey(query, filters = {}) {
    return `${CACHE_CONFIG.KEYS.SEARCH_RESULTS}${query}:${JSON.stringify(filters)}`;
  },

  /**
   * Get data from cache with statistics tracking
   */
  get(key) {
    try {
      const value = productsCache.get(key);
      if (value !== undefined) {
        cacheStats.hits++;
        console.log(`📋 Cache HIT: ${key}`);
        return value;
      } else {
        cacheStats.misses++;
        console.log(`📋 Cache MISS: ${key}`);
        return null;
      }
    } catch (error) {
      cacheStats.errors++;
      console.error(`❌ Cache GET error for key ${key}:`, error.message);
      return null;
    }
  },

  /**
   * Set data in cache with custom TTL
   */
  set(key, value, ttl = null) {
    try {
      const success = productsCache.set(key, value, ttl);
      if (success) {
        cacheStats.sets++;
        console.log(`💾 Cache SET: ${key} ${ttl ? `(TTL: ${ttl}s)` : ''}`);
      }
      return success;
    } catch (error) {
      cacheStats.errors++;
      console.error(`❌ Cache SET error for key ${key}:`, error.message);
      return false;
    }
  },

  /**
   * Delete specific key from cache
   */
  del(key) {
    try {
      const deleted = productsCache.del(key);
      if (deleted > 0) {
        cacheStats.deletes++;
        console.log(`🗑️  Cache DEL: ${key}`);
      }
      return deleted;
    } catch (error) {
      cacheStats.errors++;
      console.error(`❌ Cache DELETE error for key ${key}:`, error.message);
      return 0;
    }
  },

  /**
   * Clear all cache or keys matching pattern
   */
  clear(pattern = null) {
    try {
      if (pattern) {
        const keys = productsCache.keys().filter(key => key.includes(pattern));
        const deleted = productsCache.del(keys);
        console.log(`🧹 Cache CLEAR pattern '${pattern}': ${deleted} keys deleted`);
        return deleted;
      } else {
        productsCache.flushAll();
        console.log('🧹 Cache CLEAR: All keys deleted');
        return true;
      }
    } catch (error) {
      cacheStats.errors++;
      console.error('❌ Cache CLEAR error:', error.message);
      return false;
    }
  },

  /**
   * Get cache statistics
   */
  getStats() {
    const keys = productsCache.keys();
    const hitRate = cacheStats.hits + cacheStats.misses > 0 
      ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2)
      : 0;

    return {
      ...cacheStats,
      hitRate: `${hitRate}%`,
      totalKeys: keys.length,
      keysList: keys,
      memoryUsage: process.memoryUsage()
    };
  },

  /**
   * Reset cache statistics
   */
  resetStats() {
    cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
    console.log('📊 Cache statistics reset');
  }
};

// Cache event listeners
productsCache.on('set', (key, value) => {
  console.log(`🔄 Cache event SET: ${key}`);
});

productsCache.on('del', (key, value) => {
  console.log(`🔄 Cache event DEL: ${key}`);
});

productsCache.on('expired', (key, value) => {
  console.log(`⏰ Cache event EXPIRED: ${key}`);
});

// Middleware function for cache
const cacheMiddleware = (keyGenerator, ttl = null) => {
  return (req, res, next) => {
    const cacheKey = typeof keyGenerator === 'function' 
      ? keyGenerator(req) 
      : keyGenerator;
    
    const cachedData = cacheUtils.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        ...cachedData,
        cached: true,
        cacheKey,
        timestamp: new Date().toISOString()
      });
    }
    
    // Store original res.json
    const originalJson = res.json;
    
    // Override res.json to cache the response
    res.json = function(data) {
      if (res.statusCode === 200 && data.success) {
        cacheUtils.set(cacheKey, data, ttl);
      }
      
      // Call original res.json
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  productsCache,
  cacheUtils,
  cacheMiddleware,
  CACHE_CONFIG
};