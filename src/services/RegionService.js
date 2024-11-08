import axios from '../axios'; // Importa la instancia de Axios configurada

export const regionService = {
  async getAllRegions() {
    try {
      const response = await axios.get('/api/regions'); // No necesitas agregar el baseURL aquí
      return response.data;
    } catch (error) {
      console.error('Error fetching regions:', error.response?.data || error.message);
      throw error;
    }
  },

  async createRegion(region) {
    try {
      const response = await axios.post('/api/regions/register', region); // El token se incluye automáticamente
      return response.data;
    } catch (error) {
      console.error('Error creating region:', error.response?.data || error.message);
      throw error;
    }
  },

  async updateRegion(id, region) {
    try {
        const response = await axios.put(`/api/regions/${id}`, region); // El token se incluye automáticamente
        return response.data;
    } catch (error) {
        console.error('Error updating region:', error.response?.data || error.message);
        throw error;
    }
},


  async updateRegionStatus(id, status) {
    try {
      const response = await axios.patch(`/api/regions/status/${id}`, null, {
        params: { status } // El token se incluye automáticamente
      });
      return response.data;
    } catch (error) {
      console.error('Error updating region status:', error.response?.data || error.message);
      throw error;
    }
  },
  async deleteRegion(id) {
    try {
      const response = await axios.delete(`/api/regions/delete/${id}`);
      return response;
    } catch (error) {  
      // Si `error.response` no está definido, utiliza el mensaje de error directamente
      const message = error.response?.data || error.message || 'Delete failed';
      throw new Error(message);
    }
  }
  
  


};
