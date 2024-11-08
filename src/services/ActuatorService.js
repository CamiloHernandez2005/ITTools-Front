import axios from '../axios'; // Asegúrate de que la ruta sea correcta

const ActuatorService = {
  // Obtener información de salud
  async getHealth() {
    try {
      const response = await axios.get('/actuator/health');
      return response.data;
    } catch (error) {
      console.error('Error al obtener el estado de salud:', error.message);
      throw error;
    }
  },

  async getRequest() {
    try {
      const response = await axios.get('/request');
      return response.data; // Asegúrate de que el formato es correcto
    } catch (error) {
      console.error('Error al obtener los datos de las solicitudes:', error.message);
      throw error;
    }
  },

  async getUptime() {
    const response = await axios.get('/actuator/metrics/process.uptime');
    return response.data.measurements[0].value; // Devuelve el uptime en segundos
  },

  // ActuatorService.js
  async getAuditData() {
  return await axios.get('audits'); // Cambia la URL según tu API
}

}



export default ActuatorService;
