<script>
import { regionService } from '@/services/RegionService';
import { serverService } from '@/services/ServerDBService';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import FloatLabel from 'primevue/floatlabel';
import Breadcrumb from 'primevue/breadcrumb';

export default {
    components: {
        InputText,
        Button,
        Dropdown,
        DataTable,
        Column,
        Dialog,
        FloatLabel,
        Breadcrumb
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

        return {
            toast,
            showSuccess,
            showError,
            error
        };
    },
    data() {
        return {
            server: {
                serverName: null,
                description: null,
                ipServer: null,
                portServer: null,
                ipServerSecondary: null,
                instance: null,
                serverDB: null,
                userLogin: null,
                password: null,
                repeatPassword: null,
                recyclingDB: null,
                regionId: null
            },
            regions: [],
            servers: [],
            filteredServers: [],
            detailServerData: {},
            isEditDialogVisible: false,
            displayConfirmation: false,
            isActivating: false,
            isShowDialogVisible: false,
            displayDeleteConfirmation: false,
            selectedServer: null,
            filters: {
                global: { value: null, matchMode: FilterMatchMode.CONTAINS },
                serverName: { value: null, matchMode: FilterMatchMode.CONTAINS },
                description: { value: null, matchMode: FilterMatchMode.CONTAINS },
                ipServer: { value: null, matchMode: FilterMatchMode.CONTAINS },
                serverDB: { value: null, matchMode: FilterMatchMode.CONTAINS },
                region: { value: null, matchMode: FilterMatchMode.CONTAINS }
            },
            editServerData: {
                idServer: null,
                serverName: '',
                description: '',
                ipServer: '',
                portServer: '',
                ipServerSecondary: '',
                instance: '',
                serverDB: '',
                userLogin: '',
                password: '',
                repeatPassword: '',
                recyclingDB: '',
                regionId: null
            },
            showCreateModal: false,
            serverToDelete: null,
            filterActiveOnly: true,

            // Definición del breadcrumb
            home: {
                label: 'Home', icon: 'pi pi-home', url: '/'
            },
            items: [
                {
                    label: 'Servers',
                    icon: 'pi pi-fw pi-server',
                    route: { name: 'ServersDB' }
                },
                {
                    icon: 'pi pi-fw pi-database',
                    label: 'Servers DB',
                    route: { name: 'ServersDB' }
                }
            ]
        };
    },
    async created() {
        await this.loadRegions();
        await this.fetchServers();
        this.filterServers(); // Apply the initial filter
    },
    methods: {
        async loadRegions() {
            try {
                const allRegions = await regionService.getAllRegions();
                this.regions = allRegions.filter((region) => region.status === 1);
            } catch (error) {
                console.error('Error fetching regions:', error);
                this.error = 'Failed to load regions';
                this.showError(this.error);
            }
        },
        async fetchServers() {
            try {
                const response = await serverService.fetchServers(); // Llama al servicio para obtener los servidores
                this.servers = response.map((server) => ({
                    ...server,
                    region: this.getRegionName(server.regionId) // Agrega la región al objeto del servidor
                }));
                this.filteredServers = [...this.servers]; // Inicializa la lista filtrada con todos los servidores
                this.filterServers(); // Aplica el filtro después de obtener los servidores
            } catch (error) {
                console.error('Error fetching servers:', error);
                this.error = 'Failed to load servers';
                this.showError(this.error);
            }
        },
        async createServer() {
            if (this.server.password !== this.server.repeatPassword) {
                this.showError('Passwords do not match');
                return;
            }
            if (!this.validateIP(this.server.ipServer)) {
                this.showError('Invalid IP address');
                return;
            }
            try {
                const serverData = {
                    serverName: this.server.serverName,
                    description: this.server.description,
                    ipServer: this.server.ipServer,
                    portServer: this.server.portServer,
                    recyclingDB: this.server.recyclingDB,
                    ipServerSecondary: this.server.ipServerSecondary,
                    instance: this.server.instance,
                    serverDB: this.server.serverDB,
                    userLogin: this.server.userLogin,
                    password: this.server.password,
                    regionId: this.server.regionId ? Number(this.server.regionId) : null
                };
                await serverService.createServer(serverData);
                this.showSuccess('Server created successfully');
                this.showCreateModal = false;
                this.resetForm();
                await this.fetchServers();
            } catch (error) {
                this.showError(error.message || 'Registration  failed');
            }
        },
        async updateServer() {
            try {
                await serverService.updateServer(this.editServerData.idServer, this.editServerData);
                this.showSuccess('Server updated successfully');
                this.isEditDialogVisible = false;
                await this.fetchServers();
            } catch (error) {
                this.showError(error.message || 'Update failed');
            }
        },
        async deleteServer() {
            try {
                await serverService.deleteServer(this.serverToDelete);
                this.showSuccess('Server deleted successfully');
                await this.fetchServers();
            } catch (err) {
                console.error('Error deleting server:', err);
                this.showError(err.message || 'Delete failed');
            } finally {
                this.closeDeleteConfirmation();
            }
        },
        async toggleStatus(server) {
            const updatedStatus = server.status === 1 ? 0 : 1;
            try {
                await serverService.toggleServerStatus(server.idServer, updatedStatus);
                this.showSuccess('Server status changed successfully');
                await this.fetchServers();
            } catch (error) {
                console.error('Error toggling server status:', error);
                this.showError('Failed to change status');
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
        async handleClose() {
            this.showCreateModal = false;
            this.isEditDialogVisible = false;
        },

        validateIP(ip) {
            const ipPattern = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
            return ipPattern.test(ip, ipServerSecondary);
        },
        showServerDetails(server) {
            this.detailServerData = { ...server };
            this.isShowDialogVisible = true;
        },
        getRegionName(regionId) {
            const region = this.regions.find((r) => r.idRegion === regionId);
            return region ? region.nameRegion : 'Unknown Region';
        },
        resetForm() {
            this.server = {
                serverName: '',
                description: '',
                ipServer: '',
                portServer: '',
                ipServerSecondary: '',
                instance: '',
                serverDB: '',
                userLogin: '',
                password: '',
                repeatPassword: '',
                recyclingDB: '',
                regionId: null
            };
        },
        openConfirmation(server, isActivating) {
            this.isActivating = isActivating;
            this.selectedServer = server;
            this.displayConfirmation = true;
        },
        openCreateModal() {
            this.showCreateModal = true; // Open modal
        },
        closeCreateModal() {
            this.showCreateModal = false;
            this.resetForm(); // Reset form when modal is closed
        },
        confirmDeleteServer(serverId) {
            this.serverToDelete = serverId;
            this.displayDeleteConfirmation = true; // Muestra el diálogo de confirmación
        },
        closeDeleteConfirmation() {
            this.displayDeleteConfirmation = false; // Cierra el diálogo de confirmación
            this.userToDelete = null; // Resetea el usuario a eliminar
        },

        editServer(server) {
            this.editServerData = { ...server };
            this.isEditDialogVisible = true;
        },

        closeConfirmation() {
            this.displayConfirmation = false;
        },
        async changeServerStatus() {
            await this.toggleStatus(this.selectedServer);
            this.closeConfirmation();
        },
        filterServers() {
            this.filteredServers = this.servers.filter((server) => {
                if (this.filterActiveOnly && server.status !== 1) return false;
                return true;
            });
        },
        toggleFilter() {
            this.filterActiveOnly = !this.filterActiveOnly;
            this.filterServers();
        }
    },
    watch: {
        filters: {
            deep: true,
            handler() {
                this.filterServers();
            }
        }
    }
};
</script>

<template>
    <div class="flex flex-col h-screen p-4">
        <div class="flex-2">
            <div class="card p-6 flex flex-col  h-full shadow-custom border">
                <!-- Agrupar los dos elementos: titulo y breadcrumb -->
                <div class="header-container">
                    <div class="title font-semibold text-xl">Servers DB</div>
                    <Breadcrumb :home="home" :model="items" />
                </div>


                <div class="overflow-x-auto">
                    <DataTable :value="filteredServers" class="p-datatable-sm" :paginator="true" :rows="10"
                        :rowsPerPageOptions="[5, 10, 20]" :totalRecords="servers.length" dataKey="id" :rowHover="true"
                        v-model:filters="filters" filterDisplay="menu"
                        :globalFilterFields="['serverName', 'description', 'ipServer', 'serverDB', 'region']">

                        <template #header>
                            <div class="flex justify-between">
                                <div class="flex gap-2">
                                    <Button label="Create server DB" icon="pi pi-plus" id="create-button"
                                        @click="openCreateModal" />
                                    <Button label="Filter all" icon="pi pi-filter" id="close-button"
                                        @click="toggleFilter" />
                                </div>
                                <div class="flex gap-2">
                                    <InputText v-model="filters.global.value" placeholder="Global search" /> <Button
                                        type="button" icon="pi pi-filter-slash" label="Clear" outlined
                                        @click="clearFilter()" />
                                </div>
                            </div>
                        </template>

                        <template #empty> No servers found. </template>
                        <template #loading> Loading servers data. Please wait. </template>

                        <Column field="serverName" header="Server name" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ data.serverName }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text"
                                    placeholder="Search by server name" />
                            </template>
                        </Column>

                        <Column field="description" header="Description" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ data.description }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text"
                                    placeholder="Search by description" />
                            </template>
                        </Column>
                        <Column field="ipServer" header="IP address" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ data.ipServer }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by ip server" />
                            </template>
                        </Column>
                        <Column field="serverDB" header="Server DB" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ data.serverDB }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by server db" />
                            </template>
                        </Column>
                        <Column field="region" header="Region" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                <span>{{ getRegionName(data.regionId) }}</span>
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by region" />
                            </template>
                        </Column>
                        <Column field="status" header="Status" sortable>
                            <template #body="{ data }">
                                <span :class="data.status === 1 ? 'text-green-500' : 'text-red-500'">{{ data.status ===
                                    1 ? 'Active' : 'Inactive' }}</span>
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button icon="pi pi-eye" class="p-button-rounded p-button-success p-button-text"
                                    @click="showServerDetails(data)" />
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-info p-button-text"
                                    @click="editServer(data)" />
                                <Button :icon="data.status === 1 ? 'pi pi-power-off' : 'pi pi-power-off'"
                                    :class="data.status === 1 ? 'p-button-rounded p-button-danger p-button-text' : 'p-button-rounded p-button-success p-button-text'"
                                    @click="openConfirmation(data, data.status === 1)" />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text"
                                    @click="confirmDeleteServer(data.idServer)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>

        <!-- Sección de creación de servidor -->
        <div>
            <!-- Modal -->
            <Dialog header="Create server" v-model:visible="showCreateModal" modal @hide="closeCreateModal"
                style="width: 70vw; max-width: auto; height: auto; max-height: auto" class="custom-dialog">
                <form @submit.prevent="createServer">
                    <!-- Contenedor principal en grid -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Fila superior con tres columnas -->
                        <div class="field-group p-4 border border-gray-300 rounded-md lg:col-span-1">
                            <div class="font-semibold text-lg mb-2">Network details</div>
                            <div class="flex flex-wrap gap-8">
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="ipServer">IP server</label>
                                    <InputText id="ipServer" v-model="server.ipServer"
                                        class="p-inputtext-sm input-with-line" placeholder="Enter ip server" required />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="portServer">Port server</label>
                                    <InputText id="portServer" v-model="server.portServer"
                                        class="p-inputtext-sm input-with-line" placeholder="Enter port server" />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="ipServerSecondary">IP server secondary</label>
                                    <InputText id="ipServerSecondary" v-model="server.ipServerSecondary"
                                        class="p-inputtext-sm input-with-line" placeholder="Enter IP sever Secondary" />
                                </div>
                            </div>
                        </div>

                        <div class="field-group p-4 border border-gray-300 rounded-md lg:col-span-1">
                            <div class="font-semibold text-lg mb-2">Server information</div>
                            <div class="flex flex-wrap gap-4">
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="serverName">Server name</label>
                                    <InputText id="serverName" v-model="server.serverName"
                                        class="p-inputtext-sm input-with-line" placeholder="Enter server name"
                                        required />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="description">Description</label>
                                    <InputText id="description" v-model="server.description"
                                        class="p-inputtext-sm input-with-line" placeholder="Enter description" />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="serverDB">Server DB</label>
                                    <InputText id="serverDB" v-model="server.serverDB"
                                        class="p-inputtext-sm input-with-line" placeholder="Enter server DB" />
                                </div>
                            </div>
                        </div>

                        <div class="field-group p-4 border border-gray-300 rounded-md lg:col-span-1 lg:row-span-2">
                            <div class="font-semibold text-lg mb-2">Additional Information</div>
                            <div class="flex flex-wrap gap-4">
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="dbFR">recyclingDB: </label>
                                    <InputText id="dbFR" v-model="server.recyclingDB"
                                        class="p-inputtext-sm input-with-line" placeholder="Enter DB FR" />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="regionDropdown">Region</label>
                                    <Dropdown id="regionDropdown" v-model="server.regionId" :options="regions"
                                        optionLabel="nameRegion" optionValue="idRegion" filter
                                        filterPlaceholder="Search..." class="custom-dropdown p-dropdown-sm" />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="instance">Instance</label>
                                    <InputText id="instance" v-model="server.instance"
                                        class="p-inputtext-sm input-with-line" placeholder="Enter instance" />
                                </div>
                            </div>
                        </div>

                        <!-- Fila inferior -->
                        <div class="field-group p-4 border border-gray-300 rounded-md lg:col-span-2">
                            <div class="font-semibold text-lg mb-2">Access details</div>
                            <div class="flex flex-wrap gap-4">
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="userLogin">User login</label>
                                    <InputText id="userLogin" v-model="server.userLogin"
                                        class="p-inputtext-sm input-with-line" placeholder="Enter your username" />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="password">Password</label>
                                    <InputText id="password" type="password" v-model="server.password"
                                        class="p-inputtext-sm input-with-line" placeholder="Enter your password"
                                        required />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="repeatPassword">Repeat password</label>
                                    <InputText id="repeatPassword" type="password" v-model="server.repeatPassword"
                                        class="p-inputtext-sm input-with-line" placeholder="Repeat your password"
                                        required />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Contenedor para alinear el botón al final -->
                    <div class="flex justify-end mt-4">
                        <Button id="close-button" label="Close" @click="handleClose" style="margin-right: 8px" />
                        <Button id="create-button" type="submit" label="Create" />
                    </div>
                </form>
            </Dialog>
        </div>

        <Dialog v-model:visible="isEditDialogVisible" header="Edit server" modal @hide="closeCreateModal"
            style="width: 70vw; max-width: auto; height: auto; max-height: auto" class="custom-dialog">
            <form @submit.prevent="updateServer">
                <!-- Contenedor principal en grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Fila superior con tres columnas -->
                    <div class="field-group p-4 border border-gray-300 rounded-md lg:col-span-1">
                        <div class="font-semibold text-lg mb-2">Network details</div>
                        <div class="flex flex-wrap gap-8">
                            <div class="flex flex-col grow basis-0 gap-2 w-full">
                                <label for="ipServer">IP server</label>
                                <InputText id="ipServer" v-model="editServerData.ipServer"
                                    class="p-inputtext-sm input-with-line" placeholder="Enter ip server" required />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2 w-full">
                                <label for="portServer">Port server</label>
                                <InputText id="portServer" v-model="editServerData.portServer"
                                    class="p-inputtext-sm input-with-line" placeholder="Enter port server" />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2 w-full">
                                <label for="ipServerSecondary">IP server secondary</label>
                                <InputText id="ipServerSecondary" v-model="editServerData.ipServerSecondary"
                                    class="p-inputtext-sm input-with-line" placeholder="Enter IP sever Secondary" />
                            </div>
                        </div>
                    </div>

                    <div class="field-group p-4 border border-gray-300 rounded-md lg:col-span-1">
                        <div class="font-semibold text-lg mb-2">Server information</div>
                        <div class="flex flex-wrap gap-4">
                            <div class="flex flex-col grow basis-0 gap-2 w-full">
                                <label for="serverName">Server name</label>
                                <InputText id="serverName" v-model="editServerData.serverName"
                                    class="p-inputtext-sm input-with-line" placeholder="Enter server name" required />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2 w-full">
                                <label for="description">Description</label>
                                <InputText id="description" v-model="editServerData.description"
                                    class="p-inputtext-sm input-with-line" placeholder="Enter description" />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2 w-full">
                                <label for="serverDB">Server DB</label>
                                <InputText id="serverDB" v-model="editServerData.serverDB"
                                    class="p-inputtext-sm input-with-line" placeholder="Enter server DB" />
                            </div>
                        </div>
                    </div>

                    <div class="field-group p-4 border border-gray-300 rounded-md lg:col-span-1 lg:row-span-2">
                        <div class="font-semibold text-lg mb-2">Additional Information</div>
                        <div class="flex flex-wrap gap-4">
                            <div class="flex flex-col grow basis-0 gap-2 w-full">
                                <label for="dbFR">recyclingDB</label>
                                <InputText id="dbFR" v-model="editServerData.recyclingDB"
                                    class="p-inputtext-sm input-with-line" placeholder="Enter DB FR" />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2 w-full">
                                <label for="regionDropdown">Region</label>
                                <Dropdown id="regionDropdown" v-model="editServerData.regionId" :options="regions"
                                    optionLabel="nameRegion" optionValue="idRegion" filter filterPlaceholder="Search..."
                                    class="custom-dropdown p-dropdown-sm" />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2 w-full">
                                <label for="instance">Instance</label>
                                <InputText id="instance" v-model="editServerData.instance"
                                    class="p-inputtext-sm input-with-line" placeholder="Enter instance" />
                            </div>
                        </div>
                    </div>

                    <!-- Fila inferior -->
                    <div class="field-group p-4 border border-gray-300 rounded-md lg:col-span-2">
                        <div class="font-semibold text-lg mb-2">Access details</div>
                        <div class="flex flex-wrap gap-4">
                            <div class="flex flex-col grow basis-0 gap-2 w-full">
                                <label for="userLogin">User login</label>
                                <InputText id="userLogin" v-model="editServerData.userLogin"
                                    class="p-inputtext-sm input-with-line" placeholder="Enter your username" />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2 w-full">
                                <label for="password">Password</label>
                                <InputText id="password" type="password" v-model="editServerData.password"
                                    class="p-inputtext-sm input-with-line" placeholder="Enter your password" required />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2 w-full">
                                <label for="repeatPassword">Repeat password</label>
                                <InputText id="repeatPassword" type="password" v-model="editServerData.repeatPassword"
                                    class="p-inputtext-sm input-with-line" placeholder="Repeat your password"
                                    required />
                            </div>
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



        <!-- Diálogo de detalles de región -->
        <Dialog v-model:visible="isShowDialogVisible" header="Server details" modal
            :style="{ 'max-width': '25vw', width: '25vw' }">
            <div v-if="detailServerData" class="flex flex-col gap-4">
                <p><strong>Server name:</strong> {{ detailServerData.serverName }}</p>
                <p><strong>Description:</strong> {{ detailServerData.description }}</p>
                <p><strong>IP server:</strong> {{ detailServerData.ipServer }}</p>
                <p><strong>IP server secondary::</strong> {{ detailServerData.ipServerSecondary }}</p>
                <p><strong>Port server:</strong> {{ detailServerData.portServer }}</p>
                <p><strong>Instance:</strong> {{ detailServerData.instance }}</p>
                <p><strong>Database server:</strong> {{ detailServerData.serverDB }}</p>
                <p><strong>User login:</strong> {{ detailServerData.userLogin }}</p>
                <p><strong>recyclingDB:</strong> {{ detailServerData.recyclingDB }}</p>

                <p><strong>Region:</strong> {{ getRegionName(detailServerData.regionId) }}</p>
                <p>
                    <strong>Status:</strong> <span
                        :class="detailServerData.status ? 'text-green-500' : 'text-red-500'">{{
                            detailServerData.status ? 'Active' : 'Inactive' }}</span>
                </p>
            </div>
        </Dialog>

        <!-- Diálogo de confirmación de inactivar -->
        <Dialog v-model:visible="displayConfirmation" header="Confirmation" modal class="max-w-sm">
            <p>Are you sure you want to proceed with this action?</p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="No" icon="pi pi-times" @click="closeConfirmation"
                        class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="changeServerStatus"
                        class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>

        <!-- Diálogo de confirmación borrar -->
        <Dialog v-model:visible="displayDeleteConfirmation" header="Delete confirmation" modal class="max-w-sm">
            <p>Are you sure you want to delete this server?</p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="No" icon="pi pi-times" @click="closeDeleteConfirmation"
                        class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="deleteServer"
                        class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
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

.field-group {
    border: 1px solid #e2e8f0;
    /* Borde gris claro */
    border-radius: 8px;
    /* Bordes redondeados */
    padding: 16px;
    /* Espaciado interno */
    margin-bottom: 16px;
    /* Espacio debajo del contenedor */
}

.field-group .font-semibold {
    margin-bottom: 12px;
    /* Espacio debajo del título */
}

.input-with-line {
    border: none;
    border-bottom: 1px solid #d1d5db;
    /* Línea de color gris claro */
    padding: 0.5rem 0.4rem;
    /* Ajustar el padding vertical */
    background: transparent;
    /* Fondo transparente */
    outline: none;
    /* Eliminar el borde de enfoque predeterminado */
    box-shadow: none;
    /* Eliminar la sombra del campo de entrada */
}

/* Opcional: para añadir algo de espacio debajo del input */
.input-with-line {
    margin-bottom: 0.5rem;
    /* Espacio debajo del campo de entrada */
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
</style>
