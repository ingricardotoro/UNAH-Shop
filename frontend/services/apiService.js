// Configuración base para las llamadas a la API
const API_CONFIG = {
  customersService:
    process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:3001',
  productsService: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3002',
  cartService: process.env.CART_SERVICE_URL || 'http://localhost:3003',
  ordersService: process.env.ORDERS_SERVICE_URL || 'http://localhost:3004',
};

// Clase para manejo de errores de API
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Función utilitaria para manejo de respuestas HTTP
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(
      errorData?.message || `HTTP Error: ${response.status}`,
      response.status,
      errorData
    );
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }

  return await response.text();
};

// Clase base para servicios de API (Paradigma POO)
export class BaseApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async get(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    return handleResponse(response);
  }

  async post(endpoint, data, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });

    return handleResponse(response);
  }

  async put(endpoint, data, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });

    return handleResponse(response);
  }

  async delete(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    return handleResponse(response);
  }
}

// Funciones utilitarias (Paradigma Funcional)
export const createApiRequest =
  (method) =>
  async (url, data = null, options = {}) => {
    const config = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    return handleResponse(response);
  };

// Exportar métodos HTTP funcionales
export const apiGet = createApiRequest('GET');
export const apiPost = createApiRequest('POST');
export const apiPut = createApiRequest('PUT');
export const apiDelete = createApiRequest('DELETE');

// Factory function para crear métodos de API (Paradigma Funcional)
export const createApiMethods = (baseUrl) => {
  return {
    get: async (endpoint, options = {}) => {
      return await apiGet(`${baseUrl}${endpoint}`, null, options);
    },
    post: async (endpoint, data, options = {}) => {
      return await apiPost(`${baseUrl}${endpoint}`, data, options);
    },
    put: async (endpoint, data, options = {}) => {
      return await apiPut(`${baseUrl}${endpoint}`, data, options);
    },
    delete: async (endpoint, options = {}) => {
      return await apiDelete(`${baseUrl}${endpoint}`, null, options);
    },
  };
};

// Exportar configuración
export { API_CONFIG };
