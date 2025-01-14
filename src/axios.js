import axios from 'axios';

// Variable para verificar si ya se cargó la configuración
let isConfigLoaded = false;

// Función para cargar configuración de Axios
async function loadAxiosConfig() {
  if (!isConfigLoaded) {
    try {
      const response = await fetch('/config.json'); // Carga el archivo config.json
      const config = await response.json();

      // Configura Axios dinámicamente con baseURL
      axios.defaults.baseURL = config.baseURL;

      console.log('Axios configurado con baseURL:', config.baseURL);

      isConfigLoaded = true; // Evita recargar configuración innecesariamente
    } catch (error) {
      console.error('Error cargando config.json:', error);
    }
  }
}

// Interceptor de solicitudes para incluir el JWT token
axios.interceptors.request.use(
  async (config) => {
    if (!isConfigLoaded) {
      await loadAxiosConfig(); // Asegúrate de que la configuración esté cargada antes de enviar solicitudes
    }

    const token = localStorage.getItem('token'); // Obtiene el token JWT desde localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para manejar expiración de tokens y errores del backend
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      window.location.href = '/'; // Redirige al inicio de sesión
    }

    // Extraer mensaje de error del backend
    const errorMessage = error.response?.data || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export default axios;
