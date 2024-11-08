<script setup>
import { computed } from 'vue'; // Asegúrate de importar 'computed'
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router'; // Importa useRouter para redireccionar
import logo from '@/assets/emida-logo-square.png'; // Logo para modo claro
import logo2 from '@/assets/emida-logo-white.png'; // Logo para modo oscuro

const { toggleDarkMode, isDarkTheme } = useLayout();
const router = useRouter();

const logout = () => {
  localStorage.removeItem('token');
  router.push('/'); // Redirige al usuario a la página de inicio de sesión
};

// Computed para cambiar entre logos, tamaños y estilos según el tema
const currentLogo = computed(() => (isDarkTheme.value ? logo2 : logo));
const logoWidth = computed(() => (isDarkTheme.value ? '126px' : '150px'));
const logoStyle = computed(() => (isDarkTheme.value ? { marginLeft: '12px' } : {})); // Margen solo para logo 2
</script>

<template>
  <div class="layout-topbar">
    <div class="layout-topbar-logo-container">
      <router-link to="/home" class="layout-topbar-logo">
        <img :src="currentLogo" :width="logoWidth" :style="logoStyle" alt="Logo" /> <!-- Estilo dinámico -->
      </router-link>
    </div>

    <div class="layout-topbar-actions">
  <div class="layout-config-menu">
    <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
      <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
    </button>
  </div>

  <button
    class="layout-topbar-menu-button layout-topbar-action"
    v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
  >
    <i class="pi pi-ellipsis-v"></i>
  </button>

  <!-- Botón de About -->
  <button type="button" class="layout-topbar-action" @click="openAbout">
    <i class="pi pi-info-circle"></i>
    <span>About</span>
  </button>

  <!-- Botón de Logout -->
  <button type="button" class="layout-topbar-action" @click="logout">
    <i class="pi pi-sign-out"></i>
    <span>Logout</span>
  </button>
</div>

  </div>
</template>
