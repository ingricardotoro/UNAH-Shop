import { BaseApiService, createApiMethods } from './apiService.js';

/**
 * Servicio del carrito - Paradigma Orientado a Objetos
 * Extiende BaseApiService para operaciones CRUD del carrito
 */
class CartService extends BaseApiService {
  constructor() {
    super('http://localhost:3003/api/cart');
  }

  /**
   * Obtiene todos los items del carrito
   * @param {string} customerId - ID del cliente
   * @returns {Promise<Object>} Carrito con items
   */
  async getCart(customerId) {
    try {
      // Usar customer_id para coincidir exactamente con la columna de la BD
      const response = await this.get(`?customer_id=${customerId}`);
      // Devolver solo la parte data que contiene los items
      return response.data || { items: [] };
    } catch (error) {
      console.error('Error al obtener carrito:', error);
      throw error;
    }
  }

  /**
   * Agrega un producto al carrito
   * @param {Object} item - Item a agregar
   * @param {string} item.customerId - ID del cliente
   * @param {number} item.productId - ID del producto
   * @param {number} item.quantity - Cantidad
   * @returns {Promise<Object>} Item agregado
   */
  async addToCart(item) {
    try {
      return await this.post('/items', item);
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      throw error;
    }
  }

  /**
   * Actualiza la cantidad de un item en el carrito
   * @param {string} itemId - ID del item
   * @param {number} quantity - Nueva cantidad
   * @returns {Promise<Object>} Item actualizado
   */
  async updateCartItem(itemId, quantity) {
    try {
      return await this.put(`/items/${itemId}`, { quantity });
    } catch (error) {
      console.error('Error al actualizar item del carrito:', error);
      throw error;
    }
  }

  /**
   * Elimina un item del carrito
   * @param {string} itemId - ID del item a eliminar
   * @returns {Promise<Object>} Respuesta de eliminación
   */
  async removeFromCart(itemId) {
    try {
      return await this.delete(`/items/${itemId}`);
    } catch (error) {
      console.error('Error al eliminar del carrito:', error);
      throw error;
    }
  }

  /**
   * Vacía completamente el carrito
   * @param {string} customerId - ID del cliente
   * @returns {Promise<Object>} Respuesta de limpieza
   */
  async clearCart(customerId) {
    try {
      // Usar customer_id para coincidir exactamente con la columna de la BD
      return await this.delete(`?customer_id=${customerId}`);
    } catch (error) {
      console.error('Error al limpiar carrito:', error);
      throw error;
    }
  }

  /**
   * Transfiere carrito de sesión a usuario autenticado
   * @param {string} sessionId - ID de sesión
   * @param {string} customerId - ID del cliente
   * @returns {Promise<Object>} Respuesta de transferencia
   */
  async transferCart(sessionId, customerId) {
    try {
      return await this.post('/transfer', { sessionId, customerId });
    } catch (error) {
      console.error('Error al transferir carrito:', error);
      throw error;
    }
  }
}

/**
 * Paradigma Funcional - Funciones puras para operaciones del carrito
 */

// Crear métodos funcionales usando la factory function
const cartApiMethods = createApiMethods('http://localhost:3003/api/cart');

/**
 * Funciones puras para manipular datos del carrito
 */

/**
 * Calcula el total del carrito
 * @param {Array} items - Items del carrito
 * @returns {number} Total calculado
 */
export const calculateCartTotal = (items) => {
  return items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

/**
 * Calcula la cantidad total de items
 * @param {Array} items - Items del carrito
 * @returns {number} Cantidad total
 */
export const calculateTotalItems = (items) => {
  return items.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Agrupa items por categoría
 * @param {Array} items - Items del carrito
 * @returns {Object} Items agrupados por categoría
 */
export const groupItemsByCategory = (items) => {
  return items.reduce((groups, item) => {
    const category = item.category || 'Sin categoría';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});
};

/**
 * Valida si un item puede ser agregado al carrito
 * @param {Object} item - Item a validar
 * @returns {Object} Resultado de validación
 */
export const validateCartItem = (item) => {
  const errors = [];

  if (!item.productId) errors.push('ID de producto requerido');
  if (!item.quantity || item.quantity <= 0)
    errors.push('Cantidad debe ser mayor a 0');
  if (item.quantity > 10) errors.push('Máximo 10 unidades por producto');

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Funciones de API funcionales
 */
export const functionalCartService = {
  /**
   * Obtiene carrito usando paradigma funcional
   */
  getCart: async (customerId) => {
    return await cartApiMethods.get(`?customer_id=${customerId}`);
  },

  /**
   * Agrega item usando composición funcional
   */
  addToCart: async (item) => {
    const validation = validateCartItem(item);
    if (!validation.isValid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }
    return await cartApiMethods.post('', item);
  },

  /**
   * Actualiza item con validación funcional
   */
  updateCartItem: async (itemId, quantity) => {
    const validation = validateCartItem({ productId: 1, quantity });
    if (!validation.isValid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }
    return await cartApiMethods.put(`/${itemId}`, { quantity });
  },

  /**
   * Elimina item del carrito
   */
  removeFromCart: async (itemId) => {
    return await cartApiMethods.delete(`/${itemId}`);
  },

  /**
   * Limpia carrito completamente
   */
  clearCart: async (customerId) => {
    return await cartApiMethods.delete(`?customer_id=${customerId}`);
  },
};

// Instancia única del servicio (Singleton pattern)
export const cartService = new CartService();

// Función de orden superior para manejar operaciones del carrito con logging
export const withCartLogging = (operation) => {
  return async (...args) => {
    const startTime = Date.now();
    console.log(`[CartService] Iniciando operación: ${operation.name}`);

    try {
      const result = await operation(...args);
      const duration = Date.now() - startTime;
      console.log(
        `[CartService] Operación exitosa: ${operation.name} (${duration}ms)`
      );
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `[CartService] Error en operación: ${operation.name} (${duration}ms)`,
        error
      );
      throw error;
    }
  };
};

// Ejemplo de uso de función de orden superior
export const loggedCartService = {
  getCart: withCartLogging(cartService.getCart.bind(cartService)),
  addToCart: withCartLogging(cartService.addToCart.bind(cartService)),
  updateCartItem: withCartLogging(cartService.updateCartItem.bind(cartService)),
  removeFromCart: withCartLogging(cartService.removeFromCart.bind(cartService)),
  clearCart: withCartLogging(cartService.clearCart.bind(cartService)),
};

export default CartService;
