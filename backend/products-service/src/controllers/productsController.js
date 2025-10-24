/**
 * Products Controller - Handle HTTP requests and responses
 * Validates input, calls services, and formats responses
 */

const productsService = require('../services/productsService');

class ProductsController {

  /**
   * GET /api/products
   * Get products with optional filtering and pagination
   */
  async getProducts(req, res) {
    try {
      const {
        limit = 20,
        sort = 'asc',
        category,
        search,
        price_min: priceMin,
        price_max: priceMax
      } = req.query;

      // Validate parameters
      if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit must be a number between 1 and 100'
          }
        });
      }

      if (sort && !['asc', 'desc'].includes(sort)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SORT',
            message: 'Sort must be either "asc" or "desc"'
          }
        });
      }

      if (priceMin && (isNaN(priceMin) || priceMin < 0)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRICE_MIN',
            message: 'Price minimum must be a positive number'
          }
        });
      }

      if (priceMax && (isNaN(priceMax) || priceMax < 0)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRICE_MAX',
            message: 'Price maximum must be a positive number'
          }
        });
      }

      if (priceMin && priceMax && Number.parseFloat(priceMin) > Number.parseFloat(priceMax)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRICE_RANGE',
            message: 'Price minimum cannot be greater than price maximum'
          }
        });
      }

      const options = {
        limit: Number.parseInt(limit, 10),
        sort,
        category,
        search,
        priceMin: priceMin ? Number.parseFloat(priceMin) : null,
        priceMax: priceMax ? Number.parseFloat(priceMax) : null
      };

      const result = await productsService.getProducts(options);

      res.status(200).json({
        ...result,
        message: 'Products retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Error in getProducts controller:', error.message);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'PRODUCTS_FETCH_ERROR',
          message: 'Failed to retrieve products',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }

  /**
   * GET /api/products/:id
   * Get single product by ID
   */
  async getProductById(req, res) {
    try {
      const { id } = req.params;

      // Validate product ID
      if (!id || isNaN(id) || Number.parseInt(id, 10) < 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRODUCT_ID',
            message: 'Product ID must be a positive integer'
          }
        });
      }

      const result = await productsService.getProductById(id);

      res.status(200).json({
        ...result,
        message: 'Product retrieved successfully'
      });

    } catch (error) {
      console.error(`❌ Error in getProductById controller for ID ${req.params.id}:`, error.message);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: `Product with ID ${req.params.id} not found`
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'PRODUCT_FETCH_ERROR',
          message: 'Failed to retrieve product',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }

  /**
   * GET /api/products/categories
   * Get all available product categories
   */
  async getCategories(req, res) {
    try {
      const result = await productsService.getCategories();

      res.status(200).json({
        ...result,
        message: 'Categories retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Error in getCategories controller:', error.message);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'CATEGORIES_FETCH_ERROR',
          message: 'Failed to retrieve categories',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }

  /**
   * GET /api/products/search
   * Search products with query
   */
  async searchProducts(req, res) {
    try {
      const { q: query, ...filters } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_SEARCH_QUERY',
            message: 'Search query parameter "q" is required'
          }
        });
      }

      if (query.length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SEARCH_QUERY',
            message: 'Search query must be at least 2 characters long'
          }
        });
      }

      const result = await productsService.searchProducts(query, filters);

      res.status(200).json({
        ...result,
        message: `Search completed for "${query}"`
      });

    } catch (error) {
      console.error(`❌ Error in searchProducts controller for query "${req.query.q}":`, error.message);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'Search failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }

  /**
   * GET /api/products/stats
   * Get product statistics and cache information
   */
  async getProductStats(req, res) {
    try {
      const result = await productsService.getProductStats();

      res.status(200).json({
        ...result,
        message: 'Product statistics retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Error in getProductStats controller:', error.message);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to retrieve statistics',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }

  /**
   * DELETE /api/products/cache
   * Clear product cache (utility endpoint)
   */
  async clearCache(req, res) {
    try {
      const { pattern } = req.query;

      const result = await productsService.clearCache(pattern);

      res.status(200).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error in clearCache controller:', error.message);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'CACHE_CLEAR_ERROR',
          message: 'Failed to clear cache',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }

  /**
   * GET /api/products/category/:category
   * Get products by specific category
   */
  async getProductsByCategory(req, res) {
    try {
      const { category } = req.params;
      const { limit = 20, sort = 'asc' } = req.query;

      if (!category) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_CATEGORY',
            message: 'Category parameter is required'
          }
        });
      }

      const options = {
        category: decodeURIComponent(category),
        limit: Number.parseInt(limit, 10),
        sort
      };

      const result = await productsService.getProducts(options);

      if (result.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: `No products found in category "${category}"`
          }
        });
      }

      res.status(200).json({
        ...result,
        message: `Products retrieved for category "${category}"`
      });

    } catch (error) {
      console.error(`❌ Error in getProductsByCategory controller for category "${req.params.category}":`, error.message);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'CATEGORY_PRODUCTS_ERROR',
          message: 'Failed to retrieve products for category',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }
}

module.exports = new ProductsController();