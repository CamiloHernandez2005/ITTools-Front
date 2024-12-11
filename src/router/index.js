import AppLayout from '@/layout/AppLayout.vue';
import Login from '@/views/pages/auth/Login.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { ref } from 'vue';
import { authService } from '@/services/AuthService'; // Asegúrate de importar tu servicio de autenticación
const isAdmin = ref(false); // Para verificar si el usuario es admin

const loadUserRole = async () => {
    const userEmail = localStorage.getItem('userEmail'); // Obtener el email del usuario
    if (!userEmail) return; // Si no hay usuario, no continuar

    try {
        const users = await authService.getUsers();
        const user = users.find((u) => u.email === userEmail);

        if (user && user.roles) {
            isAdmin.value = user.roles.includes('ADMIN'); // Verificar si el usuario es ADMIN
        }
    } catch (error) {
        console.log('Error al obtener los roles del usuario:', error);
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

// Asegurarse de cargar roles solo una vez
const ensureRolesLoaded = async () => {
    if (!rolesLoaded) {
        await loadUserRole();
        rolesLoaded = true;
    }
};


// Route guard to check authentication and roles
router.beforeEach(async (to, from, next) => {
    const isAuthenticated = !!authService.getToken(); // Verificar si hay token
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
    const requiredRole = to.meta.requiredRole; // Rol requerido para la ruta
    const isGuestRoute = to.matched.some((record) => record.meta.guest);

    // Asegurar que los roles estén cargados si está autenticado
    if (isAuthenticated) {
        await ensureRolesLoaded();
    }

    // Si la ruta requiere autenticación pero el usuario no está autenticado
    if (requiresAuth && !isAuthenticated) {
        return next('/'); // Redirigir al login
    }

    // Si la ruta requiere un rol específico y el usuario no lo tiene
    if (requiredRole && requiredRole === 'ADMIN' && !isAdmin.value) {
        return next('/homeusers'); // Redirigir a una vista de usuario normal
    }

    // Si es una ruta de invitado y el usuario está autenticado
    if (isGuestRoute && isAuthenticated) {
        return next('/homeusers'); // Redirigir al home
    }

    next(); // Permitir acceso a la ruta
});



export default router;
