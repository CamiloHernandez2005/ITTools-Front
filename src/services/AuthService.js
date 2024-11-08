// authService.js
import axios from '../axios';

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
  }
  ,

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

  startInactivityTimer() {
    this.clearInactivityTimer();
    this.inactivityTimeout = setTimeout(() => {
      this.logout(); // Cierra sesión tras 30 minutos de inactividad
    }, 30 * 60 * 1000); // 30 minutos
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