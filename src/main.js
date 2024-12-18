import { createApp, ref } from 'vue';
import App from './App.vue';
import router from './router';
import vue3GoogleLogin from 'vue3-google-login';
import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';

const app = createApp(App);

// Estado global
const showHelp = ref(false);

app.config.globalProperties.$help = {
  showHelp,
};

app.use(vue3GoogleLogin, {
  clientId: '45560386020-p8mrmnc39q2v6v6e55ddmmb8gmffvmih.apps.googleusercontent.com',
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
