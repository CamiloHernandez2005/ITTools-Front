// authService.js
import axios from '../axios';

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

export const authService = {
    inactivityTimeout: null,

    

    async login(email, password) {
        try {
            const response = await axios.post('/auth/login', { email, password });
            const token = response.data;
            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('userEmail', email); // Guardar el email
                this.startInactivityTimer();
                return { token };
            } else {
                throw new Error('Token not found in response');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw new Error(error.response?.data || 'Login failed');
        }
    },
    async loginWithGoogle(googleToken) {
        try {
            const response = await axios.post('/auth/login/google', { token: googleToken });
            const token = response.data;
            if (token) {
                localStorage.setItem('token', token);
                this.startInactivityTimer();
                return { token };
            } else {
                throw new Error('Token not found in response');
            }
        } catch (error) {
            console.error('Google login error:', error);
            throw new Error(error.response?.data || 'Google login failed');
        }
    },

    async refreshAccessToken() {
      const refreshToken = localStorage.getItem('jiraRefreshToken');
      if (!refreshToken) {
          console.error('No refresh token available');
          return;
      }
  
      try {
          const response = await axios.post('/jira/refresh-token', {
              refresh_token: refreshToken
          });
  
          if (response.data && response.data.access_token && response.data.refresh_token) {
              const accessToken = response.data.access_token;
              const newRefreshToken = response.data.refresh_token;
  
              // Guardar los nuevos tokens en localStorage
              localStorage.setItem('jiraAccessToken', accessToken);
              localStorage.setItem('jiraRefreshToken', newRefreshToken);

          } else {
              console.error('Tokens not found in the response');
          }
      } catch (error) {
          console.error('Error refreshing tokens:', error.response ? error.response.data : error.message);
      }
  },
  
  async sendAuthCodeToBackend(code) {
    const existingAccessToken = localStorage.getItem('jiraAccessToken');
    if (existingAccessToken) {
        console.log('Access token already exists. Skipping request to /jira/token.');
        return; // No haces nada si ya existe un token
    }

    const codeVerifier = localStorage.getItem('codeVerifier');
    if (!codeVerifier) {
        console.error('Code verifier is missing.');
        return;
    }

    // Asegurarse de que la configuración de axios esté cargada antes de realizar la solicitud
    await loadAxiosConfig(); // Esperar que la configuración se cargue

    try {
        const response = await axios.post('/jira/token', {
            code: code,
            code_verifier: codeVerifier
        });

        if (response.data && response.data.access_token && response.data.refresh_token) {
            const accessToken = response.data.access_token;
            const refreshToken = response.data.refresh_token;

            localStorage.setItem('jiraAccessToken', accessToken);
            localStorage.setItem('jiraRefreshToken', refreshToken);

            console.log('Access Token and Refresh Token saved.');
        } else {
            console.error('Access token or refresh token not found in the response');
        }
    } catch (error) {
        console.error('Error fetching access token:', error.response ? error.response.data : error.message);
    }
}
,



    handleAuthCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            this.sendAuthCodeToBackend(code); // Envía el código al backend
        }
    },

    startInactivityTimer() {
        this.clearInactivityTimer();
        this.inactivityTimeout = setTimeout(
            () => {
                this.logout(); // Cierra sesión tras 30 minutos de inactividad
            },
            30 * 60 * 1000
        ); // 30 minutos
    },

    clearInactivityTimer() {
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
            this.inactivityTimeout = null;
        }
    },

    resetInactivityTimer() {
        this.startInactivityTimer();
    },

    logout() {
        localStorage.removeItem('token');
        this.clearInactivityTimer();
    },

    getToken() {
        return localStorage.getItem('token');
    },

    async getUsers() {
        try {
            const response = await axios.get('/users');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch users:', error);
            throw new Error(error.response?.data || 'Failed to fetch users');
        }
    },

    async deleteUser(userId) {
        try {
            await axios.delete(`/users/${userId}`);
        } catch (error) {
            console.error('Delete failed:', error);
            throw new Error(error.response?.data || 'Delete failed');
        }
    },

    async updateUser(userData) {
        try {
            const response = await axios.put(`/users/${userData.id}`, userData);
            return response.data;
        } catch (error) {
            // Extract and format the error message
            const message = error.message || 'Update failed';
            throw new Error(message);
        }
    }
};
authService.handleAuthCode();

export const registerUser = async (userData) => {
    try {
        const response = await axios.post('/auth/register', userData);
        return response.data; // Return response data if successful
    } catch (error) {
        // Extract and format the error message
        const message = error.message || 'Registration failed';
        throw new Error(message);
    }

    
};
