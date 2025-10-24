import { BaseApiService } from './apiService.js';

/**
 * Servicio para manejar operaciones relacionadas con usuarios
 */
class UserService extends BaseApiService {
  constructor() {
    super('http://localhost:3001/api/customers');
  }

  /**
   * Obtiene la información de un usuario por su ID
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Información del usuario
   */
  async getUserInfo(userId) {
    try {
      const response = await this.get(`/${userId}`);
      return response.data || response;
    } catch (error) {
      console.error('Error al obtener información del usuario:', error);
      throw error;
    }
  }

  /**
   * Actualiza la información de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  async updateUserInfo(userId, userData) {
    try {
      const response = await this.put(`/${userId}`, userData);
      return response.data || response;
    } catch (error) {
      console.error('Error al actualizar información del usuario:', error);
      throw error;
    }
  }
}

// Crear instancia del servicio
const userService = new UserService();

export default userService;