<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'; 
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router'; 
import logo from '@/assets/emida-logo-square.png'; 
import logo2 from '@/assets/emida-logo-white.png'; 

const { toggleDarkMode, isDarkTheme } = useLayout();
const router = useRouter();

const logout = () => {
  localStorage.removeItem('token');
  router.push('/'); 
};

const currentLogo = computed(() => (isDarkTheme.value ? logo2 : logo));
const logoWidth = computed(() => (isDarkTheme.value ? '126px' : '150px'));
const logoStyle = computed(() => (isDarkTheme.value ? { marginLeft: '12px' } : {})); 

// Ref to hold current time
const currentTime = ref('');

// Function to update the time
const updateTime = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  // Convertir a formato de 12 horas y determinar AM/PM
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convierte "0" a "12" para las 12 AM

  // Formatear la hora con minutos, segundos y AM/PM
  currentTime.value = `${hours}:${minutes}:${seconds} ${period}`;
};

// Update time every second
onMounted(() => {
  updateTime(); // Initial call to set the time
  const interval = setInterval(updateTime, 1000);
  
  // Clean up interval on component unmount
  onUnmounted(() => {
    clearInterval(interval);
  });
});
</script>


<template>
  <div class="layout-topbar">
    <div class="layout-topbar-logo-container">
      <router-link to="/home" class="layout-topbar-logo">
        <img :src="currentLogo" :width="logoWidth" :style="logoStyle" alt="Logo" />
      </router-link>
      
      <!-- Logos de acceso a Jira y Zoho -->
      <div class="external-logos">
        <a href="https://www.atlassian.com/software/jira" target="_blank" class="external-logo">
          <img src="../assets/jira.png" alt="Jira Logo" width="70" />
        </a>
        <a href="https://www.zoho.com/" target="_blank" class="external-logo">
          <img src="../assets/zoho2.png" alt="Zoho Logo" width="70" />
        </a>
      </div>
    </div>

    <div class="layout-topbar-time" >
      <i class="pi pi-clock " style="margin-right: 3px;"></i>
      
      {{ currentTime }}
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

<style scoped>
.layout-topbar {
  
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.layout-topbar-logo-container {
  display: flex;
  align-items: center;
  margin-right: 20px; /* Espacio entre el logo y otros elementos */
}

.layout-topbar-logo {
  display: flex;
  justify-content: center;
  align-items: center;
}

.layout-topbar-time {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: var(--text-color); /* Ajusta según el color del tema */
  font-size: 16px;
  font-weight: bold;
}

.layout-topbar-logo img {
  width: 180px; /* Tamaño del logo, ajusta según el tamaño que necesites */
  height: auto; /* Mantiene la proporción */
}

.layout-topbar-logo-container:first-child {
  margin-right: 30px; /* Ajusta el margen si es necesario para más separación */
}

.layout-topbar-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;

}
.external-logos {
  display: flex;
  gap: 20px; /* Espacio entre los logos */
  align-items: center;
  margin-left: 10%;
}
</style>


