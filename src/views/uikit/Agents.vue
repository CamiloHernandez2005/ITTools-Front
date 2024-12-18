<script>
import { serverService } from '@/services/AgentService';
import { regionService } from '@/services/RegionService';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Breadcrumb from 'primevue/breadcrumb';
import { useToast } from 'primevue/usetoast';
import HelpTooltip from '@/components/Alertas.vue'
import { ref, inject } from 'vue';
import { getCurrentInstance } from 'vue';


export default {
    components: {
        InputText,
        Button,
        Dropdown,
        DataTable,
        Column,
        Dialog,
        Breadcrumb,
        HelpTooltip
    },
    setup() {
        const toast = useToast();
        const error = ref('');


        const showSuccess = (detail) => {
            toast.add({ severity: 'success', summary: 'Success', detail, life: 3000 });
        };

        const showError = (detail) => {
            toast.add({ severity: 'error', summary: 'Error', detail, life: 3000 });
        };
        const { proxy } = getCurrentInstance();
        const showHelp = proxy.$help.showHelp;




        return {
            toast,
            showSuccess,
            showError,
            error,
            showHelp

        };
    },
    data() {
        return {
            servers: [],
            filteredServers: [],
            regions: [],
            isEditDialogVisible: false,
            displayConfirmation: false,
            isCreateServerDialogVisible: false,
            isActivating: false,
            selectedServer: null,
            searchQuery: '',
            showActiveServers: false,
            isShowDialogVisible: false,
            displayDeleteConfirmation: false,
            showAll: false,
            serverToDelete: null,

            server: {
                agentName: '',
                ipagent: '',
                webServiceUrl: '',
                pathArchive: '',
                pathLog: '',
                regionId: null
            },
            filters: {
                global: { value: null, matchMode: FilterMatchMode.CONTAINS },
                agentName: { value: null, matchMode: FilterMatchMode.CONTAINS },
                ipagent: { value: null, matchMode: FilterMatchMode.CONTAINS },
                pathLog: { value: null, matchMode: FilterMatchMode.CONTAINS },
                pathArchive: { value: null, matchMode: FilterMatchMode.CONTAINS },
                region: { value: null, matchMode: FilterMatchMode.CONTAINS }
            },
            newServer: {
                agentName: '',
                ipagent: '',
                webServiceUrl: '',
                pathArchive: '',
                pathLog: '',
                regionId: null
            },
            editServerData: {
                idAgent: null,
                agentName: '',
                ipagent: '',
                webServiceUrl: '',
                pathArchive: '',
                pathLog: '',
                regionId: null
            },
            detailServerData: {
                agentName: '',
                ipagent: '',
                webServiceUrl: '',
                pathArchive: '',
                pathLog: '',
                regionId: null
            },
            error: '',

            // Definición del breadcrumb
            home: {
                label: 'Home',
                icon: 'pi pi-home',
                url: '/homeusers'
            },
            items: [
                {
                    label: 'Servers',
                    icon: 'pi pi-fw pi-server',
                    route: { name: 'Agents' }
                },
                {
                    icon: 'pi pi-fw pi-cloud',
                    label: 'Agents',
                    route: { name: 'Agents' }
                }
            ]
        };
    },
    async created() {
        await this.loadRegions();
        await this.fetchServers();
    },
    watch: {
        filters: {
            deep: true,
            handler() {
                this.filterServers();
            }
        },
        showActiveServers() {
            this.applyFilters();
        },
        servers() {
            this.applyFilters();
        }
    },

    methods: {
        async loadRegions() {
            try {
                const allRegions = await regionService.getAllRegions();
                this.regions = allRegions.filter((region) => region.status === 1);
            } catch (error) {
                console.error('Error fetching regions:', error);
                this.showError('Error fetching regions');
            }
        },
        async createServer() {
            if (!this.validateIP(this.newServer.ipagent)) {
                this.showError('Invalid IP address');
                return;
            }
            try {
                const serverData = {
                    agentName: this.newServer.agentName,
                    ipagent: this.newServer.ipagent,
                    webServiceUrl: this.newServer.webServiceUrl,
                    pathArchive: this.newServer.pathArchive,
                    pathLog: this.newServer.pathLog,
                    regionId: this.newServer.regionId ? Number(this.newServer.regionId) : null
                };
                await serverService.createServer(serverData);
                this.showSuccess('Agent created successfully');
                this.resetNewServerForm();
                await this.fetchServers();
                this.closeCreateServerDialog();
            } catch (error) {
                this.showError(error.message || 'Registration failed');
            }
        },
        async updateServer() {
            try {
                await serverService.updateServer(this.editServerData);
                await this.fetchServers();
                this.isEditDialogVisible = false;
                this.showSuccess('Agent updated successfully');
            } catch (error) {
                this.showError(error.message || 'Update failed');
            }
        },
        async deleteAgent() {
            try {
                await serverService.deleteAgent(this.serverToDelete);
                this.showSuccess('Agent deleted successfully');
                await this.fetchServers();
                this.displayDeleteConfirmation = false;
                this.serverToDelete = null;
            } catch (error) {
                console.error('Error deleting agent:', error);
                this.showError(`Error deleting agent: ${error.message}`);
            }
        },
        async changeServerStatus() {
            try {
                await this.toggleStatus(this.selectedServer);
                this.closeConfirmation();
            } catch (error) {
                console.error('Error changing server status:', error.message);
                this.showError('Failed to update server status');
            }
        },
        async toggleStatus(server) {
            const updatedStatus = server.status === 1 ? 0 : 1;
            try {
                await serverService.updateServerStatus(server.idAgent);
                server.status = updatedStatus;
                await this.fetchServers();
                this.showSuccess('Agent status updated successfully');
            } catch (error) {
                console.error('Error updating server status:', error.message);
                this.showError('Failed to update server status');
            }
        },
        filterServers() {
            this.filteredServers = this.servers.filter((server) => {
                const filter = this.filters.global.value?.toLowerCase() || '';
                const isActive = this.filterActiveOnly ? server.status === 1 : true;

                return isActive && Object.values(server).some((value) => (value ? value.toString().toLowerCase().includes(filter) : false));
            });
        },
        async handleClose() {
            this.closeCreateServerDialog();
            this.isEditDialogVisible = false;
            this.resetNewServerForm();
        },
        async fetchServers() {
            try {
                const servers = await serverService.getAllServers();
                this.servers = servers.map((server) => ({
                    ...server,
                    region: this.getRegionNameById(server.regionId) // Agrega la región al objeto del servidor
                }));
                this.filteredServers = [...this.servers];
            } catch (error) {
                console.error('Error fetching servers:', error);
                this.showError('Error fetching servers');
            }
        },

        clearFilter() {
            // Limpiar el filtro global
            this.filters.global.value = null;

            // Limpiar los filtros de columnas
            for (const key in this.filters) {
                if (this.filters[key]) {
                    this.filters[key].value = null; // Resetea el valor de cada filtro
                }
            }

            // Refresca la lista de usuarios
            this.filterUsers();
        },

        applyFilters() {
            this.filteredServers = this.servers.filter(server => {
                const matchesGlobal = !this.filters.global.value || Object.values(server).some(value => {
                    return value?.toString().toLowerCase().includes(this.filters.global.value.toLowerCase());
                });

                const matchesAgentName = !this.filters.agentName.value || server.agentName.toLowerCase().includes(this.filters.agentName.value.toLowerCase());
                const matchesIpAgent = !this.filters.ipagent.value || server.ipagent.toLowerCase().includes(this.filters.ipagent.value.toLowerCase());
                const matchesPathLog = !this.filters.pathLog.value || server.pathLog.toLowerCase().includes(this.filters.pathLog.value.toLowerCase());
                const matchesPathArchive = !this.filters.pathArchive.value || server.pathArchive.toLowerCase().includes(this.filters.pathArchive.value.toLowerCase());
                const matchesRegion = !this.filters.region.value || server.region.toLowerCase().includes(this.filters.region.value.toLowerCase());

                return matchesGlobal && matchesAgentName && matchesIpAgent && matchesPathLog && matchesPathArchive && matchesRegion;
            });
        },
        toggleFilter() {
            this.showAll = !this.showAll;
            this.applyFilters();
        },
        getRegionNameById(regionId) {
            const region = this.regions.find((region) => region.idRegion === regionId);
            return region ? region.nameRegion : 'Unknown Region';
        },
        editServer(server) {
            this.editServerData = { ...server };
            this.isEditDialogVisible = true;
        },
        showServerDetails(server) {
            this.detailServerData = { ...server };
            this.isShowDialogVisible = true;
        },
        confirmDeleteServer(serverId) {
            this.serverToDelete = serverId;
            this.displayDeleteConfirmation = true;
        },

        openConfirmation(server, isActivating) {
            this.selectedServer = server;
            this.isActivating = isActivating;
            this.displayConfirmation = true;
        },
        closeDeleteConfirmation() {
            this.displayDeleteConfirmation = false;
            this.serverToDelete = null;
        },
        openCreateServerDialog() {
            this.isCreateServerDialogVisible = true;
            this.resetNewServerForm();
        },

        closeConfirmation() {
            this.displayConfirmation = false;
        },

        resetNewServerForm() {
            this.newServer = {
                agentName: '',
                ipagent: '',
                webServiceUrl: '',
                pathArchive: '',
                pathLog: '',
                regionId: null
            };
        },
        closeCreateServerDialog() {
            this.isCreateServerDialogVisible = false;
        },
        validateIP(ip) {
            const ipagent = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
            return ipagent.test(ip);
        }
    }
};
</script>

<template>
    <div class="flex flex-col h-screen p-4">
        <div class="flex-2 overflow-auto shadow-custom border">
            <div class="card p-6 flex flex-col h-full">
                <!-- Agrupar los dos elementos: titulo y breadcrumb -->
                <div class="header-container">
                    <div class="title font-semibold text-xl">Agents</div>

                    <Breadcrumb :home="home" :model="items" />

                </div>


                <div class="overflow-x-auto">
                    <DataTable :value="filteredServers" class="p-datatable-sm" :paginator="true" :rows="10"
                        :rowsPerPageOptions="[5, 10, 20]" :totalRecords="servers.length" dataKey="id" :rowHover="true"
                        v-model:filters="filters" filterDisplay="menu"
                        :globalFilterFields="['agentName', 'ipagent', 'pathLog', 'pathArchive', 'region']">
                        <template #header>



                            <div class="flex justify-between">
                                <div class="flex gap-2">
                                    
                                        <Button label="Create agents" icon="pi pi-plus" id="create-button"
                                            @click="openCreateServerDialog" />
                                    
                                    <div class="tooltip-wrapper">
                                        <HelpTooltip :message="'filter inactive agents'"
                                            :visible="showHelp" />
                                        <Button label="Filter all" icon="pi pi-filter" id="close-button"
                                            @click="toggleFilter" />
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                  
                                        <InputText v-model="filters.global.value" placeholder="Global search" />
                                   
                                    <div class="tooltip-wrapper">
                                        <HelpTooltip :message="'close all filters'" :visible="showHelp" />
                                        <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined
                                            @click="clearFilter()" />
                                    </div>
                                </div>
                            </div>
                        </template>

                        <template #empty> No agents found. </template>
                        <template #loading> Loading agents data. Please wait. </template>

                        <Column field="agentName" header="Agent name" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ data.agentName }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by name" />
                            </template>
                        </Column>
                        <Column field="ipagent" header="IP agent" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ data.ipagent }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by ip" />
                            </template>
                        </Column>
                        <Column field="pathLog" header="Path log" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ data.pathLog }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by path" />
                            </template>
                        </Column>
                        <Column field="pathArchive" header="Path log archive" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ data.pathArchive }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text"
                                    placeholder="Search by path archive" />
                            </template>
                        </Column>

                        <!-- Nueva columna para mostrar la región -->
                        <Column field="region" header="Region" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ getRegionNameById(data.regionId) }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by region" />
                            </template>
                        </Column>

                        <Column field="status" header="Status" sortable>
                            <template #body="{ data }">
                                <span :class="data.status ? 'text-green-500' : 'text-red-500'">{{ data.status ? 'Active'
                                    : 'Inactive' }}</span>
                            </template>
                        </Column>
                        <Column >
                            <template #header>
                                <div class="tooltip-wrapper1">
                                    Actions
                                    <HelpTooltip :message="'Edit section, disable and delete Agent'"
                                        :visible="showHelp" />
                                </div>
                            </template>
                            <template #body="{ data }">
                                <Button icon="pi pi-eye" class="p-button-rounded p-button-success p-button-text"
                                    @click="showServerDetails(data)" />
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-info p-button-text"
                                    @click="editServer(data)" />
                                <Button :icon="data.status ? 'pi pi-power-off' : 'pi pi-power-off'"
                                    :class="data.status ? 'p-button-rounded p-button-danger p-button-text' : 'p-button-rounded p-button-success p-button-text'"
                                    @click="openConfirmation(data, !data.status)" />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text"
                                    @click="confirmDeleteServer(data.idAgent)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>

        <!-- Diálogo de creación de servidor -->
        <Dialog header="Create agent" v-model:visible="isCreateServerDialogVisible" modal
            :style="{ 'max-width': '30vw', width: '30vw' }">
          
            <form @submit.prevent="createServer">
                <div class="flex gap-4">
                    <!-- Inputs columna izquierda -->
                    <div class="flex flex-col w-1/2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="create_serverName">Agent name</label>
                            <InputText id="create_serverName" v-model="newServer.agentName"
                                class="p-inputtext-sm input-with-line" placeholder="Enter agent name" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="create_ipagent">IP address</label>
                            <InputText id="create_ipagent" v-model="newServer.ipagent"
                                class="p-inputtext-sm input-with-line" placeholder="Enter ip address" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="create_webServiceUrl">Web service url</label>
                            <InputText id="create_webServiceUrl" v-model="newServer.webServiceUrl"
                                class="p-inputtext-sm input-with-line" placeholder="Enter web service url" />
                        </div>
                    </div>
                    <!-- Inputs columna derecha -->
                    <div class="flex flex-col w-1/2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="create_pathArchive">Path log</label>
                            <InputText id="create_pathArchive" v-model="newServer.pathLog"
                                class="p-inputtext-sm input-with-line" placeholder="Enter path log" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="create_pathArchive">Path archive log</label>
                            <InputText id="create_pathArchive" v-model="newServer.pathArchive"
                                class="p-inputtext-sm input-with-line" placeholder="Enter path archive log" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="create_regionId">Region</label>
                            <Dropdown id="create_regionId" v-model="newServer.regionId" :options="regions"
                                optionLabel="nameRegion" optionValue="idRegion" filter filterPlaceholder="Search..."
                                class="custom-dropdown p-dropdown-sm" />
                        </div>
                    </div>
                </div>
                <div class="flex justify-end mt-4">
                    <Button id="close-button" label="Close" @click="handleClose" style="margin-right: 8px" />
                    <Button id="create-button" type="submit" label="Create" />
                </div>
            </form>
        </Dialog>

        <!-- Modal de edición de servidor -->

        <Dialog header="Edit agent" v-model:visible="isEditDialogVisible" modal
            :style="{ 'max-width': '30vw', width: '30vw' }">
            <form @submit.prevent="updateServer">
                <div class="flex gap-4">
                    <!-- Sección de Inputs (columna izquierda) -->
                    <div class="flex flex-col w-1/2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="edit_serverName">Server name</label>
                            <InputText id="edit_serverName" type="text" v-model="editServerData.agentName"
                                class="p-inputtext-sm input-with-line" placeholder="Enter server name" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="edit_ipagent">IP address</label>
                            <InputText id="edit_ipagent" type="text" v-model="editServerData.ipagent"
                                class="p-inputtext-sm input-with-line" placeholder="Enter ip address" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="edit_webServiceUrl">Web service url</label>
                            <InputText id="edit_webServiceUrl" type="text" v-model="editServerData.webServiceUrl"
                                class="p-inputtext-sm input-with-line" placeholder="Enter web service url" />
                        </div>
                    </div>

                    <!-- Sección de Inputs (columna derecha) -->
                    <div class="flex flex-col w-1/2 gap-4">
                        <div class="flex flex-col gap-2">
                            <label for="edit_pathArchive">Path log</label>
                            <InputText id="edit_pathArchive" type="text" v-model="editServerData.pathLog"
                                class="p-inputtext-sm input-with-line" placeholder="Enter path log" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label for="edit_pathArchive">Path archive log</label>
                            <InputText id="edit_pathArchive" type="text" v-model="editServerData.pathArchive"
                                class="p-inputtext-sm input-with-line" placeholder="Enter path archive log" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="edit_regionId">Region</label>
                            <Dropdown id="edit_regionId" v-model="editServerData.regionId" :options="regions"
                                optionLabel="nameRegion" optionValue="idRegion" filter filterPlaceholder="Search..."
                                class="custom-dropdown p-dropdown-sm" />
                        </div>
                    </div>
                </div>

                <!-- Contenedor para alinear el botón al final -->
                <div class="flex justify-end mt-4">
                    <Button id="close-button" label="Close" @click="handleClose" style="margin-right: 8px" />
                    <Button id="create-button" type="submit" label="Save" />
                </div>
            </form>
        </Dialog>

        <!-- Diálogo de detalle de agent -->
        <Dialog v-model:visible="isShowDialogVisible" header="Agent details" modal
            :style="{ 'max-width': '30vw', width: '30vw' }">
            <div class="flex flex-col gap-4">
                <div><strong>Server name:</strong> {{ detailServerData.agentName }}</div>
                <div><strong>IP address:</strong> {{ detailServerData.ipagent }}</div>
                <div><strong>Web service url:</strong> {{ detailServerData.webServiceUrl }}</div>
                <div><strong>Path log:</strong> {{ detailServerData.pathLog }}</div>
                <div><strong>Archive path log:</strong> {{ detailServerData.pathArchive }}</div>
                <div><strong>Region:</strong> {{ getRegionNameById(detailServerData.regionId) }}</div>
                <div>
                    <strong>Status:</strong>
                    <span :class="detailServerData.status ? 'text-green-500' : 'text-red-500'">
                        {{ detailServerData.status ? ' Active' : ' Inactive' }}
                    </span>
                </div>
            </div>
        </Dialog>

        <!-- Diálogo de confirmación borrar -->
        <Dialog v-model:visible="displayDeleteConfirmation" header="Delete confirmation" modal class="max-w-sm">
            <p>Are you sure you want to delete this agent?</p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="No" icon="pi pi-times" @click="closeDeleteConfirmation"
                        class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="deleteAgent" class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>

        <!-- Diálogo de confirmación inactivar-->
        <Dialog v-model:visible="displayConfirmation" header="Confirmation" modal class="max-w-sm">
            <p>Are you sure you want to proceed with this action?</p>
            <!-- Mensaje de confirmación -->
            <template #footer>
                <div class="flex justify-end gap-2">
                    <!-- Ajusta la disposición de los botones -->
                    <Button label="No" icon="pi pi-times" @click="closeConfirmation"
                        class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="changeServerStatus"
                        class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.input-with-line {
    border: none;
    border-bottom: 1px solid #d1d5db;
    /* Línea gris clara */
    padding: 0.5rem 0.4rem;
    background: transparent;
    /* Fondo transparente */
    outline: none;
    box-shadow: none;
    margin-bottom: 0.5rem;
}

.w-full {
    width: 100%;
    /* Ancho completo */
}

.custom-dropdown {
    height: calc(2rem + 2.5px);
    /* Altura total del Dropdown */
    line-height: 2rem;
    /* Altura de la línea del Dropdown */
    padding: 0 0.5rem;
    /* Padding ajustado para alinear el texto verticalmente */
    font-size: 0.875rem;
    /* Tamaño de fuente del texto dentro del Dropdown */
    border: 0.5px solid #ccc;
    /* Borde del Dropdown */
    border-radius: 6px;
    /* Radio del borde del Dropdown */
    display: flex;
    /* Usa flexbox para alinear el contenido */
    align-items: center;
    /* Alinea el contenido verticalmente en el centro */
}

.p-dropdown {
    height: 100%;
    /* Usa el 100% de la altura definida */
    line-height: 2rem;
    /* Alinea la altura de línea para el contenido del Dropdown */
}

.p-dropdown .p-dropdown-label {
    height: 100%;
    /* Usa toda la altura disponible */
    line-height: 2rem;
    /* Alinea el texto dentro de la etiqueta */
}

.p-dropdown .p-dropdown-items {
    font-size: 0.875rem;
    /* Tamaño de fuente de las opciones */
}

#close-button {
    background: #614d56;
    color: white;
    border-color: #614d56;
}

#close-button:hover {
    background: white;
    color: #614d56;
    border-color: #614d56;
}

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

.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: -1rem;
}

.shadow-custom {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    /* Opcional: redondear bordes */
}

.tooltip-wrapper {
    position: relative;
    /* Establishes a positioning context */
}

.tooltip-wrapper .help-tooltip {
    position: absolute;
    /* Positioning the tooltip absolutely */
    
    /* Adjust this value to move it above the button */
    left: 50%;
    /* Center horizontally */
    transform: translateX(-50%);
    /* Center the tooltip */
    z-index: 10;
    /* Ensure it appears above other elements */
}






</style>
