import axios from '../axios'; // Importa la instancia de Axios configurada con la baseURL y el interceptor

export const serverService = {
  async fetchServers() {
    try {
      const response = await axios.get('api/serversdb'); // El token y la baseURL se manejan automáticamente
      return response.data;
    } catch (error) {
      console.error('Error fetching servers:', error.response?.data || error.message);
      throw error;
    }
  },



  async createServer(serverData) {
    try {
      const response = await axios.post('api/serversdb/register', serverData); // El token y la baseURL se manejan automáticamente
      return response.data;
    } catch (error) {
      // Extract and format the error message
      const message = error.message || 'Registration failed';
      throw new Error(message);
    }
  },

  async updateServer(id, serverData) {
    try {
      const response = await axios.put(`api/serversdb/${id}`, serverData); // El token y la baseURL se manejan automáticamente
      return response.data;
    } catch (error) {
      const message = error.message || 'Update failed';
      throw new Error(message);
    }
  },

  async toggleServerStatus(id, status) {
    try {
      const response = await axios.patch(`api/serversdb/status/${id}`, null, {
        params: { status }, // El token y la baseURL se manejan automáticamente
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling server status:', error.response?.data || error.message);
      throw error;
    }
  },

  async deleteServer(id) {
    try {
      const response = await axios.delete(`api/serversdb/delete/${id}`); // El token y la baseURL se manejan automáticamente
      return response.data;
    } catch (error) {
      console.error('Error deleting server:', error.response?.data || error.message);
      throw error;
    }
  }
};
