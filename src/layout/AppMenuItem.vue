<template>
    <li :class="menuItemClasses" class="layout-menuitem">
        <a v-if="!item.items" :href="item.to" class="menu-link" @click="handleClick(item)">
            <i :class="item.icon" class="menu-icon"></i>
            <span class="menu-label" v-if="!collapsed">{{ item.label }}</span>
        </a>
        <a v-else href="#" @click.prevent="handleClick(item)" class="menu-link">
            <i :class="item.icon" class="menu-icon"></i>
            <span class="menu-label" v-if="!collapsed">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="!collapsed"></i>
        </a>
        <ul v-if="item.items && isActive" class="layout-submenu">
            <app-menu-item 
                v-for="(child, index) in item.items" 
                :key="index" 
                :item="child" 
                :index="index"
            />
        </ul>
    </li>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useLayout } from '@/layout/composables/layout';

const props = defineProps({
    item: Object,
    index: Number
});

const { layoutState, setSidebarState } = useLayout();

const active = ref(false);

const isActive = computed(() => active.value || layoutState.activeSubMenuItems[props.item.label]);

function toggleMenu() {
    active.value = !active.value;
}

function handleClick(menuItem) {
    // Alternar el estado del menú si hay submenús
    if (menuItem.items) {
        toggleMenu();
        layoutState.activeSubMenuItems = { ...layoutState.activeSubMenuItems, [menuItem.label]: active.value };
    }
    
    // Abrir la barra lateral si está colapsada
    if (layoutState.sidebarCollapsed) {
        setSidebarState(false);
    }
}

// Observa los cambios en el estado del menú y restablece submenús si es necesario
watch(() => layoutState.sidebarCollapsed, (newVal) => {
    if (newVal) {
        active.value = false;
    }
});

const menuItemClasses = computed(() => ({
    'active-menuitem': isActive.value,
    'collapsed': layoutState.sidebarCollapsed,
}));

const collapsed = computed(() => layoutState.sidebarCollapsed);
</script>

<style scoped>
.layout-menuitem {
    list-style: none;
    position: relative;
}

.menu-link {
    display: flex;
    text-decoration: none;
    padding: var(--menu-link-padding, 0.75rem 1rem);
    color: var(--menu-link-color, inherit);
    width: 100%;
    transition: color 0.3s ease;
}

.menu-link:hover {
    background-color: #f0f0f0;
    color: #64c4ac;
}

.menu-icon {
    font-size: var(--menu-icon-size, 1.5rem);
    margin-right: var(--menu-icon-margin-right, 1rem);
}

.menu-label {
    font-size: var(--menu-label-size, 1rem);
    margin-right: auto;
}

.layout-menuitem.collapsed .menu-label {
    display: none;
}

.layout-submenu {
    list-style: none;
    padding: 0;
    margin: 0;
    padding-left: var(--submenu-padding-left, 1rem);
    position: relative;
}

.layout-submenu .menu-link {
    padding-left: var(--submenu-link-padding-left, 2rem);
    font-size: var(--submenu-link-size, 0.875rem);
}
</style>
