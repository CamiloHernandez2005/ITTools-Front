import AppLayout from '@/layout/AppLayout.vue';
import Login from '@/views/pages/auth/Login.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { ref } from 'vue';
import { authService } from '@/services/AuthService'; // Asegúrate de importar tu servicio de autenticación
const isAdmin = ref(false); // Para verificar si el usuario es admin

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

const routes = [
    {
        path: '/',
        name: 'login',
        component: Login,
        meta: { guest: true } // Añadir meta para identificar rutas de invitados
    },
    {
        path: '/',
        component: AppLayout,
        children: [
            {
                path: '/home',
                name: 'dashboard',
                component: () => import('@/views/Dashboard.vue'),
                meta: { requiresAuth: true, requiredRole: 'ADMIN' }
            },{
                path: '/homeusers',
                name: 'dashboardusers',
                component: () => import('@/views/DashboardUser.vue'),
                meta: { requiresAuth: true }
            },
           
            {
                path: '/uikit/Users',
                name: 'formlayout',
                component: () => import('@/views/uikit/Users.vue'),
                meta: { requiresAuth: true, requiredRole: 'ADMIN' }
            },
            {
                path: '/uikit/RegionList',
                name: 'RegionList',
                component: () => import('@/views/uikit/RegionList.vue'),
                meta: { requiresAuth: true, requiredRole: 'ADMIN' }
            },
            {
                path: '/uikit/ServersDB',
                name: 'ServersDB',
                component: () => import('@/views/uikit/ServersDB.vue'),
                meta: { requiresAuth: true, requiredRole: 'ADMIN' }
            },
            {
                path: '/uikit/Agents',
                name: 'Agents',
                component: () => import('@/views/uikit/Agents.vue'),
                meta: { requiresAuth: true, requiredRole: 'ADMIN' }
            },
           
            {
                path: '/uikit/Roles',
                name: 'Roles',
                component: () => import('@/views/uikit/Roles.vue'),
                meta: { requiresAuth: true, requiredRole: 'ADMIN' }
            },
            {
                path: '/uikit/Audit',
                name: 'Audit',
                component: () => import('@/views/uikit/Audit.vue'),
                meta: { requiresAuth: true, requiredRole: 'ADMIN' }
            },
            {
                path: '/uikit/FindLog',
                name: 'FindLog',
                component: () => import('@/views/uikit/FindLog.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/FindLogTran',
                name: 'FindLogTran',
                component: () => import('@/views/uikit/FindLogTran.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/LogTran',
                name: 'LogTran',
                component: () => import('@/views/uikit/LogTran.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/ArchiveLog',
                name: 'ArchiveLog',
                component: () => import('@/views/uikit/ArchiveLog.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/Jobs',
                name: 'Jobs',
                component: () => import('@/views/uikit/Jobs.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/Propierties',
                name: 'Propierties',
                component: () => import('@/views/uikit/Propierties.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/Running',
                name: 'Running',
                component: () => import('@/views/uikit/Running.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/Recycling',
                name: 'Recycling',
                component: () => import('@/views/uikit/RecyclingPins.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/AuditDatabase',
                name: 'AuditDatabase',
                component: () => import('@/views/uikit/AuditDatabase.vue'),
                meta: { requiresAuth: true, requiredRole: 'ADMIN' }
            },
            {
                path: '/uikit/support',
                name: 'Support',
                component: () => import('@/views/uikit/Support.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/shipping',
                name: 'shipping',
                component: () => import('@/views/uikit/shipping.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/JobsFailed',
                name: 'JobsFailed',
                component: () => import('@/views/uikit/JobsFailed.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/AlwaysOn',
                name: 'AlwaysOn',
                component: () => import('@/views/uikit/AlwaysOn.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: '/uikit/StatusDisk',
                name: 'StatusDisk',
                component: () => import('@/views/uikit/StatusDisk.vue'),
                meta: { requiresAuth: true }
            }, 
            {
                path: '/uikit/StatusBackup',
                name: 'StatusBackup',
                component: () => import('@/views/uikit/StatusBackup.vue'),
                meta: { requiresAuth: true }
            },
        ]
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

let rolesLoaded = false;

const ensureRolesLoaded = async () => {
    if (!rolesLoaded) {
        await loadUserRole();
        rolesLoaded = true;
    }
};

// Route guard to check authentication and roles
router.beforeEach(async (to, from, next) => {
    await ensureRolesLoaded(); // Asegura que los roles estén cargados

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiredRole = to.meta.requiredRole; // Obtener el rol requerido para la ruta
    const isAuthenticated = !!authService.getToken(); // Check if token exists
    const isGuestRoute = to.matched.some(record => record.meta.guest);

    if (requiresAuth && !isAuthenticated) {
        // Redirigir al login si no está autenticado y la ruta requiere autenticación
        next('/');
    } else if (isAuthenticated && to.path === '/') {
        // Redirigir al home si está autenticado e intenta acceder al login
        next('/homeusers');
    } else if (requiredRole && requiredRole === 'ADMIN' && !isAdmin.value) {
        // Redirigir si la ruta requiere rol de ADMIN y el usuario no es admin
        next('/homeusers'); // O redirigir a una página de acceso denegado
    } else {
        // Proceder a la ruta
        next();
    }
});



export default router;
