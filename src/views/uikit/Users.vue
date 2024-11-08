<script>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { registerUser, authService } from '@/services/AuthService';
import { roleService } from '@/services/RoleService'; // Importar roleService
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Breadcrumb from 'primevue/breadcrumb';
import { FilterMatchMode } from '@primevue/core/api';
import MultiSelect from 'primevue/multiselect';

export default {
    components: {
        InputText,
        Button,
        Checkbox,
        DataTable,
        Column,
        Dialog,
        Breadcrumb,
        MultiSelect
    },
    setup() {
        const toast = useToast();
        const error = ref('');
        const roles = ref([]); // Almacena los roles cargados desde la API
        const selectedRoles = ref([]); // Almacena los roles seleccionados
        const columnFilter = ref('');
        const isColumnFilterVisible = ref(false);
        const activeFilterColumn = ref('');

        const showSuccess = (detail) => {
            toast.add({ severity: 'success', summary: 'Success', detail, life: 3000 });
        };

        const showError = (detail) => {
            toast.add({ severity: 'error', summary: 'Error', detail, life: 3000 });
        };

        const loadRoles = async () => {
            try {
                const allRoles = await roleService.getRoles(); // Carga todos los roles desde la API
                roles.value = allRoles.filter((role) => role.status == 1); // Filtra solo roles activos
            } catch (err) {
                showError('Failed to load roles');
            }
        };

        onMounted(() => {
            loadRoles(); // Cargar roles cuando se monta el componente
        });

        return {
            toast,
            showSuccess,
            showError,
            error,
            roles,
            selectedRoles,
            columnFilter,
            isColumnFilterVisible,
            activeFilterColumn
        };
    },
    data() {
        return {
            user: {
                email: '',
                password: '',
                full_name: '',
                charge: '',
                area: '',
                status: true
            },
            filters: {
                global: { value: null, matchMode: FilterMatchMode.CONTAINS },
                full_name:  { value: null, matchMode: FilterMatchMode.CONTAINS },
                area:   { value: null, matchMode: FilterMatchMode.CONTAINS },
                roles:{ value: null, matchMode: FilterMatchMode.CONTAINS },
            },
            users: [],
            filteredUsers: [],
            searchQuery: '',
            columnFilter: '',
            isColumnFilterVisible: false,
            activeFilterColumn: '',
            isEditDialogVisible: false,
            isCreateUserDialogVisible: false,
            editUserData: {
                email: '',
                password: '',
                full_name: '',
                charge: '',
                area: '',
                roles: []
            },
            isShowDialogVisible: false,
            detailUserData: {
                email: '',
                full_name: '',
                charge: '',
                area: '',
                roles: [],
                status: true
            },
            displayConfirmation: false,
            userToChangeStatus: null,
            displayDeleteConfirmation: false,
            isActivating: false,
            showAll: false, // Variable para gestionar el estado de filtrado

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
                    route: { name: 'formlayout' }
                },
                {
                    icon: 'pi pi-users',
                    label: 'Users',
                    route: { name: 'formlayout' }
                }
            ]
        };
    },
    async created() {
        await this.loadUsers();
    },
    methods: {
        async loadUsers() {
            try {
                this.users = await authService.getUsers();
                // Filtra solo los usuarios activos por defecto
                this.filteredUsers = this.users.filter((user) => user.status);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        },

        async registerUser() {
            try {
                this.editUserData.roles = this.selectedRoles;
                await registerUser(this.editUserData);
                this.showSuccess('User registered successfully');
                await this.loadUsers();
                this.resetForm(); // Limpia el formulario después de registrar el usuario
                this.isCreateUserDialogVisible = false;
            } catch (err) {
                this.showError(err.message || 'Registration failed');
            }
        },

        async updateUser() {
            try {
                await authService.updateUser(this.editUserData);
                this.showSuccess('User updated successfully');
                await this.loadUsers();
                this.resetForm();
                this.isEditDialogVisible = false;
            } catch (err) {
                this.showError(err.message || 'Update failed');
            }
        },
        async deleteUser() {
            try {
                await authService.deleteUser(this.userToDelete);
                this.showSuccess('User deleted successfully');
                await this.loadUsers();
                this.displayDeleteConfirmation = false;
                this.userToDelete = null;
            } catch (err) {
                this.showError(this.error || 'Delete failed');
            }
        },
        async changeUserStatus() {
            try {
                const updatedUser = { ...this.userToChangeStatus, status: this.isActivating };
                await authService.updateUser(updatedUser);
                this.showSuccess('User status changed successfully');
                await this.loadUsers();
                this.displayConfirmation = false;

                // Aplicar el filtro después de cargar los usuarios
                this.filterUsers();
            } catch (err) {
                this.showError(this.error || 'Status change failed');
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
            this.isCreateUserDialogVisible = false;
            this.isEditDialogVisible = false;
        },
        openConfirmation(user, isActivating) {
            this.userToChangeStatus = user;
            this.isActivating = isActivating;
            this.displayConfirmation = true;
        },

        closeConfirmation() {
            this.displayConfirmation = false;
            this.userToChangeStatus = null;
        },
        closeDeleteConfirmation() {
            this.displayDeleteConfirmation = false;
            this.userToDelete = null;
        },
        showColumnFilter(columnName) {
            this.activeFilterColumn = columnName;
            this.isColumnFilterVisible = true;
        },
        applyColumnFilter() {
            this.filters[this.activeFilterColumn] = { value: this.columnFilter, matchMode: FilterMatchMode.CONTAINS };
            this.isColumnFilterVisible = false; // Oculta el input después de aplicar el filtro
            this.filterUsers(); // Aplica el filtro a los usuarios
        },
        resetColumnFilter() {
            this.columnFilter = '';
            this.filters[this.activeFilterColumn] = { value: null, matchMode: FilterMatchMode.CONTAINS };
            this.isColumnFilterVisible = false; // Ocultar el input
            this.filterUsers(); // Llamar a la función de filtrado
        },
        resetForm() {
            this.user = {
                email: '',
                password: '',
                full_name: '',
                charge: '',
                area: '',
                status: true
            };
            this.selectedRoles = [];
            this.editUserData = { ...this.user, roles: [] }; // Restablece el formulario de edición también
        },
        editUser(user) {
            this.editUserData = { ...user, roles: [...user.roles] };
            this.isEditDialogVisible = true;
        },
        showUserDetails(user) {
            this.detailUserData = { ...user, roles: [...user.roles] };
            this.isShowDialogVisible = true;
        },
        confirmDeleteUser(userId) {
            this.userToDelete = userId;
            this.displayDeleteConfirmation = true;
        },
        openCreateUserDialog() {
            this.resetForm(); // Limpia el formulario al abrir el diálogo de creación
            this.isCreateUserDialogVisible = true;
        },
        filterUsers() {
            this.filteredUsers = this.users.filter((user) => {
                const globalFilter = this.filters.global.value?.toLowerCase() || '';
                const columnFilter = this.filters[this.activeFilterColumn]?.value?.toLowerCase() || '';

                const matchesGlobalFilter = globalFilter ? `${user.email} ${user.full_name} ${user.charge} ${user.area} ${user.roles.join(', ')}`.toLowerCase().includes(globalFilter) : true;

                const matchesColumnFilter = columnFilter ? user[this.activeFilterColumn]?.toString().toLowerCase().includes(columnFilter) : true;

                return matchesGlobalFilter && matchesColumnFilter && (this.showAll || user.status);
            });
        },
        toggleFilter() {
            this.showAll = !this.showAll; // Alterna el estado de showAll
            this.filterUsers(); // Aplica el filtro actualizado
        }
    }
};
</script>

<template>
    <div class="flex flex-col h-screen p-4">
        <div class="flex-2">
            <div class="card p-6 flex flex-col h-full shadow-custom border">
                <div class="header-container">
                    <div class="title font-semibold text-xl">Users</div>
                    <Breadcrumb :home="home" :model="items" />
                </div>

                <div class="overflow-x-auto">
                    <DataTable
                        :value="filteredUsers"
                        :paginator="true"
                        :rows="10"
                        :rowsPerPageOptions="[5, 10, 20]"
                        class="p-datatable-sm"
                        dataKey="id"
                        :rowHover="true"
                        v-model:filters="filters"
                        filterDisplay="menu"
                        :globalFilterFields="['full_name', 'area', 'roles']"
                    >
                        <template #header>
                            <div class="flex justify-between">
                                <div class="flex gap-2">
                                    <Button label="Create user" icon="pi pi-plus" id="create-button" @click="openCreateUserDialog" />
                                    <Button label="Filter all" icon="pi pi-filter" id="close-button" @click="toggleFilter" />
                                </div>
                                <div class="flex gap-2"><InputText v-model="filters['global'].value" placeholder="Global search" /> <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()" /></div>
                            </div>
                        </template>

                        <template #empty> No users found. </template>
                        <template #loading> Loading users data. Please wait. </template>

                        <Column field="full_name" header="Full Name" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ data.full_name }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by Full Name" />
                            </template>
                        </Column>

                        <Column field="area" header="Area" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ data.area }}
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by Area" />
                            </template>
                        </Column>

                        <Column field="roles" header="Roles" sortable :showFilterMatchModes="false" >
                            <template #body="{ data }">
                                <span>{{ data.roles.join(', ') }}</span>
                            </template>
                            <template #filter="{ filterModel }">
                                <InputText v-model="filterModel.value" type="text" placeholder="Search by Roles" />
                            </template>
                        </Column>

                        <Column field="status" header="Status" sortable :showFilterMatchModes="false" >
                            <template #body="{ data }">
                                <span :class="data.status ? 'text-green-500' : 'text-red-500'">{{ data.status ? 'Active' : 'Inactive' }}</span>
                            </template>
                        </Column>

                        <Column header="Actions">
                            <template #body="{ data }">
                                <Button icon="pi pi-eye" class="p-button-rounded p-button-success p-button-text" @click="showUserDetails(data)" />
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-info p-button-text" @click="editUser(data)" />
                                <Button
                                    :icon="data.status ? 'pi pi-power-off' : 'pi pi-power-off'"
                                    :class="data.status ? 'p-button-rounded p-button-danger p-button-text' : 'p-button-rounded p-button-success p-button-text'"
                                    @click="openConfirmation(data, !data.status)"
                                />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text" @click="confirmDeleteUser(data.id)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>

        <!-- Diálogo de creación de usuario -->
        <Dialog v-model:visible="isCreateUserDialogVisible" header="Create user" modal :style="{ 'max-width': '30vw', width: '30vw' }">
            <form @submit.prevent="registerUser">
                <div class="flex gap-4">
                    <!-- Sección de Inputs -->
                    <div class="flex flex-col w-1/2 gap-4">
                        <div class="flex flex-wrap gap-4">
                            <div class="flex flex-col grow basis-0 gap-2">
                                <label for="emailCreate">Email</label>
                                <InputText id="emailCreate" type="email" v-model="editUserData.email" class="p-inputtext-sm input-with-line" placeholder="Enter email" required />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2">
                                <label for="passwordCreate">Password</label>
                                <InputText id="passwordCreate" type="password" v-model="editUserData.password" class="p-inputtext-sm input-with-line" placeholder="Enter password" required />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2">
                                <label for="full_nameCreate">Full name</label>
                                <InputText id="full_nameCreate" type="text" v-model="editUserData.full_name" class="p-inputtext-sm input-with-line" placeholder="Enter full name" required />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2">
                                <label for="chargeCreate">Charge</label>
                                <InputText id="chargeCreate" type="text" v-model="editUserData.charge" class="p-inputtext-sm input-with-line" placeholder="Enter charge" required />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2">
                                <label for="areaCreate">Area</label>
                                <InputText id="areaCreate" type="text" v-model="editUserData.area" class="p-inputtext-sm input-with-line" placeholder="Enter area" required />
                            </div>
                        </div>
                    </div>
                    <!-- Sección de Roles -->
                    <div class="flex flex-col w-1/2 gap-2 pl-12">
                        <!-- Añadido padding-left para espaciar -->
                        <label>Roles</label>
                        <div v-for="role in roles" :key="role.id" class="flex items-center">
                            <Checkbox v-model="selectedRoles" :value="role.authority" class="mr-2" />
                            <label>{{ role.authority }}</label>
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

        <!-- Diálogo de edición de usuario-->
        <Dialog v-model:visible="isEditDialogVisible" header="Edit user" modal :style="{ 'max-width': '30vw', width: '30vw' }">
            <form @submit.prevent="updateUser">
                <div class="flex gap-4">
                    <!-- Sección de Inputs -->
                    <div class="flex flex-col w-1/2 gap-4">
                        <div class="flex flex-wrap gap-4">
                            <div class="flex flex-col grow basis-0 gap-2">
                                <label for="emailEdit">Email</label>
                                <InputText id="emailEdit" type="email" v-model="editUserData.email" class="p-inputtext-sm input-with-line" placeholder="Enter email" required />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2">
                                <label for="passwordEdit">Password</label>
                                <InputText id="passwordEdit" type="password" v-model="editUserData.password" class="p-inputtext-sm input-with-line" placeholder="Enter password" required />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2">
                                <label for="full_nameEdit">Full name</label>
                                <InputText id="full_nameEdit" type="text" v-model="editUserData.full_name" class="p-inputtext-sm input-with-line" placeholder="Enter full name" required />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2">
                                <label for="chargeEdit">Charge</label>
                                <InputText id="chargeEdit" type="text" v-model="editUserData.charge" class="p-inputtext-sm input-with-line" placeholder="Enter charge" required />
                            </div>
                            <div class="flex flex-col grow basis-0 gap-2">
                                <label for="areaEdit">Area</label>
                                <InputText id="areaEdit" type="text" v-model="editUserData.area" class="p-inputtext-sm input-with-line" placeholder="Enter area" required />
                            </div>
                        </div>
                    </div>
                    <!-- Sección de Roles -->
                    <div class="flex flex-col w-1/2 gap-2 pl-12">
                        <label>Roles</label>
                        <div v-for="role in roles" :key="role.id" class="flex items-center">
                            <Checkbox v-model="editUserData.roles" :value="role.authority" class="mr-2" />
                            <label>{{ role.authority }}</label>
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
    </div>
    <!-- Diálogo de detalle de usuario -->
    <Dialog v-model:visible="isShowDialogVisible" modal header="User details" :style="{ 'max-width': '25vw', width: '25vw' }">
        <div class="flex flex-col gap-4">
            <div><strong>Email:</strong> {{ detailUserData.email }}</div>
            <div><strong>Full name:</strong> {{ detailUserData.full_name }}</div>
            <div><strong>Charge:</strong> {{ detailUserData.charge }}</div>
            <div><strong>Area:</strong> {{ detailUserData.area }}</div>
            <div><strong>Roles:</strong> {{ detailUserData.roles.join(', ') }}</div>
            <div>
                <strong>Status:</strong> <span :class="detailUserData.status ? 'text-green-500' : 'text-red-500'">{{ detailUserData.status ? 'Active' : 'Inactive' }}</span>
            </div>
        </div>
    </Dialog>

    <!-- Diálogo de confirmación borrar -->
    <Dialog v-model:visible="displayDeleteConfirmation" header="Delete confirmation" modal class="max-w-sm">
        <p>Are you sure you want to delete this user?</p>
        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="No" icon="pi pi-times" @click="closeDeleteConfirmation" class="p-button-text p-button-secondary" />
                <Button label="Yes" icon="pi pi-check" @click="deleteUser" class="p-button-text p-button-danger" />
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
                <Button label="No" icon="pi pi-times" @click="closeConfirmation" class="p-button-text p-button-secondary" />
                <Button label="Yes" icon="pi pi-check" @click="changeUserStatus" class="p-button-text p-button-danger" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
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
