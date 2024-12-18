<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import ActuatorService from '@/services/ActuatorService';
import { authService } from '@/services/AuthService';
import logo from '@/assets/emida-logo-square.png';
import logo2 from '@/assets/emida-logo-white.png';
import { getCurrentInstance } from 'vue';


const { proxy } = getCurrentInstance();

const toggleHelp = () => {
  if (!proxy.$help) {
    console.error("El objeto $help no está definido.");
    return;
  }
  proxy.$help.showHelp.value = !proxy.$help.showHelp.value; // Cambiar el estado global
  console.log("Estado actualizado de showHelp desde NavTop:", proxy.$help.showHelp.value);
};


const { toggleDarkMode, isDarkTheme } = useLayout();

const router = useRouter();



const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('jiraAccessToken');
  localStorage.removeItem('codeVerifier');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('jiraRefreshToken');
  router.push('/');
};

const audits = ref([]);
const currentLogo = computed(() => (isDarkTheme.value ? logo2 : logo));
const logoWidth = computed(() => (isDarkTheme.value ? '130px' : '190px'));
const logoStyle = computed(() => (isDarkTheme.value ? { marginLeft: '9px' } : {}));

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
    audits.value = response.data || [];
  } catch (error) {
    console.error('Error fetching audit data:', error);
  }
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

const isAdmin = ref(false);

const checkUserRole = async () => {
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) {
    console.error('No se encontró userEmail en el localStorage');
    return;
  }

  try {
    const users = await authService.getUsers();
    const user = users.find((u) => u.email === userEmail);

    if (user && user.roles) {
      isAdmin.value = user.roles.includes('ADMIN');
    } else {
      console.error('No se encontró el usuario o los roles no están definidos');
      isAdmin.value = false;
    }
  } catch (error) {
    console.error('Error al verificar roles del usuario:', error);
    isAdmin.value = false;
  }
};

onMounted(() => {
  updateTime();
  fetchAuditData();
  checkUserRole(); // Verifica el rol del usuario usando `authService.getUsers`
  const interval = setInterval(updateTime, 1000);
  onUnmounted(() => {
    clearInterval(interval);
  });
});

const showNotifications = ref(false);

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
};

const goToAudits = (notification) => {
  showNotifications.value = false;

  if (!isAdmin.value) {
    router.push('/homeusers');
    return;
  }

  if (notification) {
    const lowerCaseNotification = notification.toLowerCase();
    if (lowerCaseNotification.includes('user')) {
      router.push({ name: 'formlayout' });
    } else if (lowerCaseNotification.includes('role')) {
      router.push({ name: 'Roles' });
    } else if (lowerCaseNotification.includes('region')) {
      router.push({ name: 'RegionList' });
    } else if (lowerCaseNotification.includes('agent')) {
      router.push({ name: 'Agents' });
    } else if (lowerCaseNotification.includes('server')) {
      router.push({ name: 'ServersDB' });
    } else {
      console.warn('No se encontró un módulo correspondiente para la notificación');
    }
  } else {
    router.push('/uikit/Audit');
  }
};

const goToAuditPage = () => {
  showNotifications.value = false;
  router.push('/uikit/Audit');
};
</script>


<template>
  <div class="layout-topbar border">
    <div class="layout-topbar-logo-container">
      <router-link :to="isAdmin ? '/home' : '/homeusers'" class="layout-topbar-logo mr-4">
        <img :src="currentLogo" :width="logoWidth" :style="logoStyle" alt="Logo" />
      </router-link>
      <div class="external-logos">
        <a href="https://www.atlassian.com/software/jira" target="_blank" class="external-logo">
          <img src="../assets/jira.png" alt="Jira Logo" width="100" />
        </a>
        <a href="https://www.zoho.com/" target="_blank" class="external-logo">
          <img src="../assets/zoho2.png" alt="Zoho Logo" width="100" />
        </a>
        <a href="https://mail.google.com/chat/" target="_blank" class="external-logo">
          <img src="../assets/logochat.png" alt="chat Logo" width="100" />
        </a>
        <a href="https://intrnet.emida.com" target="_blank" class="external-logo">
          <img src="../assets/IT.jpg" alt="chat Logo" width="60" />
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

          <!-- Lista de Notificaciones -->
          <div class="notifications-list max-h-52 overflow-y-auto">
            <!-- Mostrar mensaje si no hay notificaciones -->
            <p v-if="filteredAudits.length === 0" class="text-gray-500  ml-4 mr-4  py-4">
              No notifications for today
            </p>

            <ul v-else>
              <li v-for="(audit, index) in filteredAudits" :key="index"
                class="notification-item p-3 border-b last:border-b-0 text-sm text-gray-700 cursor-pointer flex items-center ml-4 mr-4"
                @click="goToAudits(audit.userAction)">
                <i class="pi pi-check mr-2 text-green-500"></i>
                {{ audit.userAction }}
              </li>
            </ul>
          </div>

          <!-- Pie de página -->
          <footer class="p-2 rounded-b-lg flex justify-end border-t border-gray-200">
            <!-- Mostrar el botón solo si el usuario es administrador -->
            <button v-if="isAdmin" @click="goToAuditPage" class="p-button p-button-sm mt-2" id="create-button">
              See all activities
            </button>
            
          </footer>

        </div>
      </div>



      <button class="layout-topbar-menu-button layout-topbar-action"
        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }">
        <i class="pi pi-ellipsis-v"></i>
      </button>
      <button @click="toggleHelp" class="layout-topbar-action" > <i class="pi pi-question-circle"></i></button>

      <button  type="button" class="layout-topbar-action" @click="logout">
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

.layout-topbar-time {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: var(--text-color);
  font-size: 16px;
  font-weight: bold;
}

.external-logos {
  display: flex;
  gap: 8px;
  align-items: center;
}

.notification-item:hover {
  border-radius: 4px;
  background-color: aliceblue;
}
</style>
