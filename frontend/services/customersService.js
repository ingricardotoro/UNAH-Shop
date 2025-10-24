import { BaseApiService } from './apiService.js';

/**
 * Servicio para la gestión completa de customers
 */
class CustomersService extends BaseApiService {
  constructor() {
    super('http://localhost:3001/api/customers');
  }

  /**
   * Obtiene la lista de customers con paginación
   * @param {Object} params - Parámetros de consulta
   * @param {number} params.page - Número de página (1-based)
   * @param {number} params.limit - Cantidad de registros por página
   * @param {string} params.search - Término de búsqueda
   * @param {string} params.sortBy - Campo por el cual ordenar
   * @param {string} params.sortOrder - Orden (asc/desc)
   * @returns {Promise<Object>} Lista paginada de customers
   */
  async getCustomers(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = ''
      } = params;

      // Obtener customers con parámetros de paginación
      console.log('Intentando obtener customers con params:', params);
      
      // Solo enviar parámetros que el backend acepta
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Agregar búsqueda solo si existe
      if (search.trim()) {
        queryParams.append('search', search.trim());
      }

      // Nota: sortBy y sortOrder no son aceptados por este backend

      const url = `?${queryParams}`;
      console.log('URL completa:', `${this.baseUrl}${url}`);
      const response = await this.get(url);

      console.log('Respuesta del API:', response);

      // Manejar diferentes formatos de respuesta del API
      if (response.success && response.data) {
        // Formato: { success: true, data: [...], pagination: {...} }
        const result = {
          data: response.data,
          total: response.pagination?.total || response.total || response.data.length,
          customers: response.data,
          pagination: response.pagination,
        };
        console.log('Resultado procesado:', result);
        return result;
      } else if (Array.isArray(response)) {
        // Formato: [...]
        return {
          data: response,
          total: response.length,
          customers: response,
        };
      } else if (response.data && Array.isArray(response.data)) {
        // Formato: { data: [...] }
        return {
          data: response.data,
          total: response.total || response.data.length,
          customers: response.data,
        };
      }

      return response;
    } catch (error) {
      console.error('Error al obtener customers:', error);
      
      // Devolver datos de respaldo para depuración
      return {
        data: [],
        total: 0,
        customers: [],
        error: error.message,
      };
    }
  }

  /**
   * Obtiene un customer por su ID
   * @param {string} customerId - ID del customer
   * @returns {Promise<Object>} Información del customer
   */
  async getCustomer(customerId) {
    try {
      const response = await this.get(`/${customerId}`);
      return response.data || response;
    } catch (error) {
      console.error('Error al obtener customer:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo customer
   * @param {Object} customerData - Datos del customer
   * @returns {Promise<Object>} Customer creado
   */
  async createCustomer(customerData) {
    try {
      const response = await this.post('', customerData);
      return response.data || response;
    } catch (error) {
      console.error('Error al crear customer:', error);
      throw error;
    }
  }

  /**
   * Actualiza un customer
   * @param {string} customerId - ID del customer
   * @param {Object} customerData - Datos a actualizar
   * @returns {Promise<Object>} Customer actualizado
   */
  async updateCustomer(customerId, customerData) {
    try {
      const response = await this.put(`/${customerId}`, customerData);
      return response.data || response;
    } catch (error) {
      console.error('Error al actualizar customer:', error);
      throw error;
    }
  }

  /**
   * Elimina un customer
   * @param {string} customerId - ID del customer
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteCustomer(customerId) {
    try {
      const response = await this.delete(`/${customerId}`);
      return response;
    } catch (error) {
      console.error('Error al eliminar customer:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de customers
   * @returns {Promise<Object>} Estadísticas
   */
  async getCustomersStats() {
    try {
      // Intentar obtener estadísticas del endpoint dedicado
      const response = await this.get('/stats');
      console.log('Respuesta del endpoint /stats:', response);
      
      // El endpoint devuelve: total_customers, recent_customers, growth_rate
      // Necesitamos mapear a nuestro formato esperado
      const statsData = response.data || response;
      
      return {
        total: Number(statsData.total_customers) || 0,
        newThisMonth: Number(statsData.recent_customers) || 0,
        activeUsers: Number(statsData.recent_customers) || 0, // Usar recent_customers como aproximación
        growthRate: statsData.growth_rate || '0',
      };
    } catch (error) {
      console.warn(
        'Endpoint /stats no disponible, calculando manualmente:',
        error
      );
      
      // Si no hay endpoint de stats, calcular manualmente
      try {
        // Obtener todos los customers para calcular estadísticas
        console.log('Obteniendo todos los customers para estadísticas...');
        const allCustomersResponse = await this.get('?limit=1000'); // Límite alto para obtener todos
        console.log('Respuesta completa para stats:', allCustomersResponse);
        
        const customers = allCustomersResponse.data || allCustomersResponse.customers || [];
        console.log('Customers encontrados:', customers.length, customers);
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        console.log('Fecha actual:', now, 'Mes:', currentMonth, 'Año:', currentYear);
        
        // Calcular estadísticas
        const total = customers.length;
        console.log('Total calculado:', total);
        
        // Customers nuevos este mes
        const customersThisMonth = customers.filter((customer) => {
          const createdDate = new Date(customer.created_at);
          return (
            createdDate.getMonth() === currentMonth &&
            createdDate.getFullYear() === currentYear
          );
        });
        const newThisMonth = customersThisMonth.length;
        console.log('Customers este mes (fallback):', newThisMonth);
        
        // Usuarios activos (customers que se registraron en los últimos 30 días)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        console.log('Fecha límite (30 días atrás):', thirtyDaysAgo);
        
        const activeCustomers = customers.filter((customer) => {
          const createdDate = new Date(customer.created_at);
          return createdDate >= thirtyDaysAgo;
        });
        const activeUsers = activeCustomers.length;
        console.log('Usuarios activos (fallback):', activeUsers);
        
        return {
          total,
          newThisMonth,
          activeUsers,
        };
      } catch (fallbackError) {
        console.error(
          'Error calculando estadísticas manualmente:',
          fallbackError
        );
        return {
          total: 0,
          newThisMonth: 0,
          activeUsers: 0,
        };
      }
    }
  }
}

// Crear instancia del servicio
const customersService = new CustomersService();

export default customersService;