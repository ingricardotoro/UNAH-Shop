const { supabase } = require('../config/database');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class OrdersService {

  /**
   * Crear una nueva orden desde el carrito
   */
  async createOrder(orderData) {
    try {
      const { 
        userId, 
        sessionId, 
        customer_id,
        customerInfo, 
        paymentMethod, 
        shippingAddress,
        cartServiceUrl = 'http://localhost:3003'
      } = orderData;

      // 1. Obtener items del carrito
      const cartItems = await this.getCartItems(userId, sessionId, customer_id, cartServiceUrl);
      
      if (!cartItems || cartItems.length === 0) {
        throw new Error('El carrito está vacío');
      }

      // 2. Calcular totales
      const subtotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const tax = Math.round(subtotal * 0.15 * 100) / 100; // 15% impuesto
      const shipping = subtotal > 50 ? 0 : 5.99; // Envío gratis sobre $50
      const total = Math.round((subtotal + tax + shipping) * 100) / 100;

      // 3. Crear la orden principal
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: customer_id || userId,
            status: 'pending',
            total_amount: total,
            items_count: cartItems.length,
            customer_info: {
              ...customerInfo,
              payment_method: paymentMethod
            },
            shipping_address: shippingAddress,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Crear los items de la orden
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        // Rollback: eliminar la orden si falla la inserción de items
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsError;
      }

      // 5. Limpiar el carrito después de crear la orden
      await this.clearCart(customer_id || userId, sessionId, cartServiceUrl);

      // 6. Obtener la orden completa con items
      const completeOrder = await this.getOrderById(order.id);

      return completeOrder;

    } catch (error) {
      console.error('Error en createOrder:', error);
      throw error;
    }
  }

  /**
   * Obtener orden por ID
   */
  async getOrderById(orderId) {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            product_image,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Transformar datos para compatibilidad con frontend
      return {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total: parseFloat(order.total_amount || 0),
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        customer_id: order.customer_id,
        customer_info: order.customer_info,
        shipping_address: order.shipping_address,
        items: (order.order_items || []).map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image,
          quantity: item.quantity,
          price: parseFloat(item.unit_price || 0),
          unit_price: parseFloat(item.unit_price || 0),
          total_price: parseFloat(item.total_price || 0),
          title: item.product_name
        }))
      };

    } catch (error) {
      console.error('Error en getOrderById:', error);
      throw error;
    }
  }

  /**
   * Obtener órdenes del usuario
   */
  async getUserOrders(userId, options = {}) {
    try {
      const { 
        status, 
        limit = 10, 
        offset = 0, 
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = options;

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *
          )
        `)
        .eq('customer_id', userId)
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      // Transformar datos para mejor estructura y compatibilidad con frontend
      const transformedOrders = orders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total: parseFloat(order.total_amount || 0), // Frontend espera 'total'
        createdAt: order.created_at, // Frontend espera 'createdAt'
        updatedAt: order.updated_at,
        customer_id: order.customer_id,
        customer_info: order.customer_info,
        shipping_address: order.shipping_address,
        items: (order.order_items || []).map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image,
          quantity: item.quantity,
          price: parseFloat(item.unit_price || 0), // Frontend espera 'price'
          unit_price: parseFloat(item.unit_price || 0),
          total_price: parseFloat(item.total_price || 0),
          title: item.product_name // Alias para compatibilidad
        }))
      }));

      return transformedOrders;

    } catch (error) {
      console.error('Error en getUserOrders:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de la orden
   */
  async updateOrderStatus(orderId, newStatus, userId = null) {
    try {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Estado inválido. Estados válidos: ${validStatuses.join(', ')}`);
      }

      let query = supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      // Si se proporciona userId, verificar propiedad
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Error en updateOrderStatus:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de órdenes
   */
  async getOrderStats(userId = null, timeRange = '30d') {
    try {
      const dateRange = this.getDateRange(timeRange);
      
      let baseQuery = supabase
        .from('orders')
        .select('status, total, created_at')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (userId) {
        baseQuery = baseQuery.eq('user_id', userId);
      }

      const { data: orders, error } = await baseQuery;

      if (error) throw error;

      // Calcular estadísticas
      const stats = {
        totalOrders: orders.length,
        totalRevenue: Math.round(orders.reduce((sum, order) => sum + order.total, 0) * 100) / 100,
        averageOrderValue: orders.length > 0 
          ? Math.round((orders.reduce((sum, order) => sum + order.total, 0) / orders.length) * 100) / 100
          : 0,
        statusBreakdown: {
          pending: orders.filter(o => o.status === 'pending').length,
          confirmed: orders.filter(o => o.status === 'confirmed').length,
          processing: orders.filter(o => o.status === 'processing').length,
          shipped: orders.filter(o => o.status === 'shipped').length,
          delivered: orders.filter(o => o.status === 'delivered').length,
          cancelled: orders.filter(o => o.status === 'cancelled').length
        },
        revenueByStatus: {
          pending: Math.round(orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + o.total, 0) * 100) / 100,
          confirmed: Math.round(orders.filter(o => o.status === 'confirmed').reduce((sum, o) => sum + o.total, 0) * 100) / 100,
          processing: Math.round(orders.filter(o => o.status === 'processing').reduce((sum, o) => sum + o.total, 0) * 100) / 100,
          shipped: Math.round(orders.filter(o => o.status === 'shipped').reduce((sum, o) => sum + o.total, 0) * 100) / 100,
          delivered: Math.round(orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0) * 100) / 100,
          cancelled: Math.round(orders.filter(o => o.status === 'cancelled').reduce((sum, o) => sum + o.total, 0) * 100) / 100
        },
        timeRange: timeRange,
        dateRange: dateRange
      };

      return stats;

    } catch (error) {
      console.error('Error en getOrderStats:', error);
      throw error;
    }
  }

  /**
   * Buscar órdenes
   */
  async searchOrders(searchTerm, options = {}) {
    try {
      const { limit = 10, offset = 0 } = options;

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            product_image,
            quantity,
            unit_price,
            total_price
          )
        `)
        .or(`order_number.ilike.%${searchTerm}%,customer_info->>name.ilike.%${searchTerm}%,customer_info->>email.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const transformedOrders = orders.map(order => ({
        ...order,
        items: order.order_items || [],
        order_items: undefined
      }));

      return transformedOrders;

    } catch (error) {
      console.error('Error en searchOrders:', error);
      throw error;
    }
  }

  // Métodos auxiliares privados

  /**
   * Obtener items del carrito desde cart-service
   */
  async getCartItems(userId, sessionId, customer_id, cartServiceUrl) {
    try {
      let url = `${cartServiceUrl}/api/cart?`;
      
      if (userId) {
        url += `userId=${userId}`;
      } else if (sessionId) {
        url += `sessionId=${sessionId}`;
      } else if (customer_id) {
        url += `customer_id=${customer_id}`;
      } else {
        throw new Error('Se requiere userId, sessionId o customer_id');
      }

      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.data.items || [];

    } catch (error) {
      console.error('Error al obtener items del carrito:', error.message);
      throw new Error('No se pudo obtener el carrito');
    }
  }

  /**
   * Limpiar carrito después de crear orden
   */
  async clearCart(userId, sessionId, cartServiceUrl) {
    try {
      let url = `${cartServiceUrl}/api/cart?`;
      
      if (userId) {
        url += `customer_id=${userId}`;
      } else if (sessionId) {
        url += `sessionId=${sessionId}`;
      }

      await axios.delete(url, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Advertencia: No se pudo limpiar el carrito:', error.message);
      // No lanzar error aquí, ya que la orden se creó exitosamente
    }
  }

  /**
   * Generar número de orden único
   */
  generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ORD-${timestamp.slice(-6)}-${random}`;
  }

  /**
   * Obtener rango de fechas según el parámetro
   */
  getDateRange(timeRange) {
    const now = new Date();
    const end = now.toISOString();
    let start;

    switch (timeRange) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    return { start, end };
  }
}

module.exports = new OrdersService();