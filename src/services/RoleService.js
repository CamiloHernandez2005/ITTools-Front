import axios from '../axios';

export const roleService = {
  
  // Obtener todos los roles
  async getRoles() {
    try {
      const response = await axios.get('/roles');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      throw new Error(error.response?.data || 'Failed to fetch roles');
    }
  },

  // Registrar un nuevo rol
  async registerRole(roleData) {
    try {
      const response = await axios.post('/roles', roleData);
      return response.data;
    } catch (error) {
      // Extract and format the error message
      const message = error.message || 'Registration failed';
      throw new Error(message);
    }
  },

  // Actualizar un rol existente
  async updateRole(roleId, roleData) {
    try {
      const response = await axios.put(`/roles/${roleId}`, roleData);
      return response.data;
    } catch (error) {
      const message = error.message || 'Update failed';
      throw new Error(message);
    }
  },

  // Eliminar un rol
  async deleteRole(roleId) {
    try {
      await axios.delete(`/roles/${roleId}`);
    } catch (error) {
      const message = error.message || 'Delete failed';
      throw new Error(message);
    }
  }
};
