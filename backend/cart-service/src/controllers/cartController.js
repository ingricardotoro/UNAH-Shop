const Joi = require('joi');
const cartService = require('../services/cartService');

// Esquemas de validación
const addItemSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  productName: Joi.string().min(1).optional(),
  productImage: Joi.string().uri().optional(),
  quantity: Joi.number().integer().min(1).max(100).required(),
  price: Joi.number().positive().precision(2).optional(),
  unitPrice: Joi.number().positive().precision(2).optional(),
  userId: Joi.number().integer().positive().allow(null),
  customerId: Joi.string().min(1).allow(null),
  sessionId: Joi.string().min(1).allow(null),
}).or('userId', 'customerId', 'sessionId');

const updateQuantitySchema = Joi.object({
  quantity: Joi.number().integer().min(0).max(100).required(),
});

const cartQuerySchema = Joi.object({
  userId: Joi.string().min(1).allow(null),
  customerId: Joi.string().min(1).allow(null),
  customer_id: Joi.string().min(1).allow(null),
  sessionId: Joi.string().min(1).allow(null),
}).or('userId', 'customerId', 'customer_id', 'sessionId');

const transferCartSchema = Joi.object({
  sessionId: Joi.string().min(1).required(),
  userId: Joi.number().integer().positive().required(),
});

class CartController {
  /**
   * Obtener items del carrito
   * GET /api/cart
   */
  async getCart(req, res) {
    try {
      const { error, value } = cartQuerySchema.validate(req.query);

      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: error.details.map(detail => detail.message),
        });
      }

      const { userId, customerId, customer_id, sessionId } = value;
      // Usar customer_id, customerId o userId (para compatibilidad)
      const userIdentifier = customer_id || customerId || userId;
      const cartData = await cartService.getCartItems(
        userIdentifier,
        sessionId
      );

      res.json({
        success: true,
        data: cartData,
        message: 'Carrito obtenido exitosamente',
      });
    } catch (error) {
      console.error('Error en getCart:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Agregar item al carrito
   * POST /api/cart/items
   */
  async addItem(req, res) {
    try {
      const { error, value } = addItemSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.details.map(detail => detail.message),
        });
      }

      const { productId, productName, productImage, quantity, price, unitPrice, userId, customerId, sessionId } = value;
      
      // Determinar el precio a usar (price o unitPrice)
      const itemPrice = price || unitPrice;
      
      // Determinar el identificador del usuario
      const userIdentifier = userId || customerId;
      
      const item = await cartService.addItem(
        userIdentifier,
        sessionId,
        productId,
        quantity,
        itemPrice,
        productName,
        productImage
      );

      res.status(201).json({
        success: true,
        data: item,
        message: 'Item agregado al carrito exitosamente',
      });
    } catch (error) {
      console.error('Error en addItem:', error);

      if (error.code === '23505') {
        // Duplicate key
        return res.status(409).json({
          success: false,
          message: 'El producto ya existe en el carrito',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Actualizar cantidad de item
   * PUT /api/cart/items/:id
   */
  async updateItem(req, res) {
    try {
      const itemId = req.params.id;
      if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'ID de item inválido',
        });
      }

      const { error, value } = updateQuantitySchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Cantidad inválida',
          errors: error.details.map(detail => detail.message),
        });
      }

      const { quantity } = value;
      const { userId, sessionId } = req.query;

      const item = await cartService.updateItemQuantity(
        itemId,
        quantity,
        userId,
        sessionId
      );

      if (quantity === 0) {
        res.json({
          success: true,
          data: item,
          message: 'Item eliminado del carrito exitosamente',
        });
      } else {
        res.json({
          success: true,
          data: item,
          message: 'Cantidad actualizada exitosamente',
        });
      }
    } catch (error) {
      console.error('Error en updateItem:', error);

      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Item no encontrado',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Eliminar item del carrito
   * DELETE /api/cart/items/:id
   */
  async removeItem(req, res) {
    try {
      const itemId = req.params.id;
      if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'ID de item inválido',
        });
      }

      const { userId, sessionId } = req.query;
      const item = await cartService.removeItem(itemId, userId, sessionId);

      res.json({
        success: true,
        data: item,
        message: 'Item eliminado del carrito exitosamente',
      });
    } catch (error) {
      console.error('Error en removeItem:', error);

      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Item no encontrado',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Limpiar carrito completo
   * DELETE /api/cart
   */
  async clearCart(req, res) {
    try {
      const { error, value } = cartQuerySchema.validate(req.query);

      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: error.details.map(detail => detail.message),
        });
      }

      const { userId, customerId, customer_id, sessionId } = value;
      // Usar customer_id, customerId o userId (para compatibilidad)
      const userIdentifier = customer_id || customerId || userId;
      const result = await cartService.clearCart(userIdentifier, sessionId);

      res.json({
        success: true,
        data: result,
        message: 'Carrito limpiado exitosamente',
      });
    } catch (error) {
      console.error('Error en clearCart:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Transferir carrito de sesión a usuario
   * POST /api/cart/transfer
   */
  async transferCart(req, res) {
    try {
      const { error, value } = transferCartSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: error.details.map(detail => detail.message),
        });
      }

      const { sessionId, userId } = value;
      const result = await cartService.transferSessionCart(sessionId, userId);

      res.json({
        success: true,
        data: result,
        message: 'Carrito transferido exitosamente',
      });
    } catch (error) {
      console.error('Error en transferCart:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Obtener estadísticas del carrito
   * GET /api/cart/stats
   */
  async getCartStats(req, res) {
    try {
      const { error, value } = cartQuerySchema.validate(req.query);

      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Parámetros inválidos',
          errors: error.details.map(detail => detail.message),
        });
      }

      const { userId, customerId, customer_id, sessionId } = value;
      // Usar customer_id, customerId o userId (para compatibilidad)
      const userIdentifier = customer_id || customerId || userId;
      const stats = await cartService.getCartStats(userIdentifier, sessionId);

      res.json({
        success: true,
        data: stats,
        message: 'Estadísticas obtenidas exitosamente',
      });
    } catch (error) {
      console.error('Error en getCartStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = new CartController();
