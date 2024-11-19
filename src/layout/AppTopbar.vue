<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import ActuatorService from '@/services/ActuatorService';
import logo from '@/assets/emida-logo-square.png';
import logo2 from '@/assets/emida-logo-white.png';

const { toggleDarkMode, isDarkTheme } = useLayout();
const router = useRouter();

const logout = () => {
  localStorage.removeItem('token');
  router.push('/');
};

const audits = ref([]);
const currentLogo = computed(() => (isDarkTheme.value ? logo2 : logo));
const logoWidth = computed(() => (isDarkTheme.value ? '126px' : '180px'));
const logoStyle = computed(() => (isDarkTheme.value ? { marginLeft: '12px' } : {}));

const currentTime = ref('');
const updateTime = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  currentTime.value = `${hours}:${minutes}:${seconds} ${period}`;
};

const fetchAuditData = async () => {
  try {
    const response = await ActuatorService.getAuditData();
    audits.value = response.data.map(audit => ({
      ...audit,
      userAction: audit.userAction.replace(/, ID: \d+/g, '')
    }));
  } catch (error) {
    console.error('Error fetching audit data:', error);
  }
};


// Función para calcular el tiempo transcurrido
const timeAgo = (dateTime) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(dateTime)) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} segundos atrás`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} horas atrás`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} días atrás`;
};

const today = new Date();
today.setHours(0, 0, 0, 0);

const filteredAudits = computed(() => {
  const filtered = audits.value.filter(audit => {
    const auditDate = new Date(audit.dateTime);
    auditDate.setHours(0, 0, 0, 0);
    const isToday = auditDate.getTime() === today.getTime();
    const isRelevantAction = /create|update|delete/i.test(audit.userAction);
    return isToday && isRelevantAction;
  });
  const sorted = filtered.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  return sorted.slice(0, 5);
});

onMounted(() => {
  updateTime();
  fetchAuditData();
  const interval = setInterval(updateTime, 1000);
  onUnmounted(() => {
    clearInterval(interval);
  });
});

const showNotifications = ref(false);

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
};

const goToAudits = () => {
  showNotifications.value = false;
  router.push('/uikit/Audit');
};
</script>

<template>
  <div class="layout-topbar">
    <div class="layout-topbar-logo-container">
      <router-link to="/home" class="layout-topbar-logo">
        <img :src="currentLogo" :width="logoWidth" :style="logoStyle" alt="Logo" />
      </router-link>
      <div class="external-logos">
        <a href="https://www.atlassian.com/software/jira" target="_blank" class="external-logo">
          <img src="../assets/jira.png" alt="Jira Logo" width="70" />
        </a>
        <a href="https://www.zoho.com/" target="_blank" class="external-logo">
          <img src="../assets/zoho2.png" alt="Zoho Logo" width="70" />
        </a>
      </div>
    </div>

    <div class="layout-topbar-time">
      <i class="pi pi-clock" style="margin-right: 3px;"></i>
      {{ currentTime }}
    </div>

    <div class="layout-topbar-actions">
      <div class="layout-config-menu">
        <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
          <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
        </button>
      </div>

  <!-- Botón de Notificaciones -->
<div class="relative">
  <button type="button" class="layout-topbar-action flex items-center relative" @click="toggleNotifications">
    <i class="pi pi-bell text-2xl"></i>
    <span v-if="filteredAudits.length > 0"
      class="absolute top-0 right-0 bg-red-500 text-white text-sm font-semibold rounded-full h-6 w-6 flex items-center justify-center -mt-3 -mr-3">
      {{ filteredAudits.length }}
    </span>
  </button>

  <!-- Panel de Notificaciones -->
  <div v-if="showNotifications"
    class="notifications-panel absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
    <!-- Encabezado -->
    <header class="text-gray-800 font-semibold text-center py-3 rounded-t-lg">
      Notifications
    </header>

    <ul class="notifications-list max-h-52 overflow-y-auto">
      <!-- Mensaje si no hay notificaciones -->
      <li v-if="filteredAudits.length === 0" class="p-3 text-gray-500 ml-4">
        No notifications for today
      </li>

      <!-- Lista de notificaciones cuando existen -->
      <li v-for="(audit, index) in filteredAudits" :key="index"
        class="notification-item p-3 border-b last:border-b-0 text-sm text-gray-700 cursor-pointer flex justify-between items-center ml-4 mr-4"
        @click="goToAudits">
        <!-- Contenedor izquierdo para el mensaje -->
        <div class="flex items-center">
          <i class="pi pi-check mr-2 text-green-500"></i>
          {{ audit.userAction.replace(/, ID: \d+/g, '') }}
        </div>

        <!-- Contenedor derecho para el tiempo transcurrido -->
        <span class="text-gray-500">{{ timeAgo(audit.dateTime) }}</span>
      </li>
    </ul>

    <!-- Pie de Página con Botón -->
    <footer class="p-2 rounded-b-lg flex justify-end border-t border-gray-200">
      <button @click="goToAudits" class="p-button p-button-sm mt-2" id="create-button">
        See all activities
      </button>
    </footer>
  </div>
</div>


      <button class="layout-topbar-menu-button layout-topbar-action"
        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }">
        <i class="pi pi-ellipsis-v"></i>
      </button>

      <button type="button" class="layout-topbar-action" @click="openAbout">
        <i class="pi pi-info-circle"></i>
        <span>About</span>
      </button>

      <button type="button" class="layout-topbar-action" @click="logout">
        <i class="pi pi-sign-out"></i>
        <span>Logout</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
#create-button {
  background: #64c4ac;
  color: white;
  border-color: #64c4ac;
}

#create-button:hover {
  background: white;
  color: #64c4ac;
  border-color: #64c4ac;
}

.layout-topbar {

  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.layout-topbar-logo-container {
  display: flex;
  align-items: center;
  margin-right: 20px;
  /* Espacio entre el logo y otros elementos */
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
  color: var(--text-color);
  /* Ajusta según el color del tema */
  font-size: 16px;
  font-weight: bold;
}


.layout-topbar-logo-container:first-child {
  margin-right: 30px;
  /* Ajusta el margen si es necesario para más separación */
}

.layout-topbar-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;

}

.external-logos {
  display: flex;
  gap: 20px;
  /* Espacio entre los logos */
  align-items: center;
  margin-left: 10%;
}

.notification-item:hover {
  border-radius: 4px;
  background-color: aliceblue;
}
</style>
