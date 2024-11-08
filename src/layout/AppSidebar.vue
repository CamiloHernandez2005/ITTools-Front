<script setup>
import { computed } from 'vue';
import AppMenu from './AppMenu.vue';
import { useLayout } from '@/layout/composables/layout';

const { layoutState } = useLayout();

const sidebarClasses = computed(() => ({
    'layout-sidebar': true,
    'collapsed': layoutState.sidebarCollapsed,
    'icons-visible': layoutState.sidebarIconsVisible
}));
</script>

<template>
    <div :class="sidebarClasses">
        <app-menu></app-menu>
    </div>
</template>

<style scoped>
.layout-sidebar {
    width: 250px; /* Ancho cuando está expandida */
    transition: width 0.3s ease;
}

.layout-sidebar.collapsed {
    width: 90px; /* Ancho cuando está colapsada */
}

/* Otros estilos según sea necesario */
</style>
