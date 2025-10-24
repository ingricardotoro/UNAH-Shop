import { BaseApiService, createApiMethods } from './apiService.js';

/**
 * Servicio de órdenes - Paradigma Orientado a Objetos
 * Gestiona todas las operaciones relacionadas con pedidos
 */
class OrdersService extends BaseApiService {
  constructor() {
    super('http://localhost:3004/api/orders');
  }

  /**
   * Crea una nueva orden a partir del carrito
   * @param {Object} orderData - Datos de la orden
   * @param {string} orderData.customerId - ID del cliente
   * @param {Array} orderData.items - Items del carrito
   * @param {Object} orderData.shippingAddress - Dirección de envío
   * @param {string} orderData.paymentMethod - Método de pago
   * @returns {Promise<Object>} Orden creada
   */
  async createOrder(orderData) {
    try {
      return await this.post('', orderData);
    } catch (error) {
      console.error('Error al crear orden:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de órdenes de un cliente
   * @param {string} customerId - ID del cliente
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Array>} Lista de órdenes
   */
  async getOrderHistory(customerId, options = {}) {
    try {
      const queryParams = new URLSearchParams({
        customer_id: customerId, // Usar customer_id para consistencia
        ...options,
      });
      const response = await this.get(`?${queryParams}`);
      // Devolver solo el array de órdenes, no toda la respuesta
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener historial de órdenes:', error);
      throw error;
    }
  }

  /**
   * Obtiene los detalles de una orden específica
   * @param {string} orderId - ID de la orden
   * @returns {Promise<Object>} Detalles de la orden
   */
  async getOrderDetails(orderId) {
    try {
      return await this.get(`/${orderId}`);
    } catch (error) {
      console.error('Error al obtener detalles de orden:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una orden
   * @param {string} orderId - ID de la orden
   * @param {string} status - Nuevo estado
   * @returns {Promise<Object>} Orden actualizada
   */
  async updateOrderStatus(orderId, status) {
    try {
      return await this.put(`/${orderId}/status`, { status });
    } catch (error) {
      console.error('Error al actualizar estado de orden:', error);
      throw error;
    }
  }

  /**
   * Cancela una orden (si es posible)
   * @param {string} orderId - ID de la orden
   * @param {string} reason - Razón de cancelación
   * @returns {Promise<Object>} Resultado de cancelación
   */
  async cancelOrder(orderId, reason) {
    try {
      return await this.put(`/${orderId}/cancel`, { reason });
    } catch (error) {
      console.error('Error al cancelar orden:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de órdenes
   * @param {string} customerId - ID del cliente
   * @returns {Promise<Object>} Estadísticas
   */
  async getOrderStats(customerId) {
    try {
      return await this.get(`/stats/${customerId}`);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
}

/**
 * Paradigma Funcional - Funciones puras para operaciones de órdenes
 */

// Crear métodos funcionales usando la factory function
const ordersApiMethods = createApiMethods('http://localhost:3004/api/orders');

/**
 * Estados válidos de una orden
 */
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

/**
 * Funciones puras para manipular datos de órdenes
 */

/**
 * Valida los datos de una orden antes de crearla
 * @param {Object} orderData - Datos de la orden
 * @returns {Object} Resultado de validación
 */
export const validateOrderData = (orderData) => {
  const errors = [];

  if (!orderData.customerId && !orderData.customer_id) {
    errors.push('ID de cliente requerido');
  }

  // Los items se obtienen automáticamente del carrito en el backend
  // No es necesario validarlos aquí

  if (!orderData.customerInfo) {
    errors.push('Información del cliente requerida');
  } else {
    if (!orderData.customerInfo.name) errors.push('Nombre del cliente requerido');
    if (!orderData.customerInfo.email) errors.push('Email del cliente requerido');
  }

  if (!orderData.shippingAddress) {
    errors.push('Dirección de envío requerida');
  } else {
    const { street, city, zipCode, country } = orderData.shippingAddress;
    if (!street) errors.push('Calle de dirección requerida');
    if (!city) errors.push('Ciudad requerida');
    if (!zipCode) errors.push('Código postal requerido');
    if (!country) errors.push('País requerido');
  }

  if (!orderData.paymentMethod) {
    errors.push('Método de pago requerido');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Calcula el total de una orden
 * @param {Array} items - Items de la orden
 * @returns {number} Total calculado
 */
export const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

/**
 * Filtra órdenes por estado
 * @param {Array} orders - Lista de órdenes
 * @param {string} status - Estado a filtrar
 * @returns {Array} Órdenes filtradas
 */
export const filterOrdersByStatus = (orders, status) => {
  return orders.filter((order) => order.status === status);
};

/**
 * Agrupa órdenes por fecha
 * @param {Array} orders - Lista de órdenes
 * @returns {Object} Órdenes agrupadas por fecha
 */
export const groupOrdersByDate = (orders) => {
  return orders.reduce((groups, order) => {
    const date = new Date(order.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(order);
    return groups;
  }, {});
};

/**
 * Verifica si una orden puede ser cancelada
 * @param {Object} order - Orden a verificar
 * @returns {boolean} True si puede ser cancelada
 */
export const canCancelOrder = (order) => {
  const cancellableStatuses = [
    ORDER_STATUSES.PENDING,
    ORDER_STATUSES.CONFIRMED,
  ];
  return cancellableStatuses.includes(order.status);
};

/**
 * Calcula estadísticas de órdenes
 * @param {Array} orders - Lista de órdenes
 * @returns {Object} Estadísticas calculadas
 */
export const calculateOrderStats = (orders) => {
  const stats = {
    total: orders.length,
    totalAmount: 0,
    byStatus: {},
    averageOrderValue: 0,
  };

  orders.forEach((order) => {
    stats.totalAmount += order.total;
    stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;
  });

  stats.averageOrderValue =
    stats.total > 0 ? stats.totalAmount / stats.total : 0;

  return stats;
};

/**
 * Servicio funcional de órdenes
 */
export const functionalOrdersService = {
  /**
   * Crea orden con validación funcional
   */
  createOrder: async (orderData) => {
    const validation = validateOrderData(orderData);
    if (!validation.isValid) {
      throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
    }

    const orderWithTotal = {
      ...orderData,
      total: calculateOrderTotal(orderData.items),
    };

    return await ordersApiMethods.post('', orderWithTotal);
  },

  /**
   * Obtiene historial con filtros funcionales
   */
  getOrderHistory: async (customerId, filters = {}) => {
    const queryParams = new URLSearchParams({
      customerId,
      ...filters,
    });
    return await ordersApiMethods.get(`?${queryParams}`);
  },

  /**
   * Obtiene detalles de orden
   */
  getOrderDetails: async (orderId) => {
    return await ordersApiMethods.get(`/${orderId}`);
  },

  /**
   * Actualiza estado con validación
   */
  updateOrderStatus: async (orderId, status) => {
    if (!Object.values(ORDER_STATUSES).includes(status)) {
      throw new Error('Estado de orden inválido');
    }
    return await ordersApiMethods.put(`/${orderId}/status`, { status });
  },

  /**
   * Cancela orden con validación
   */
  cancelOrder: async (orderId, reason) => {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Razón de cancelación requerida');
    }
    return await ordersApiMethods.put(`/${orderId}/cancel`, { reason });
  },
};

// Instancia única del servicio
export const ordersService = new OrdersService();

// Función de orden superior para logging de operaciones
export const withOrderLogging = (operation) => {
  return async (...args) => {
    const startTime = Date.now();
    console.log(`[OrdersService] Iniciando operación: ${operation.name}`);

    try {
      const result = await operation(...args);
      const duration = Date.now() - startTime;
      console.log(
        `[OrdersService] Operación exitosa: ${operation.name} (${duration}ms)`
      );
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `[OrdersService] Error en operación: ${operation.name} (${duration}ms)`,
        error
      );
      throw error;
    }
  };
};

// Servicio con logging automático
export const loggedOrdersService = {
  createOrder: withOrderLogging(ordersService.createOrder.bind(ordersService)),
  getOrderHistory: withOrderLogging(
    ordersService.getOrderHistory.bind(ordersService)
  ),
  getOrderDetails: withOrderLogging(
    ordersService.getOrderDetails.bind(ordersService)
  ),
  updateOrderStatus: withOrderLogging(
    ordersService.updateOrderStatus.bind(ordersService)
  ),
  cancelOrder: withOrderLogging(ordersService.cancelOrder.bind(ordersService)),
  getOrderStats: withOrderLogging(
    ordersService.getOrderStats.bind(ordersService)
  ),
};

export default OrdersService;
