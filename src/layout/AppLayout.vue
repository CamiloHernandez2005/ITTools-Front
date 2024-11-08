<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed, ref, watch } from 'vue';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';

// Utiliza el composable de layout para acceder al estado y funciones
const { layoutConfig, layoutState, isSidebarActive, setSidebarState, resetMenu } = useLayout();

const outsideClickListener = ref(null);

// Observa los cambios en el estado de la barra lateral
watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

// Clases dinámicas para el contenedor principal
const containerClass = computed(() => ({
    'layout-wrapper': true,
    'layout-overlay': layoutConfig.menuMode === 'overlay',
    'layout-static': layoutConfig.menuMode === 'static',
    'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
    'layout-overlay-active': layoutState.overlayMenuActive,
    'layout-mobile-active': layoutState.staticMenuMobileActive,
    'layout-sidebar-collapsed': layoutState.sidebarCollapsed, // Nueva clase para el sidebar colapsado
}));

// Clases dinámicas para el contenido principal
const mainContentClass = computed(() => ({
    'layout-main-content': true,
    'collapsed': layoutState.sidebarCollapsed,
}));

// Vincula el evento de clic externo cuando el sidebar está activo
const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                resetMenu();
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
};

// Desvincula el evento de clic externo cuando el sidebar no está activo
const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener.value);
        outsideClickListener.value = null;
    }
};

// Comprueba si el clic fue fuera del sidebar y del botón del menú
const isOutsideClicked = (event) => {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');
    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};
</script>

<template>
    <div :class="containerClass">
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div :class="mainContentClass" class="layout-main-container">
            <div class="layout-main">
                <router-view></router-view>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask"></div>
    </div>
    <Toast />
</template>

<style scoped>
.layout-main-content {
    transition: margin-left 0.3s ease;
}

/* Estilo cuando la barra lateral está colapsada */
.layout-main-content.collapsed {
    margin-left: 110px; /* Ajusta según el ancho de la barra lateral colapsada */
}

/* Estilo cuando la barra lateral está abierta */
.layout-main-content:not(.collapsed) {
    margin-left: 280px; /* Ajusta según el ancho de la barra lateral abierta */
}

/* Otros estilos según necesidad */
</style>
