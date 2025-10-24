/**
 * Products Service - Business Logic Layer
 * Integrates with FakeStore API and handles caching
 */

const { fakestoreClient, withRetry } = require('../config/fakestore');
const { cacheUtils, CACHE_CONFIG } = require('../config/cache');

class ProductsService {
  
  /**
   * Get all products with optional filtering and pagination
   */
  async getProducts(options = {}) {
    const {
      limit = 20,
      sort = 'asc',
      category = null,
      search = null,
      priceMin = null,
      priceMax = null
    } = options;

    // Generate cache key
    const cacheKey = cacheUtils.generateProductsKey({ 
      category, limit, sort, search, priceMin, priceMax 
    });

    // Try to get from cache first
    const cachedData = cacheUtils.get(cacheKey);
    if (cachedData) {
      return { ...cachedData, fromCache: true };
    }

    try {
      let url = '/products';
      const params = [];

      // Build query parameters
      if (limit) params.push(`limit=${limit}`);
      if (sort) params.push(`sort=${sort}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      // If category is specified, use category endpoint
      if (category) {
        url = `/products/category/${encodeURIComponent(category)}`;
        if (params.length > 0) {
          url += '?' + params.join('&');
        }
      }

      console.log(`🛍️  Fetching products from: ${url}`);

      const response = await withRetry(() => fakestoreClient.get(url));
      let products = response.data;

      // Apply client-side filtering (since FakeStore API has limited filtering)
      if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter(product => 
          product.title.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower)
        );
      }

      if (priceMin !== null) {
        products = products.filter(product => product.price >= Number.parseFloat(priceMin));
      }

      if (priceMax !== null) {
        products = products.filter(product => product.price <= Number.parseFloat(priceMax));
      }

      // Enhance products with additional computed fields
      const enhancedProducts = products.map(product => ({
        ...product,
        // Add computed fields
        priceFormatted: `$${product.price.toFixed(2)}`,
        rating: {
          ...product.rating,
          stars: Math.round(product.rating.rate),
          percentage: ((product.rating.rate / 5) * 100).toFixed(1)
        },
        availability: product.rating.count > 0 ? 'in_stock' : 'out_of_stock',
        slug: product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        imageAlt: `${product.title} - ${product.category}`,
        // Educational: demonstrate different data processing approaches
        titleWords: product.title.split(' ').length,
        descriptionLength: product.description.length,
        categorySlug: product.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }));

      const result = {
        success: true,
        data: enhancedProducts,
        pagination: {
          total: enhancedProducts.length,
          limit: Number.parseInt(limit, 10),
          page: 1, // FakeStore API doesn't support true pagination
          totalPages: Math.ceil(enhancedProducts.length / limit)
        },
        filters: {
          category,
          search,
          priceMin,
          priceMax,
          sort
        },
        metadata: {
          source: 'fakestore-api',
          fetchedAt: new Date().toISOString(),
          processingTime: new Date() - response.config.metadata.startTime
        }
      };

      // Cache the result
      cacheUtils.set(cacheKey, result, CACHE_CONFIG.PRODUCTS_LIST);

      return result;

    } catch (error) {
      console.error('❌ Error fetching products:', error.message);
      
      throw new Error(`Failed to fetch products: ${error.apiError?.message || error.message}`);
    }
  }

  /**
   * Get single product by ID
   */
  async getProductById(productId) {
    if (!productId || isNaN(productId)) {
      throw new Error('Valid product ID is required');
    }

    const cacheKey = `${CACHE_CONFIG.KEYS.PRODUCT_BY_ID}${productId}`;
    
    // Try cache first
    const cachedData = cacheUtils.get(cacheKey);
    if (cachedData) {
      return { ...cachedData, fromCache: true };
    }

    try {
      console.log(`🔍 Fetching product ID: ${productId}`);
      
      const response = await withRetry(() => 
        fakestoreClient.get(`/products/${productId}`)
      );

      const product = response.data;

      // Enhance single product with additional data
      const enhancedProduct = {
        ...product,
        priceFormatted: `$${product.price.toFixed(2)}`,
        rating: {
          ...product.rating,
          stars: Math.round(product.rating.rate),
          percentage: ((product.rating.rate / 5) * 100).toFixed(1)
        },
        availability: product.rating.count > 0 ? 'in_stock' : 'out_of_stock',
        slug: product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        imageAlt: `${product.title} - ${product.category}`,
        relatedSearchTerms: [
          product.category,
          ...product.title.split(' ').filter(word => word.length > 3)
        ]
      };

      const result = {
        success: true,
        data: enhancedProduct,
        metadata: {
          source: 'fakestore-api',
          fetchedAt: new Date().toISOString(),
          productId: Number.parseInt(productId, 10)
        }
      };

      // Cache single product for longer
      cacheUtils.set(cacheKey, result, CACHE_CONFIG.SINGLE_PRODUCT);

      return result;

    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      console.error(`❌ Error fetching product ${productId}:`, error.message);
      throw new Error(`Failed to fetch product: ${error.apiError?.message || error.message}`);
    }
  }

  /**
   * Get all available categories
   */
  async getCategories() {
    const cacheKey = CACHE_CONFIG.KEYS.CATEGORIES_LIST;
    
    // Try cache first
    const cachedData = cacheUtils.get(cacheKey);
    if (cachedData) {
      return { ...cachedData, fromCache: true };
    }

    try {
      console.log('📂 Fetching product categories');
      
      const response = await withRetry(() => 
        fakestoreClient.get('/products/categories')
      );

      const categories = response.data;

      // Enhance categories with additional metadata
      const enhancedCategories = categories.map(category => ({
        name: category,
        slug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        displayName: category.charAt(0).toUpperCase() + category.slice(1),
        searchKeywords: category.split(' ')
      }));

      const result = {
        success: true,
        data: enhancedCategories,
        metadata: {
          source: 'fakestore-api',
          fetchedAt: new Date().toISOString(),
          totalCategories: categories.length
        }
      };

      // Cache categories for longest time
      cacheUtils.set(cacheKey, result, CACHE_CONFIG.CATEGORIES);

      return result;

    } catch (error) {
      console.error('❌ Error fetching categories:', error.message);
      throw new Error(`Failed to fetch categories: ${error.apiError?.message || error.message}`);
    }
  }

  /**
   * Search products with advanced filtering
   */
  async searchProducts(query, filters = {}) {
    if (!query || query.length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    const cacheKey = cacheUtils.generateSearchKey(query, filters);
    
    // Try cache first
    const cachedData = cacheUtils.get(cacheKey);
    if (cachedData) {
      return { ...cachedData, fromCache: true };
    }

    try {
      // Get all products first (this will be cached)
      const allProductsResult = await this.getProducts({
        limit: 100, // Get more products for better search results
        ...filters
      });

      const searchLower = query.toLowerCase();
      const searchResults = allProductsResult.data.filter(product => {
        return (
          product.title.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower)
        );
      });

      // Sort by relevance (simple scoring)
      const scoredResults = searchResults.map(product => {
        let score = 0;
        const titleLower = product.title.toLowerCase();
        const descriptionLower = product.description.toLowerCase();
        
        // Score based on where the search term appears
        if (titleLower.includes(searchLower)) score += 10;
        if (titleLower.startsWith(searchLower)) score += 5;
        if (descriptionLower.includes(searchLower)) score += 3;
        if (product.category.toLowerCase().includes(searchLower)) score += 7;
        
        return { ...product, relevanceScore: score };
      }).sort((a, b) => b.relevanceScore - a.relevanceScore);

      const result = {
        success: true,
        data: scoredResults,
        search: {
          query,
          resultsCount: scoredResults.length,
          filters,
          suggestions: this._generateSearchSuggestions(query, allProductsResult.data)
        },
        metadata: {
          source: 'fakestore-api',
          searchedAt: new Date().toISOString(),
          totalSearched: allProductsResult.data.length
        }
      };

      // Cache search results for shorter time
      cacheUtils.set(cacheKey, result, CACHE_CONFIG.SEARCH_RESULTS);

      return result;

    } catch (error) {
      console.error(`❌ Error searching products for "${query}":`, error.message);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Get product statistics and cache info
   */
  async getProductStats() {
    const cacheKey = CACHE_CONFIG.KEYS.STATS;
    
    try {
      // Get fresh data for stats (don't cache this)
      const [productsResult, categoriesResult] = await Promise.all([
        this.getProducts({ limit: 100 }),
        this.getCategories()
      ]);

      const products = productsResult.data;
      const categories = categoriesResult.data;

      // Calculate statistics
      const stats = {
        totalProducts: products.length,
        totalCategories: categories.length,
        averagePrice: products.reduce((sum, p) => sum + p.price, 0) / products.length,
        priceRange: {
          min: Math.min(...products.map(p => p.price)),
          max: Math.max(...products.map(p => p.price))
        },
        averageRating: products.reduce((sum, p) => sum + p.rating.rate, 0) / products.length,
        categoryDistribution: categories.map(cat => ({
          category: cat.name,
          productCount: products.filter(p => p.category === cat.name).length
        })),
        topRatedProducts: products
          .sort((a, b) => b.rating.rate - a.rating.rate)
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            title: p.title,
            rating: p.rating.rate,
            price: p.price
          })),
        cache: cacheUtils.getStats()
      };

      return {
        success: true,
        data: stats,
        metadata: {
          calculatedAt: new Date().toISOString(),
          source: 'computed-from-fakestore-api'
        }
      };

    } catch (error) {
      console.error('❌ Error calculating product stats:', error.message);
      throw new Error(`Failed to calculate statistics: ${error.message}`);
    }
  }

  /**
   * Clear cache (utility method)
   */
  async clearCache(pattern = null) {
    try {
      const cleared = cacheUtils.clear(pattern);
      return {
        success: true,
        message: pattern 
          ? `Cache cleared for pattern: ${pattern}` 
          : 'All cache cleared',
        cleared
      };
    } catch (error) {
      throw new Error(`Failed to clear cache: ${error.message}`);
    }
  }

  /**
   * Private method to generate search suggestions
   */
  _generateSearchSuggestions(query, allProducts) {
    const queryLower = query.toLowerCase();
    const suggestions = new Set();
    
    allProducts.forEach(product => {
      const words = [
        ...product.title.toLowerCase().split(' '),
        ...product.category.toLowerCase().split(' ')
      ];
      
      words.forEach(word => {
        if (word.length > 3 && word.includes(queryLower) && word !== queryLower) {
          suggestions.add(word);
        }
      });
    });
    
    return Array.from(suggestions).slice(0, 5);
  }
}

module.exports = new ProductsService();