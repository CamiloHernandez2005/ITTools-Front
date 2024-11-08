<template>
    <ul class="layout-menu">
        <li class="layout-menu-item">
            <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
                <i class="pi pi-bars menu-icon"></i>
            </button>
        </li>
        <template v-for="(item, i) in model" :key="item.label">
            <app-menu-item v-if="!item.separator" :item="item" :index="i" />
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>


<script setup>
import { useLayout } from '@/layout/composables/layout';
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const { onMenuToggle } = useLayout();


const model = ref([

    {
        label: 'Home',
        icon: 'pi pi-fw pi-home',
        to: '/home'
    },
    {
        label: 'Home',
        icon: 'pi pi-fw pi-home',
        to: '/homeusers'
    },
    {
        label: 'Tools',
        icon: 'pi pi-fw pi-cog',
        items: [
            { label: 'Users', icon: 'pi pi-fw pi-users', to: '/uikit/Users' },
            { label: 'Roles', icon: 'pi pi-fw pi-shield', to: '/uikit/Roles' },
            { label: 'Regions', icon: 'pi pi-fw pi-globe', to: '/uikit/RegionList' },
            { label: 'Services', icon: 'pi pi-fw pi-cog', to: '/uikit/Services' }
        ]
    },
   
    {
        label: 'Servers',
        icon: 'pi pi-fw pi-server',
        items: [
            { label: 'ServersDB', icon: 'pi pi-fw pi-database', to: '/uikit/ServersDB' },
            { label: 'Agents', icon: 'pi pi-fw pi-cloud', to: '/uikit/Agents' }
        ]
    },
    
{
        label: 'Logs',
        icon: 'pi pi-fw pi-folder', // Icono actualizado para Logs
        items: [
            { label: 'Find in a log file', icon: 'pi pi-fw pi-search-plus', to: '/uikit/FindLog' },
            { label: 'Multi find logs', icon: 'pi pi-fw pi-search', to: '/uikit/FindLogTran' },
            { label: 'Logs', icon: 'pi pi-fw pi-share-alt', to: '/uikit/LogTran' },
            { label: 'Archive logs', icon: 'pi pi-fw pi-clock', to: '/uikit/ArchiveLog' }
        ]
    },

    {
        label: 'DataBase',
        icon: ' pi pi-database',
        items: [
            { label: 'Jobs', icon: 'pi pi-fw pi-briefcase', to: '/uikit/Jobs' },
            { label: 'Running Queries', icon: 'pi pi-fw  pi-spinner', to: '/uikit/Running' },
            { label: 'Recycling', icon: 'pi pi-fw pi-refresh', to: '/uikit/Recycling' },
            { label: 'Propierties', icon: 'pi pi-fw pi-cog', to: '/uikit/Propierties' }
        ]// Icono actualizado para Audit

    },

    {
        label: 'Audit',
        icon: 'pi pi-fw pi-chart-line',
        // Icono actualizado para Audit
        items: [
            { label: 'Audit', icon: 'pi pi-fw pi-chart-line', to: '/uikit/Audit' },
            { label: 'Audit Database', icon: 'pi pi-database', to: '/uikit/AuditDatabase' },

        ]

    },
    {
        label: 'Support',
        icon: 'pi pi-fw pi-user', 
        to: '/uikit/Support'
    },
]);
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
    // Asegura que cada elemento de menú tenga el mismo estilo
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
    font-size: 1.4rem; // Ajusta el tamaño del icono según sea necesario
}
</style>
