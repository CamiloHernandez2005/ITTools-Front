<script>
import { regionService } from '@/services/RegionService';
import { serverService } from '@/services/ServerDBService';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import FloatLabel from 'primevue/floatlabel';

export default {
    components: {
        InputText,
        Button,
        Dropdown,
        DataTable,
        Column,
        Dialog,
        FloatLabel
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
                serverName: '',
                description: '',
                ipServer: '',
                portServer: '',
                instance: '',
                serverDB: '',
                userLogin: '',
                password: '',
                repeatPassword: '',
                recyclingDB: '',
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
            globalFilter: '',
            editServerData: {
                idServer: null,
                serverName: '',
                description: '',
                ipServer: '',
                portServer: '',
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
            filterActiveOnly: true
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
                    instance: this.server.instance,
                    serverDB: this.server.serverDB,
                    userLogin: this.server.userLogin,
                    password: this.server.password,
                    recyclingDB: this.server.recyclingDB,
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
        async handleClose() {
            this.showCreateModal = false;
            this.isEditDialogVisible = false;
        },

        validateIP(ip) {
            const ipPattern = /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
            return ipPattern.test(ip);
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
                instance: '',
                serverDB: '',
                userLogin: '',
                password: '',
                repeatPassword: '',
                recyclingDB: '',
                regionId: null
            };
            this.error = '';
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
                const filter = this.globalFilter.toLowerCase();
                const isActive = this.filterActiveOnly ? server.status === 1 : true;

                return isActive && Object.values(server).some((value) => (value ? value.toString().toLowerCase().includes(filter) : false));
            });
        },
        toggleFilter() {
            this.filterActiveOnly = !this.filterActiveOnly;
            this.filterServers();
        }
    },
    watch: {
        globalFilter() {
            this.filterServers();
        }
    }
};
</script>

<template>
    <div class="flex flex-col h-screen p-4">
        <div class="flex-2">
            <div class="card p-4 flex flex-col gap-4 h-full">
                <div class="font-semibold text-xl">Servers</div>
                <div class="flex justify-between items-center mb-2">
                    <div class="flex gap-2">
                        <Button label="Create User" icon="pi pi-plus" id="create-button" @click="openCreateModal" />
                        <Button label="Filter All" icon="pi pi-filter" id="close-button" @click="toggleFilter"  />
                    </div>
                    <InputText v-model="globalFilter" placeholder="Global search..." class="p-inputtext p-component" />
                </div>
                <!-- Contenedor de búsqueda -->

                <div class="overflow-x-auto">
                    <DataTable :value="filteredServers" class="p-datatable-sm" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]" :totalRecords="servers.length" sortMode="multiple">
                        <Column field="serverName" header="Server Name" sortable />
                        <Column field="description" header="Description" sortable />
                        <Column field="ipServer" header="IP Address" sortable />
                        <Column field="serverDB" header="Server DB" sortable />
                        <Column field="region" header="Region" sortable>
                            <template #body="{ data }">
                                <span>{{ getRegionName(data.regionId) }}</span>
                            </template>
                        </Column>
                        <Column field="status" header="Status" sortable>
                            <template #body="{ data }">
                                <span :class="data.status === 1 ? 'text-green-500' : 'text-red-500'">{{ data.status === 1 ? 'Active' : 'Inactive' }}</span>
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button icon="pi pi-eye" class="p-button-rounded p-button-success p-button-text" @click="showServerDetails(data)" />
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-info p-button-text" @click="editServer(data)" />
                                <Button
                                    :icon="data.status === 1 ? 'pi pi-power-off' : 'pi pi-power-off'"
                                    :class="data.status === 1 ? 'p-button-rounded p-button-danger p-button-text' : 'p-button-rounded p-button-success p-button-text'"
                                    @click="openConfirmation(data, data.status === 1)"
                                />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text" @click="confirmDeleteServer(data.idServer)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>

        <!-- Sección de creación de servidor -->
        <div>
            <!-- Modal -->
            <Dialog header="Create Server" v-model:visible="showCreateModal" modal @hide="closeCreateModal" style="width: 70vw; max-width: auto; height: auto; max-height: auto" class="custom-dialog">
                <form @submit.prevent="createServer">
                    <!-- Contenedor principal en grid -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Fila superior con tres columnas -->
                        <div class="field-group p-4 border border-gray-300 rounded-md lg:col-span-1">
                            <div class="font-semibold text-lg mb-2">Network Details</div>
                            <div class="flex flex-wrap gap-8">
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="ipServer">IP Server</label>
                                    <InputText id="ipServer" v-model="server.ipServer" class="p-inputtext-sm input-with-line" placeholder="Enter IP Server" required />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="portServer">Port Server</label>
                                    <InputText id="portServer" v-model="server.portServer" class="p-inputtext-sm input-with-line" placeholder="Enter Port Server" />
                                </div>
                            </div>
                        </div>

                        <div class="field-group p-4 border border-gray-300 rounded-md lg:col-span-1">
                            <div class="font-semibold text-lg mb-2">Server Information</div>
                            <div class="flex flex-wrap gap-4">
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="serverName">Server Name</label>
                                    <InputText id="serverName" v-model="server.serverName" class="p-inputtext-sm input-with-line" placeholder="Enter Server Name" required />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="description">Description</label>
                                    <InputText id="description" v-model="server.description" class="p-inputtext-sm input-with-line" placeholder="Enter Description" />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="serverDB">Server DB</label>
                                    <InputText id="serverDB" v-model="server.serverDB" class="p-inputtext-sm input-with-line" placeholder="Enter Server DB" />
                                </div>
                            </div>
                        </div>

                        <div class="field-group p-4 border border-gray-300 rounded-md lg:col-span-1 lg:row-span-2">
                            <div class="font-semibold text-lg mb-2">Additional Information</div>
                            <div class="flex flex-wrap gap-4">
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="dbFR">recyclingDB</label>
                                    <InputText id="dbFR" v-model="server.recyclingDB" class="p-inputtext-sm input-with-line" placeholder="Enter DB FR" />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="regionDropdown">Region</label>
                                    <Dropdown id="regionDropdown" v-model="server.regionId" :options="regions" optionLabel="nameRegion" optionValue="idRegion" filter filterPlaceholder="Search..." class="custom-dropdown p-dropdown-sm" />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="instance">Instance</label>
                                    <InputText id="instance" v-model="server.instance" class="p-inputtext-sm input-with-line" placeholder="Enter Instance" />
                                </div>
                            </div>
                        </div>

                        <!-- Fila inferior -->
                        <div class="field-group p-4 border border-gray-300 rounded-md lg:col-span-2">
                            <div class="font-semibold text-lg mb-2">Access Details</div>
                            <div class="flex flex-wrap gap-4">
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="userLogin">User Login</label>
                                    <InputText id="userLogin" v-model="server.userLogin" class="p-inputtext-sm input-with-line" placeholder="Enter your username" />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="password">Password</label>
                                    <InputText id="password" type="password" v-model="server.password" class="p-inputtext-sm input-with-line" placeholder="Enter your password" required />
                                </div>
                                <div class="flex flex-col grow basis-0 gap-2 w-full">
                                    <label for="repeatPassword">Repeat Password</label>
                                    <InputText id="repeatPassword" type="password" v-model="server.repeatPassword" class="p-inputtext-sm input-with-line" placeholder="Repeat your password" required />
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

        <!-- Diálogo de edición -->
        <Dialog v-model:visible="isEditDialogVisible" header="Edit Server" modal :style="{ 'max-width': '30vw', width: '30vw' }">
            <form @submit.prevent="updateServer">
                <div class="flex gap-4">
                    <div class="flex flex-col w-1/2 gap-4">
                        <label for="editServerName">Server Name</label>
                        <InputText id="editServerName" type="text" v-model="editServerData.serverName" class="p-inputtext-sm input-with-line" placeholder="Enter server name" required />
                        <label for="editDescription">Description</label>
                        <InputText id="editDescription" type="text" v-model="editServerData.description" class="p-inputtext-sm input-with-line" placeholder="Enter description" />
                        <label for="editIpServer">IP Server</label>
                        <InputText id="editIpServer" type="text" v-model="editServerData.ipServer" class="p-inputtext-sm input-with-line" placeholder="Enter IP address" required />
                        <label for="editPortServer">Port Server</label>
                        <InputText id="editPortServer" type="text" v-model="editServerData.portServer" class="p-inputtext-sm input-with-line" placeholder="Enter port number" />
                        <label for="editInstance">Instance</label>
                        <InputText id="editInstance" type="text" v-model="editServerData.instance" class="p-inputtext-sm input-with-line" placeholder="Enter instance" />
                    </div>
                    <div class="flex flex-col w-1/2 gap-4">
                        <label for="editServerDB">Server DB</label>
                        <InputText id="editServerDB" type="text" v-model="editServerData.serverDB" class="p-inputtext-sm input-with-line" placeholder="Enter database" />
                        <label for="editUserLogin">User Login</label>
                        <InputText id="editUserLogin" type="text" v-model="editServerData.userLogin" class="p-inputtext-sm input-with-line" placeholder="Enter user login" />
                        <label for="editPassword">Password</label>
                        <InputText id="editPassword" type="password" v-model="editServerData.password" class="p-inputtext-sm input-with-line" placeholder="Enter password" required />
                        <label for="editDbFR">recyclingDB</label>
                        <InputText id="editDbFR" type="text" v-model="editServerData.recyclingDB" class="p-inputtext-sm input-with-line" placeholder="Enter DB FR" />
                        <label for="editRegionId">Region</label>
                        <Dropdown id="editRegionId" v-model="editServerData.regionId" :options="regions" optionValue="idRegion" optionLabel="nameRegion" filter filterPlaceholder="Search..." class="custom-dropdown p-dropdown-sm" />
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
        <Dialog v-model:visible="isShowDialogVisible" header="Server Details" modal :style="{ 'max-width': '25vw', width: '25vw' }">
            <div v-if="detailServerData" class="flex flex-col gap-4">
                <p><strong>Server Name:</strong> {{ detailServerData.serverName }}</p>
                <p><strong>Description:</strong> {{ detailServerData.description }}</p>
                <p><strong>IP Server:</strong> {{ detailServerData.ipServer }}</p>
                <p><strong>Port Server:</strong> {{ detailServerData.portServer }}</p>
                <p><strong>Instance:</strong> {{ detailServerData.instance }}</p>
                <p><strong>Database Server:</strong> {{ detailServerData.serverDB }}</p>
                <p><strong>User Login:</strong> {{ detailServerData.userLogin }}</p>
                <p><strong>recyclingDB:</strong> {{ detailServerData.recyclingDB }}</p>
                <p><strong>Region:</strong> {{ getRegionName(detailServerData.regionId) }}</p>
                <p>
                    <strong>Status:</strong> <span :class="detailServerData.status ? 'text-green-500' : 'text-red-500'">{{ detailServerData.status ? 'Active' : 'Inactive' }}</span>
                </p>
            </div>
        </Dialog>

        <!-- Diálogo de confirmación de inactivar -->
        <Dialog v-model:visible="displayConfirmation" header="Confirmation" modal class="max-w-sm">
            <p>Are you sure you want to proceed with this action?</p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="No" icon="pi pi-times" @click="closeConfirmation" class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="changeServerStatus" class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>

        <!-- Diálogo de confirmación borrar -->
        <Dialog v-model:visible="displayDeleteConfirmation" header="Delete Confirmation" modal class="max-w-sm">
            <p>Are you sure you want to delete this server?</p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="No" icon="pi pi-times" @click="closeDeleteConfirmation" class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="deleteServer" class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.custom-dropdown {
    height: calc(2rem + 2.5px); /* Altura total del Dropdown */
    line-height: 2rem; /* Altura de la línea del Dropdown */
    padding: 0 0.5rem; /* Padding ajustado para alinear el texto verticalmente */
    font-size: 0.875rem; /* Tamaño de fuente del texto dentro del Dropdown */
    border: 0.5px solid #ccc; /* Borde del Dropdown */
    border-radius: 6px; /* Radio del borde del Dropdown */
    display: flex; /* Usa flexbox para alinear el contenido */
    align-items: center; /* Alinea el contenido verticalmente en el centro */
}

.p-dropdown {
    height: 100%; /* Usa el 100% de la altura definida */
    line-height: 2rem; /* Alinea la altura de línea para el contenido del Dropdown */
}

.p-dropdown .p-dropdown-label {
    height: 100%; /* Usa toda la altura disponible */
    line-height: 2rem; /* Alinea el texto dentro de la etiqueta */
}

.p-dropdown .p-dropdown-items {
    font-size: 0.875rem; /* Tamaño de fuente de las opciones */
}

.field-group {
    border: 1px solid #e2e8f0; /* Borde gris claro */
    border-radius: 8px; /* Bordes redondeados */
    padding: 16px; /* Espaciado interno */
    margin-bottom: 16px; /* Espacio debajo del contenedor */
}

.field-group .font-semibold {
    margin-bottom: 12px; /* Espacio debajo del título */
}

.input-with-line {
    border: none;
    border-bottom: 1px solid #d1d5db; /* Línea de color gris claro */
    padding: 0.5rem 0.4rem; /* Ajustar el padding vertical */
    background: transparent; /* Fondo transparente */
    outline: none; /* Eliminar el borde de enfoque predeterminado */
    box-shadow: none; /* Eliminar la sombra del campo de entrada */
}

/* Opcional: para añadir algo de espacio debajo del input */
.input-with-line {
    margin-bottom: 0.5rem; /* Espacio debajo del campo de entrada */
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
</style>
