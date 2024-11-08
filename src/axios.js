import axios from 'axios';

// Configure Axios
axios.defaults.baseURL = 'http://192.168.2.148:5000'; // Change according to your baseURL

// Request interceptor to include the JWT token
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token'); // Get JWT token from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401)) {
      localStorage.removeItem('token');
      window.location.href = '/';
  }
  

    // Aquí se extrae el mensaje de error del backend
    const errorMessage = error.response?.data || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);


export default axios;
