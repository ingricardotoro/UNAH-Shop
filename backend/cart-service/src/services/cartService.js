const { supabase } = require('../config/database');

class CartService {
  
  /**
   * Obtener todos los items del carrito para un usuario/sesión
   */
  async getCartItems(userId, sessionId = null) {
    try {
      let query = supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          product_name,
          product_image,
          quantity,
          unit_price,
          total_price,
          created_at,
          updated_at
        `);

      // Por ahora usar customer_id para ambos casos (userId numérico o sessionId string)
      const identifier = userId || sessionId;
      if (!identifier) {
        throw new Error('Se requiere user_id o session_id');
      }
      console.log('Identifier for cart items:', identifier);
      
      // Primero veamos todos los registros para debug
      const { data: allData, error: allError } = await supabase
        .from('cart_items')
        .select('*');

      console.log('All cart items in database:', allData);
      console.log('All cart items error:', allError);

      // Hacer queries de prueba para identificar si los registros usan
      // 'customer_id' o 'user_id' (a veces la schema varía).
      const { data: byCustomer, error: byCustomerErr } = await supabase
        .from('cart_items')
        .select('*')
        .eq('customer_id', identifier);

      console.log('By customer_id:', byCustomer, 'err:', byCustomerErr);

      const { data: byUser, error: byUserErr } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', identifier);

      console.log('By user_id:', byUser, 'err:', byUserErr);

      // Elegir el filtro que tenga resultados
      if (byCustomer && byCustomer.length > 0) {
        query = query.eq('customer_id', identifier);
      } else if (byUser && byUser.length > 0) {
        query = query.eq('user_id', identifier);
      } else {
        // Mantener customer_id por defecto si ninguno devuelve resultados
        query = query.eq('customer_id', identifier);
      }

      console.log('Query for cart items:', query);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('Cart items retrieved:', data);
      
      // Log específico para verificar si product_image está presente
      data.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image,
          hasProductImage: !!item.product_image
        });
      });

      // Calcular totales
      const totalItems = data.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = data.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      return {
        items: data,
        summary: {
          totalItems,
          totalAmount: Math.round(totalAmount * 100) / 100, // Redondear a 2 decimales
          itemCount: data.length
        }
      };
    } catch (error) {
      console.error('Error en getCartItems:', error);
      throw error;
    }
  }

  /**
   * Agregar item al carrito
   */
  async addItem(userId, sessionId, productId, quantity, price, productName = null, productImage = null) {
    try {
      // Verificar si el item ya existe
      let existingQuery = supabase
        .from('cart_items')
        .select('*')
        .eq('product_id', productId);

      // La tabla usa customer_id, no user_id
      if (userId) {
        existingQuery = existingQuery.eq('customer_id', userId);
      } else if (sessionId) {
        existingQuery = existingQuery.eq('session_id', sessionId);
      }

      const { data: existing, error: existingError } = await existingQuery.single();

      if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = no encontrado
        throw existingError;
      }

      if (existing) {
        // Actualizar cantidad si ya existe
        const newQuantity = existing.quantity + quantity;
        const updateData = { 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        };

        // Actualizar el precio si se proporciona uno nuevo
        if (price) updateData.unit_price = price;
        
        // Actualizar el nombre del producto si se proporciona
        if (productName) updateData.product_name = productName;
        
        // Actualizar la imagen del producto si se proporciona
        if (productImage) updateData.product_image = productImage;

        const { data, error } = await supabase
          .from('cart_items')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Crear nuevo item
        const insertData = {
          customer_id: userId,  // Usar customer_id en lugar de user_id
          product_id: productId,
          quantity,
          unit_price: price,  // Usar unit_price en lugar de price
        };

        // Agregar campos opcionales solo si existen
        if (sessionId) insertData.session_id = sessionId;
        if (productName) insertData.product_name = productName;
        if (productImage) insertData.product_image = productImage;

        const { data, error } = await supabase
          .from('cart_items')
          .insert([insertData])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error en addItem:', error);
      throw error;
    }
  }

  /**
   * Actualizar cantidad de un item
   */
  async updateItemQuantity(itemId, quantity, userId = null, sessionId = null) {
    try {
      if (quantity <= 0) {
        return await this.removeItem(itemId, userId, sessionId);
      }

      let query = supabase
        .from('cart_items')
        .update({ 
          quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      // Verificar propiedad
      if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en updateItemQuantity:', error);
      throw error;
    }
  }

  /**
   * Eliminar item del carrito
   */
  async removeItem(itemId, userId = null, sessionId = null) {
    try {
      let query = supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      // Verificar propiedad
      if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en removeItem:', error);
      throw error;
    }
  }

  /**
   * Limpiar carrito completo
   */
  async clearCart(userId, sessionId = null) {
    try {
      let query = supabase
        .from('cart_items')
        .delete();

      // La tabla usa customer_id, no user_id
      if (userId) {
        query = query.eq('customer_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query.select();

      if (error) throw error;
      return { deletedItems: data.length };
    } catch (error) {
      console.error('Error en clearCart:', error);
      throw error;
    }
  }

  /**
   * Transferir carrito de sesión a usuario
   */
  async transferSessionCart(sessionId, userId) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ 
          user_id: userId,
          session_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select();

      if (error) throw error;
      return { transferredItems: data.length };
    } catch (error) {
      console.error('Error en transferSessionCart:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del carrito
   */
  async getCartStats(userId, sessionId = null) {
    try {
      const cartData = await this.getCartItems(userId, sessionId);
      
      const stats = {
        totalItems: cartData.summary.totalItems,
        totalAmount: cartData.summary.totalAmount,
        uniqueProducts: cartData.summary.itemCount,
        averageItemPrice: cartData.summary.itemCount > 0 
          ? Math.round((cartData.summary.totalAmount / cartData.summary.totalItems) * 100) / 100
          : 0,
        items: cartData.items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          subtotal: Math.round((item.quantity * item.price) * 100) / 100
        }))
      };

      return stats;
    } catch (error) {
      console.error('Error en getCartStats:', error);
      throw error;
    }
  }
}

module.exports = new CartService();