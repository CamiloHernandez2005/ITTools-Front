<script>
import { roleService } from '@/services/RoleService';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Breadcrumb from 'primevue/breadcrumb';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

export default {
    components: {
        InputText,
        Button,
        DataTable,
        Column,
        Dialog,
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
            role: {
                authority: '',
                description: ''
            },
            roles: [],
            filteredRoles: [], // Usado para el filtrado de roles
            selectedRoleId: null,
            isEditDialogVisible: false,
            isCreateRoleDialogVisible: false,
            roleToChangeStatus: null,
            isActivating: false,
            editRoleData: {
                authority: '',
                description: ''
            },
            displayDeleteConfirmation: false,
            roleToDelete: null,
            displayConfirmation: false,
            searchQuery: '', // Consulta de búsqueda
            filters: {
                global: { value: null, matchMode: FilterMatchMode.CONTAINS },
                authority: { value: null, matchMode: FilterMatchMode.CONTAINS },
                description: { value: null, matchMode: FilterMatchMode.CONTAINS }
            },
            showAll: false, // Controla la visualización de todos los roles o solo activos

            // Definición del breadcrumb
            home: {
                label: 'Home',
                icon: 'pi pi-home',
                url: '/'
            },
            items: [
                {
                    label: 'Tools',
                    icon: 'pi pi-fw pi-cog',
                    route: { name: 'Roles' }
                },
                {
                    label: 'Roles',
                    icon: 'pi pi-fw pi-shield',
                    route: { name: 'Roles' }
                }
            ]
        };
    },
    async created() {
        await this.loadRoles();
    },
    methods: {
        isLastItem(item) {
            return item === this.items[this.items.length - 1];
        },

        async loadRoles() {
            try {
                this.roles = await roleService.getRoles();
                this.filterRoles(); // Aplica el filtro sin modificar showAll
            } catch (error) {
                this.showError('Error fetching roles');
                console.error('Error fetching roles:', error);
            }
        },
        async registerRole() {
            try {
                await roleService.registerRole(this.role);
                this.showSuccess('Role registered successfully');
                await this.loadRoles();
                this.isCreateRoleDialogVisible = false;
            } catch (err) {
                this.showError(err.message || 'Registration failed');
            }
        },
        async updateRole() {
            try {
                await roleService.updateRole(this.editRoleData.id, this.editRoleData);
                this.showSuccess('Role updated successfully');
                await this.loadRoles();
                this.isEditDialogVisible = false;
            } catch (err) {
                this.showError(err.message || 'Update failed');
            }
        },
        async deleteRole() {
            try {
                await roleService.deleteRole(this.roleToDelete);
                this.showSuccess('Role deleted successfully');
                await this.loadRoles();
                this.displayDeleteConfirmation = false;
                this.roleToDelete = null;
            } catch (err) {
                // Muestra el mensaje del backend si está presente
                this.showError(err.message || 'Deletion failed');
                this.displayDeleteConfirmation = false;
            }
        },
        async changeRoleStatus() {
            try {
                await roleService.updateRole(this.roleToChangeStatus.id, this.roleToChangeStatus);
                this.showSuccess('Role status changed successfully');
                await this.loadRoles();
                this.displayConfirmation = false;
                this.roleToChangeStatus = null;

                // Aplica el filtro según el valor actual de showAll
                this.filterRoles();
            } catch (err) {
                this.showError(this.error || 'Status change failed');
            }
        },
        async handleClose() {
            this.isCreateRoleDialogVisible = false;
            this.isEditDialogVisible = false;
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

        openCreateRoleDialog() {
            this.resetForm(); // Limpia el formulario al abrir el diálogo de creación
            this.isCreateRoleDialogVisible = true;
        },
        resetForm() {
            this.role = {
                authority: '',
                description: ''
            };
            this.editRoleData = { ...this.role }; // Restablece el formulario de edición también
        },
        editRole(role) {
            this.editRoleData = { ...role };
            this.isEditDialogVisible = true;
        },
        confirmDeleteRole(roleId) {
            this.roleToDelete = roleId;
            this.displayDeleteConfirmation = true;
        },
        openConfirmation(role, isActivating) {
            this.roleToChangeStatus = { ...role, status: isActivating };
            this.isActivating = isActivating;
            this.displayConfirmation = true;
        },

        closeConfirmation() {
            this.displayConfirmation = false;
            this.roleToChangeStatus = null;
        },
        closeDeleteConfirmation() {
            this.displayDeleteConfirmation = false;
            this.roleToDelete = null;
        },
        filterRoles() {
            this.filteredRoles = this.roles.filter((role) => {
                const globalFilter = this.filters.global.value;
                if (!globalFilter) return this.showAll || role.status; // Muestra todos si showAll es true, o solo activos si false

                const roleString = `${role.authority} ${role.description}`.toLowerCase();
                return roleString.includes(globalFilter.toLowerCase()) && (this.showAll || role.status);
            });
        },
        toggleFilter() {
            this.showAll = !this.showAll; // Alterna el estado de showAll
            this.filterRoles(); // Aplica el filtro actualizado
        }
    },
    watch: {
        searchQuery() {
            this.filters.global.value = this.searchQuery;
            this.filterRoles();
        }
    }
};
</script>
<template>
    <div class="flex flex-col h-screen p-4">
        <div class="flex-2">
            <div class="card p-6 flex flex-col h-full shadow-custom border">
                <!-- Agrupar los dos elementos: titulo y breadcrumb -->
                <div class="header-container">
                    <div class="title font-semibold text-xl">Roles</div>
                    <Breadcrumb :home="home" :model="items" />
                </div>


                <div class="overflow-x-auto">
                    <DataTable
                        :value="filteredRoles"
                        class="p-datatable-sm"
                        :paginator="true"
                        :rows="10"
                        :rowsPerPageOptions="[5, 10, 20]"
                        :totalRecords="filteredRoles.length"
                        dataKey="id"
                        :rowHover="true"
                        v-model:filters="filters"
                        filterDisplay="menu"
                        :globalFilterFields="['authority', 'description']"
                    >

                    <template #header>
                            <div class="flex justify-between">
                                <div class="flex gap-2">
                                    <Button label="Create role" icon="pi pi-plus" id="create-button" @click="openCreateRoleDialog" />
                                    <Button label="Filter all" icon="pi pi-filter" id="close-button" @click="toggleFilter" />
                                </div>
                                <div class="flex gap-2"><InputText v-model="filters['global'].value" placeholder="Global search" /> <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()" /></div>
                            </div>
                        </template>

                        <template #empty> No users found. </template>
                        <template #loading> Loading users data. Please wait. </template>

                        <Column field="authority" header="Name" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ data.authority }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by name" />
                            </template>
                        </Column>

                        <Column field="description" header="Description" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ data.description }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by description" />
                            </template>
                        </Column>
                        
                        <Column field="status" header="Status" sortable>
                            <template #body="{ data }">
                                <span :class="data.status ? 'text-green-500' : 'text-red-500'">{{ data.status ? 'Active' : 'Inactive' }}</span>
                            </template>
                        </Column>
                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-info p-button-text" @click="editRole(data)" />
                                <Button
                                    :icon="data.status ? 'pi pi-power-off' : 'pi pi-power-off'"
                                    :class="data.status ? 'p-button-rounded p-button-danger p-button-text' : 'p-button-rounded p-button-success p-button-text'"
                                    @click="openConfirmation(data, !data.status)"
                                />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text" @click="confirmDeleteRole(data.id)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>

        <!-- Diálogos para creación, edición y confirmación de borrado -->
        <Dialog v-model:visible="isCreateRoleDialogVisible" modal header="Create role">
            <form @submit.prevent="registerRole">
                <div class="flex gap-4">
                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="nameCreate">Name</label>
                            <InputText id="nameCreate" type="text" v-model="role.authority" class="p-inputtext-sm input-with-line" placeholder="Enter role name" required />
                        </div>
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="descriptionCreate">Description</label>
                            <InputText id="descriptionCreate" type="text" v-model="role.description" class="p-inputtext-sm input-with-line" placeholder="Enter role description" required />
                        </div>
                    </div>
                </div>
                <div class="flex justify-end mt-4">
                    <Button id="close-button" label="Close" @click="handleClose" style="margin-right: 8px" />
                    <Button id="create-button" type="submit" label="Create" />
                </div>
            </form>
        </Dialog>

        <Dialog v-model:visible="isEditDialogVisible" modal header="Edit role">
            <form @submit.prevent="updateRole">
                <div class="flex gap-4">
                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="nameEdit">Name</label>
                            <InputText id="nameEdit" type="text" v-model="editRoleData.authority" class="p-inputtext-sm input-with-line" placeholder="Enter role name" required />
                        </div>
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="descriptionEdit">Description</label>
                            <InputText id="descriptionEdit" type="text" v-model="editRoleData.description" class="p-inputtext-sm input-with-line" placeholder="Enter role description" required />
                        </div>
                    </div>
                </div>
                <div class="flex justify-end mt-4">
                    <Button id="close-button" label="Close" @click="handleClose" style="margin-right: 8px" />
                    <Button id="create-button" type="submit" label="Save" />
                </div>
            </form>
        </Dialog>

        <Dialog v-model:visible="displayDeleteConfirmation" header="Delete confirmation" modal class="max-w-sm">
            <p>Are you sure you want to delete this role?</p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="No" icon="pi pi-times" @click="closeDeleteConfirmation" class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="deleteRole" class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="displayConfirmation" header="Confirmation" modal class="max-w-sm">
            <p>Are you sure you want to proceed with this action?</p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="No" icon="pi pi-times" @click="closeConfirmation" class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="changeRoleStatus" class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.input-with-line {
    border: none;
    border-bottom: 1px solid #d1d5db;
    padding: 0.5rem 0.4rem;
    background: transparent;
    outline: none;
    box-shadow: none;
}

.input-with-line {
    margin-bottom: 0.5rem;
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
    border-radius: 8px; /* Opcional: redondear bordes */
}
</style>
