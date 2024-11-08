import axios from '../axios'; // Importa la instancia de Axios configurada con la baseURL y el interceptor

export const serverService = {
  async createServer(serverData) {
    try {
      const response = await axios.post('api/agents/register', serverData); // El token y la baseURL se manejan automáticamente
      return response.data;
    } catch (error) {
      // Extract and format the error message
      const message = error.message || 'Registration failed';
      throw new Error(message);
    }
  },

  async getAllServers() {
    try {
      const response = await axios.get('api/agents'); // El token y la baseURL se manejan automáticamente
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error fetching servers');
    }
  },

  async getServerById(id) {
    try {
      const response = await axios.get(`api/agents/${id}`); // El token y la baseURL se manejan automáticamente
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error fetching server');
    }
  },

  async updateServer(agent) {
    try {
      const response = await axios.put(`api/agents/${agent.idAgent}`, agent); // El token y la baseURL se manejan automáticamente
      return response.data;
    } catch (error) {
      const message = error.message || 'Update failed';
      throw new Error(message);
    }
  },

  async updateServerStatus(idAgent) {
    try {
      const response = await axios.patch(`api/agents/status/${idAgent}`); // El token y la baseURL se manejan automáticamente
      return response.data;
    } catch (error) {
      console.error('Error updating server status:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  async loadServersByRegion(idRegion) {
    try {
      const response = await axios.get(`api/agents/region/${idRegion}`); // El token y la baseURL se manejan automáticamente
      return response.data;
    } catch (error) {
      console.error('Error fetching servers by region:', error.response ? error.response.data : error.message);
      throw new Error(error.response?.data?.message || 'Error fetching servers by region');
    }
  },

  async deleteAgent(idAgent) {
    try {
      const response = await axios.delete(`api/agents/delete/${idAgent}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting agent:', error.response ? error.response.data : error.message);
      throw new Error(error.response?.data?.message || 'Error deleting agent');
    }
  }
};
