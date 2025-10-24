/**
 * Customer Service - Business logic layer
 * Handles all customer-related operations with Supabase
 */

const { supabase } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { logDatabase, logError } = require('../middleware/logger');

class CustomerService {
  
  /**
   * Get paginated list of customers with optional search and sorting
   */
  async getCustomers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'desc',
        search = ''
      } = options;

      // Calculate offset
      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' });

      // Add search filter
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Add sorting
      const ascending = sort_order === 'asc';
      query = query.order(sort_by, { ascending });

      // Add pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logError(error, { operation: 'getCustomers', options });
        throw error;
      }

      logDatabase('SELECT', 'customers', {
        count: data.length,
        total: count,
        page,
        search
      });

      return {
        customers: data,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logError(error, { operation: 'getCustomers', options });
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new AppError('Cliente no encontrado', 404, 'CUSTOMER_NOT_FOUND');
        }
        logError(error, { operation: 'getCustomerById', customerId: id });
        throw error;
      }

      logDatabase('SELECT', 'customers', { customerId: id });
      return data;

    } catch (error) {
      logError(error, { operation: 'getCustomerById', customerId: id });
      throw error;
    }
  }

  /**
   * Create new customer
   */
  async createCustomer(customerData) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new AppError('Email ya registrado', 409, 'EMAIL_ALREADY_EXISTS');
        }
        logError(error, { operation: 'createCustomer', customerData });
        throw error;
      }

      logDatabase('INSERT', 'customers', { 
        customerId: data.id,
        email: data.email 
      });

      return data;

    } catch (error) {
      logError(error, { operation: 'createCustomer', customerData });
      throw error;
    }
  }

  /**
   * Update customer by ID
   */
  async updateCustomer(id, updateData) {
    try {
      // First check if customer exists
      await this.getCustomerById(id);

      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new AppError('Email ya registrado', 409, 'EMAIL_ALREADY_EXISTS');
        }
        logError(error, { operation: 'updateCustomer', customerId: id, updateData });
        throw error;
      }

      logDatabase('UPDATE', 'customers', { 
        customerId: id,
        updatedFields: Object.keys(updateData)
      });

      return data;

    } catch (error) {
      logError(error, { operation: 'updateCustomer', customerId: id, updateData });
      throw error;
    }
  }

  /**
   * Delete customer by ID
   */
  async deleteCustomer(id) {
    try {
      // First check if customer exists
      await this.getCustomerById(id);

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        logError(error, { operation: 'deleteCustomer', customerId: id });
        throw error;
      }

      logDatabase('DELETE', 'customers', { customerId: id });
      return { message: 'Cliente eliminado exitosamente' };

    } catch (error) {
      logError(error, { operation: 'deleteCustomer', customerId: id });
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email, excludeId = null) {
    try {
      let query = supabase
        .from('customers')
        .select('id')
        .eq('email', email);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        logError(error, { operation: 'emailExists', email });
        throw error;
      }

      return data.length > 0;

    } catch (error) {
      logError(error, { operation: 'emailExists', email });
      throw error;
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    try {
      // Total customers
      const { count: totalCustomers, error: countError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw countError;
      }

      // Recent customers (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentCustomers, error: recentError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (recentError) {
        throw recentError;
      }

      logDatabase('SELECT', 'customers', { operation: 'getStats' });

      return {
        total_customers: totalCustomers,
        recent_customers: recentCustomers,
        growth_rate: totalCustomers > 0 ? ((recentCustomers / totalCustomers) * 100).toFixed(2) : 0
      };

    } catch (error) {
      logError(error, { operation: 'getCustomerStats' });
      throw error;
    }
  }
}

module.exports = new CustomerService();