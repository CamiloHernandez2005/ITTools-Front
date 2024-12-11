<template>
    <ul class="layout-menu">
        <li class="layout-menu-item">
            <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
                <i class="pi pi-bars menu-icon"></i>
            </button>
        </li>
        <template v-for="(item, i) in model" :key="item.label">
            <app-menu-item 
                v-if="!item.separator" 
                :item="item" 
                :index="i" 
                :class="item.class" 
                @click="handleMenuClick(item.id)" 
            />
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<script setup>
import { useLayout } from '@/layout/composables/layout';
import { ref, computed } from 'vue';
import { authService } from '@/services/AuthService';
import AppMenuItem from './AppMenuItem.vue';

const { onMenuToggle } = useLayout();

const isAdmin = ref(false); // Para verificar si el usuario es admin

const handleMenuClick = (id) => {
    if (id === 'support') {
        if (!jiraAccessTokenExists.value) {
            handleJiraLogin();
        }
    }
};

// Verifica si el token existe en localStorage
const jiraAccessTokenExists = computed(() => {
    return !!localStorage.getItem('jiraAccessToken');
});

const generateCodeVerifier = () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let codeVerifier = '';
    for (let i = 0; i < 128; i++) {
        codeVerifier += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return codeVerifier;
};

const handleJiraLogin = async () => {
    const codeVerifier = generateCodeVerifier();
    localStorage.setItem('codeVerifier', codeVerifier);

    const clientId = 'WqIezgIRXTVMWie5sQpl0PZh1WcLxR9R';
    const redirectUri = encodeURIComponent('http://localhost:5173/uikit/Support');
    const state = 'randomState123';
    const scope = 'read:jira-user write:jira-work read:me offline_access'; // Agregamos el scope read:me
    const encodedScope = encodeURIComponent(scope); // Codificamos correctamente los scopes
    const authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}&scope=${encodedScope}&prompt=consent`;

    window.location.href = authUrl;
};


// Función para verificar y cargar el rol del usuario
const loadUserRole = async () => {
    // Eliminar roles almacenados en localStorage si existen
    localStorage.removeItem('roles');

    // Obtener el email del usuario del localStorage
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        console.error('No se encontró userEmail en el localStorage');
        return;
    }

    try {
        // Llamar a getUsers para obtener los datos del usuario
        const users = await authService.getUsers();
        const user = users.find((u) => u.email === userEmail);

        if (user && user.roles) {
            // Guardar el rol en localStorage
            // Verificar si el usuario es ADMIN
            isAdmin.value = user.roles.includes('ADMIN');
        } else {
            console.error('No se encontró el usuario o los roles no están definidos');
        }
    } catch (error) {
        console.error('Error al obtener los roles del usuario:', error);
    }
};

// Llamar a la función loadUserRole al montar el componente
loadUserRole();

// Modelo del menú, con lógica basada en los roles del usuario
const model = computed(() => {
    const menu = [
        {
            label: 'Admin home',
            icon: 'pi  pi-fw pi-prime',
            to: '/home',
        },
        {
            label: 'Home',
            icon: 'pi pi-fw pi-home',
            to: '/homeusers',
        },
        {
            label: 'Tools',
            icon: 'pi pi-fw pi-cog',
            items: [
                { label: 'Users', icon: 'pi pi-fw pi-users', to: '/uikit/Users' },
                { label: 'Roles', icon: 'pi pi-fw pi-shield', to: '/uikit/Roles' },
                { label: 'Regions', icon: 'pi pi-fw pi-globe', to: '/uikit/RegionList' },
            ],
        },
        {
            label: 'Servers',
            icon: 'pi pi-fw pi-server',
            items: [
                { label: 'ServersDB', icon: 'pi pi-fw pi-database', to: '/uikit/ServersDB' },
                { label: 'Agents', icon: 'pi pi-fw pi-cloud', to: '/uikit/Agents' },
            ],
        },
        {
            label: 'Logs',
            icon: 'pi pi-fw pi-folder',
            items: [
                { label: 'Find in a log file', icon: 'pi pi-fw pi-search-plus', to: '/uikit/FindLog' },
                { label: 'Multi find logs', icon: 'pi pi-fw pi-search', to: '/uikit/FindLogTran' },
                { label: 'Logs', icon: 'pi pi-fw pi-share-alt', to: '/uikit/LogTran' },
                { label: 'Archive logs', icon: 'pi pi-fw pi-clock', to: '/uikit/ArchiveLog' },
            ],
        },
        {
        label: 'DataBase',
        icon: ' pi pi-database',
        items: [
            { label: 'Jobs', icon: 'pi pi-fw pi-briefcase', to: '/uikit/Jobs' },
            { label: 'Running queries', icon: 'pi pi-fw  pi-spinner', to: '/uikit/Running' },
            { label: 'Recycling', icon: 'pi pi-fw pi-refresh', to: '/uikit/Recycling' },
            { label: 'Propierties', icon: 'pi pi-fw pi-cog', to: '/uikit/Propierties' },
            { label: 'Log shipping', icon: 'pi pi-fw pi-bookmark', to: '/uikit/shipping' },
            { label: 'AlwaysOn', icon: 'pi pi-fw pi-check-circle', to: '/uikit/AlwaysOn' },
            { label: 'Status Disk', icon: 'pi pi-fw pi-desktop', to: '/uikit/StatusDisk' },
            { label: 'Status Backup', icon: 'pi pi-fw pi-refresh', to: '/uikit/StatusBackup' },
            { label: 'Jobs Failed', icon: 'pi pi-fw pi-times-circle', to: '/uikit/JobsFailed' }
        ]
    },
    {
            label: 'Audit',
            icon: 'pi pi-fw pi-chart-line',
            items: [
                { label: 'Audit', icon: 'pi pi-fw pi-chart-line', to: '/uikit/Audit' },
                { label: 'Audit database', icon: 'pi pi-database', to: '/uikit/AuditDatabase' }
            ]
        },
        {
            label: 'Support',
            icon: 'pi pi-fw pi-user',
            id: 'support',
            class: 'menu-support',
            to: jiraAccessTokenExists.value ? '/uikit/Support' : null // Ruta condicional
        },
    ];

    // Filtrar las secciones según el rol
    return isAdmin.value
        ? menu
        : menu.filter(
              (item) =>
                  !['Admin home', 'Tools', 'Servers', 'Audit'].includes(item.label)
          );
});
</script>



<style lang="scss" scoped>
.layout-menu {
    padding: 0;
    margin: 0;
    list-style: none;
    margin-top: 7%;
    margin-left: 5%;
}

.layout-menu-item {
    margin-bottom: 0.5rem;
}

.layout-menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
    margin-bottom: 1rem;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    text-align: center;
}

.menu-icon {
    font-size: 1.4rem;
}

.menu-support {
    cursor: pointer; /* Cambia el cursor a 'pointer' */
}
</style>