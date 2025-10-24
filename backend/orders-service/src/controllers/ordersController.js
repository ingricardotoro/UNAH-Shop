const Joi = require('joi');
const ordersService = require('../services/ordersService');

// Esquemas de validación
const createOrderSchema = Joi.object({
  userId: Joi.number().integer().positive().allow(null),
  sessionId: Joi.string().min(1).allow(null),
  customer_id: Joi.string().min(1).allow(null),
  customerInfo: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(10).max(20).allow(''),
  }).required(),
  paymentMethod: Joi.object({
    type: Joi.string().valid('credit_card', 'debit_card', 'paypal', 'cash_on_delivery', 'bank_transfer').required(),
    provider: Joi.string().max(50).allow(''),
    last4: Joi.string().length(4).allow(''),
  }).required(),
  shippingAddress: Joi.object({
    street: Joi.string().min(5).max(200).required(),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().min(2).max(100).required(),
    zipCode: Joi.string().min(3).max(20).required(),
    country: Joi.string().min(2).max(100).default('Honduras'),
  }).required(),
  cartServiceUrl: Joi.string().uri().optional()
}).or('userId', 'sessionId', 'customer_id');

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').required()
});

const querySchema = Joi.object({
  userId: Joi.number().integer().positive().optional(),
  customer_id: Joi.string().min(1).optional(), // Agregar soporte para customer_id como string
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0),
  orderBy: Joi.string().valid('created_at', 'updated_at', 'total', 'order_number').default('created_at'),
  orderDirection: Joi.string().valid('asc', 'desc').default('desc')
}).or('userId', 'customer_id'); // Requerir al menos uno de los dos

const searchSchema = Joi.object({
  q: Joi.string().min(2).max(100).required(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  offset: Joi.number().integer().min(0).default(0)
});

const statsSchema = Joi.object({
  userId: Joi.number().integer().positive().optional(),
  timeRange: Joi.string().valid('7d', '30d', '90d', '1y').default('30d')
});

class OrdersController {

  /**
   * Crear nueva orden
   * POST /api/orders
   */
  async createOrder(req, res) {
    try {
      const { error, value } = createOrderSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }

      const order = await ordersService.createOrder(value);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Orden creada exitosamente'
      });

    } catch (error) {
      console.error('Error en createOrder:', error);
      
      if (error.message === 'El carrito está vacío') {
        return res.status(400).json({
          success: false,
          message: 'No se puede crear una orden con un carrito vacío'
        });
      }

      if (error.message === 'No se pudo obtener el carrito') {
        return res.status(503).json({
          success: false,
          message: 'Error de comunicación con el servicio de carrito'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener orden por ID
   * GET /api/orders/:id
   */
  async getOrder(req, res) {
    try {
      const orderId = parseInt(req.params.id);
      if (!orderId || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID de orden inválido'
        });
      }

      const order = await ordersService.getOrderById(orderId);

      res.json({
        success: true,
        data: order,
        message: 'Orden obtenida exitosamente'
      });

    } catch (error) {
      console.error('Error en getOrder:', error);
      
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener órdenes del usuario
   * GET /api/orders
   */
  async getOrders(req, res) {
    try {
      const { error, value } = querySchema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { userId, customer_id, ...options } = value;
      
      // Validar que se proporcione al menos uno de los identificadores
      if (!userId && !customer_id) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere userId o customer_id para obtener órdenes'
        });
      }

      // Usar customer_id si está disponible, si no usar userId
      const userIdentifier = customer_id || userId;
      const orders = await ordersService.getUserOrders(userIdentifier, options);

      res.json({
        success: true,
        data: orders,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          hasMore: orders.length === options.limit
        },
        message: 'Órdenes obtenidas exitosamente'
      });

    } catch (error) {
      console.error('Error en getOrders:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Actualizar estado de orden
   * PUT /api/orders/:id/status
   */
  async updateOrderStatus(req, res) {
    try {
      const orderId = parseInt(req.params.id);
      if (!orderId || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID de orden inválido'
        });
      }

      const { error, value } = updateStatusSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { status } = value;
      const userId = req.query.userId ? parseInt(req.query.userId) : null;

      const order = await ordersService.updateOrderStatus(orderId, status, userId);

      res.json({
        success: true,
        data: order,
        message: 'Estado de orden actualizado exitosamente'
      });

    } catch (error) {
      console.error('Error en updateOrderStatus:', error);
      
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Buscar órdenes
   * GET /api/orders/search
   */
  async searchOrders(req, res) {
    try {
      const { error, value } = searchSchema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros de búsqueda inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { q, ...options } = value;
      const orders = await ordersService.searchOrders(q, options);

      res.json({
        success: true,
        data: orders,
        searchTerm: q,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          hasMore: orders.length === options.limit
        },
        message: 'Búsqueda completada exitosamente'
      });

    } catch (error) {
      console.error('Error en searchOrders:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estadísticas de órdenes
   * GET /api/orders/stats
   */
  async getOrderStats(req, res) {
    try {
      const { error, value } = statsSchema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { userId, timeRange } = value;
      const stats = await ordersService.getOrderStats(userId, timeRange);

      res.json({
        success: true,
        data: stats,
        message: 'Estadísticas obtenidas exitosamente'
      });

    } catch (error) {
      console.error('Error en getOrderStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new OrdersController();