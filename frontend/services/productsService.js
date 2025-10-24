import { BaseApiService, API_CONFIG, apiGet } from './apiService';

// Servicio de productos usando paradigma POO
export class ProductsService extends BaseApiService {
  constructor() {
    super(API_CONFIG.productsService);
  }

  async getAllProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/api/products?${queryString}`
      : '/api/products';
    return await this.get(endpoint);
  }

  async getProductById(id) {
    return await this.get(`/api/products/${id}`);
  }

  async getCategories() {
    return await this.get('/api/products/categories');
  }

  async getProductsByCategory(category) {
    return await this.get(`/api/products/category/${category}`);
  }

  async searchProducts(query, filters = {}) {
    const params = { q: query, ...filters };
    const queryString = new URLSearchParams(params).toString();
    return await this.get(`/api/products/search?${queryString}`);
  }

  async getProductStats() {
    return await this.get('/api/products/stats');
  }
}

// Funciones para productos usando paradigma funcional
export const productsFunctional = {
  // Función para obtener todos los productos
  getAllProducts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/api/products?${queryString}`
      : '/api/products';
    return await apiGet(`${API_CONFIG.productsService}${endpoint}`);
  },

  // Función para obtener producto por ID
  getProductById: async (id) => {
    return await apiGet(`${API_CONFIG.productsService}/api/products/${id}`);
  },

  // Función para obtener categorías
  getCategories: async () => {
    return await apiGet(
      `${API_CONFIG.productsService}/api/products/categories`
    );
  },

  // Función para obtener productos por categoría
  getProductsByCategory: async (category) => {
    return await apiGet(
      `${API_CONFIG.productsService}/api/products/category/${category}`
    );
  },

  // Función para buscar productos
  searchProducts: async (query, filters = {}) => {
    const params = { q: query, ...filters };
    const queryString = new URLSearchParams(params).toString();
    return await apiGet(
      `${API_CONFIG.productsService}/api/products/search?${queryString}`
    );
  },

  // Función para obtener estadísticas
  getProductStats: async () => {
    return await apiGet(`${API_CONFIG.productsService}/api/products/stats`);
  },

  // Función de orden superior para filtrar productos
  createProductFilter: (filterFn) => (products) => products.filter(filterFn),

  // Función de orden superior para transformar productos
  createProductTransformer: (transformFn) => (products) =>
    products.map(transformFn),

  // Función currificada para filtrar por precio
  filterByPriceRange: (min) => (max) => (products) =>
    products.filter((product) => product.price >= min && product.price <= max),

  // Función de composición para aplicar múltiples transformaciones
  compose:
    (...fns) =>
    (value) =>
      fns.reduceRight((acc, fn) => fn(acc), value),
};

// Instancia del servicio POO para exportar
export const productsService = new ProductsService();
