import { createApp, ref } from 'vue';
import App from './App.vue';
import router from './router';
import vue3GoogleLogin from 'vue3-google-login';
import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import axios from './axios'; // Asegúrate de usar el archivo axios configurado

import '@/assets/styles.scss';
import '@/assets/tailwind.css';

const loadConfig = async () => {
  try {
    const response = await fetch('/config.json'); // Carga el archivo config.json desde la carpeta public
    const config = await response.json();

    // Configura Axios con baseURL desde config.json
    axios.defaults.baseURL = config.baseURL;

    console.log('Config loaded:', config);
    return config;
  } catch (error) {
    console.error('Error loading config.json:', error);
    throw error; // Detén la ejecución si no se puede cargar la configuración
  }
};

(async () => {
  try {
    const config = await loadConfig();

    const app = createApp(App);

    // Estado global
    const showHelp = ref(false);

    app.config.globalProperties.$help = {
      showHelp,
    };

    // Hacer config accesible globalmente
    app.config.globalProperties.$config = config;

    app.use(vue3GoogleLogin, {
      clientId: config.googleClientId, // Carga el clientId desde config.json
    });

    app.use(router);
    app.use(PrimeVue, {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark',
        },
      },
    });
    app.use(ToastService);
    app.use(ConfirmationService);

    app.mount('#app');
  } catch (error) {
    console.error('Error initializing the app:', error);
  }
})();
