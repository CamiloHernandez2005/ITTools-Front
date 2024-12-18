<script>
import { regionService } from '@/services/RegionService';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Breadcrumb from 'primevue/breadcrumb';
import HelpTooltip from '@/components/Alertas.vue'
import { useToast } from 'primevue/usetoast';
import { getCurrentInstance } from 'vue';

export default {
    components: {
        HelpTooltip,
        InputText,
        Button,
        DataTable,
        Column,
        Dialog,
        Breadcrumb
    },
    setup() {
        const toast = useToast();
        const { proxy } = getCurrentInstance();
        const showHelp = proxy.$help.showHelp;
       

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
            showHelp

        };

    },
    data() {
        return {
            region: {
                nameRegion: '',
                description: '',
                status: 1
            },
            regions: [],
            filteredRegions: [],
            searchQuery: '',
            filters: {
                global: { value: null, matchMode: FilterMatchMode.CONTAINS },
                nameRegion: { value: null, matchMode: FilterMatchMode.CONTAINS },
                description: { value: null, matchMode: FilterMatchMode.CONTAINS }
            },
            isEditDialogVisible: false,
            isRegionDialogVisible: false,
            editRegionData: {
                idRegion: null,
                nameRegion: '',
                description: '',
                status: 1
            },
            displayConfirmation: false,
            regionToChangeStatus: null,
            isActivating: false,
            filterActiveOnly: true,
            displayDeleteConfirmation: false,

            regionToDelete: null,
            // Definición del breadcrumb
            home: {
                label: 'Home',
                icon: 'pi pi-home',
                url: '/homeusers'
            },
            items: [
                {
                    label: 'Tools',
                    icon: 'pi pi-fw pi-cog',
                    route: { name: 'RegionList' }
                },
                {
                    label: 'Regions',
                    icon: 'pi pi-fw pi-globe',
                    route: { name: 'RegionList' }
                }
            ]
        };
    },
    async created() {
        await this.loadRegions();
        this.applyFilter();
    },
    methods: {
        async loadRegions() {
            try {
                this.regions = await regionService.getAllRegions();
                this.applyFilter();
            } catch (error) {
                this.showError('Error fetching regions');
                console.error('Error fetching regions:', error);
            }
        },
        async registerRegion() {
            try {
                await regionService.createRegion(this.region);
                this.showSuccess('Region created successfully');
                await this.loadRegions();
                this.resetForm();
                this.isRegionDialogVisible = false; // Cerrar el diálogo después de la creación
            } catch (err) {
                const errorMessage = err.response && err.response.status === 409 ? err.response.data : err.message || 'Creation failed';
                this.showError(errorMessage);
            }
        },
        async updateRegion() {
            try {
                await regionService.updateRegion(this.editRegionData.idRegion, this.editRegionData);
                this.showSuccess('Region updated successfully');
                await this.loadRegions();
                this.isEditDialogVisible = false;
            } catch (err) {
                if (err.response && err.response.status === 409) {
                    this.showError(err.response.data || 'The region name already exists.');
                } else {
                    this.showError(err.message || 'Update failed');
                }
            }
        },
        async deleteRegion() {
            if (!this.regionToDelete || this.regionToDelete.idRegion == null) {
                this.showError('Region ID is missing');
                return;
            }

            try {
                const response = await regionService.deleteRegion(this.regionToDelete.idRegion);

                if (response.status === 409) {
                    // Muestra el mensaje del backend si está presente
                    this.showError(response.data || 'Cannot delete region: it is currently assigned to a server or agent.');
                } else {
                    this.showSuccess('Region deleted successfully');
                    await this.loadRegions();
                    this.displayDeleteConfirmation = false;
                    this.regionToDelete = null;
                }
            } catch (error) {
                // Muestra el mensaje del backend si está presente
                this.showError(error.message || 'Deletion failed');
                this.displayDeleteConfirmation = false;
            }
        },

        async changeRegionStatus() {
            if (!this.regionToChangeStatus || this.regionToChangeStatus.idRegion == null) {
                this.showError('Region ID is missing');
                return;
            }

            try {
                await regionService.updateRegionStatus(this.regionToChangeStatus.idRegion, this.isActivating ? 1 : 0);
                this.showSuccess('Region status changed successfully');
                await this.loadRegions();
                this.displayConfirmation = false;
                this.regionToChangeStatus = null;
            } catch (err) {
                this.showError(err.message || 'Status change failed');
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
            this.isRegionDialogVisible = false;
            this.isEditDialogVisible = false;
        },

        closeDeleteConfirmation() {
            this.displayDeleteConfirmation = false;
            this.regionToDelete = null;
        },

        resetForm() {
            this.region = {
                nameRegion: '',
                description: '',
                status: 1
            };
        },
        editRegion(region) {
            this.editRegionData = { ...region };
            this.isEditDialogVisible = true;
        },
        openConfirmation(region, isActivating) {
            this.regionToChangeStatus = region;
            this.isActivating = isActivating;
            this.displayConfirmation = true;
        },
        openCreateRegionDialog() {
            this.resetForm();
            this.isRegionDialogVisible = true;
        },
        openDeleteConfirmation(region) {
            this.regionToDelete = region;
            this.displayDeleteConfirmation = true; // Mostrar el diálogo de confirmación
        },

        closeConfirmation() {
            this.displayConfirmation = false;
            this.userToChangeStatus = null;
        },
        applyFilter() {
            this.filteredRegions = this.regions.filter((region) => {
                const globalFilter = this.filters.global.value;
                const isActive = this.filterActiveOnly ? region.status === 1 : true;

                if (!globalFilter) {
                    return isActive;
                }

                const regionString = `${region.nameRegion} ${region.description}`.toLowerCase();
                return isActive && regionString.includes(globalFilter.toLowerCase());
            });
        },
        toggleFilter() {
            this.filterActiveOnly = !this.filterActiveOnly;
            this.applyFilter();
        },
    },
    watch: {
        searchQuery() {
            this.filters.global.value = this.searchQuery;
            this.applyFilter();
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
                    <div class="title font-semibold text-xl">Regions</div>
                    <Breadcrumb :home="home" :model="items" />
                </div>
              
                <div class="table-container">
                    <DataTable :value="filteredRegions" class="p-datatable-sm" :paginator="true" :rows="10"
                        :rowsPerPageOptions="[5, 10, 20]" :totalRecords="regions.length" dataKey="id" :rowHover="true"
                        v-model:filters="filters" filterDisplay="menu"
                        :globalFilterFields="['nameRegion', 'description']">


                        <template #header>
                            
                            <div class="flex justify-between">
                                <div class="flex gap-2">
                                    
                                    <Button label="Create region" icon="pi pi-plus" id="create-button"
                                        @click="openCreateRegionDialog" />
                                       
                                        <div class="tooltip-wrapper">
                                        <HelpTooltip :message="'filter inactive regions'"
                                            :visible="showHelp" />
                                    <Button label="Filter all" icon="pi pi-filter" id="close-button"
                                        @click="toggleFilter" />
                                        </div>
                                </div>
                                <div class="flex gap-2">
                                   
                                       
                                    <InputText v-model="filters['global'].value" placeholder="Global search" /> 
                                   
                                    <div class="tooltip-wrapper">
                                        <HelpTooltip :message="'Close all filters'"
                                            :visible="showHelp" />
                                    <Button
                                        type="button" icon="pi pi-filter-slash" label="Clear" outlined
                                        @click="clearFilter()" />
                                    </div>
                                </div>
                            </div>
                        </template>

                        <template #empty> No regions found. </template>
                        <template #loading> Loading regions data. Please wait. </template>

                        <Column field="nameRegion" header="Name" :showFilterMatchModes="false" sortable>
                            <template #body="{ data }">
                                {{ data.nameRegion }}
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
                                <InputText v-model="filterModel.value" type="text"
                                    placeholder="Search by description" />
                            </template>
                        </Column>
                        <Column field="status" header="Status" sortable>
                            <template #body="{ data }">
                                <span :class="data.status ? 'text-green-500' : 'text-red-500'">
                                    {{ data.status ? 'Active' : 'Inactive' }}
                                </span>
                            </template>
                        </Column>
                        <Column >
                            <template #header>
                                <div class="tooltip-wrapper1">
                                    Actions
                                    <HelpTooltip :message="'Edit section, disable and delete region'"
                                        :visible="showHelp" />
                                </div>
                            </template>
                            <template #body="{ data }">
                                <Button icon="pi pi-pencil" class="p-button-rounded p-button-info p-button-text"
                                    @click="editRegion(data)" />
                                <Button :icon="data.status ? 'pi pi-power-off' : 'pi pi-power-off'"
                                    :class="data.status ? 'p-button-rounded p-button-danger p-button-text' : 'p-button-rounded p-button-success p-button-text'"
                                    @click="openConfirmation(data, !data.status)" />
                                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text"
                                    @click="openDeleteConfirmation(data)" />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>
        
        <!-- Diálogo de creación de región -->
        <Dialog v-model:visible="isRegionDialogVisible" modal header="Create region">
            <form @submit.prevent="registerRegion">
                <div class="flex gap-4">
                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="nameCreate">Name</label>
                            <InputText id="nameCreate" type="text" v-model="region.nameRegion"
                                class="p-inputtext-sm input-with-line" placeholder="Enter name" required />
                        </div>
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="descriptionCreate">Description</label>
                            <InputText id="descriptionCreate" type="text" v-model="region.description"
                                class="p-inputtext-sm input-with-line" placeholder="Enter description" required />
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

        <!-- Diálogo de edición de región -->
        <Dialog v-model:visible="isEditDialogVisible" modal header="Edit region">
            <form @submit.prevent="updateRegion">
                <div class="flex gap-4">
                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="nameEdit">Name</label>
                            <InputText id="nameEdit" type="text" v-model="editRegionData.nameRegion"
                                class="p-inputtext-sm input-with-line" placeholder="Enter name" required />
                        </div>
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="descriptionEdit">Description</label>
                            <InputText id="descriptionEdit" type="text" v-model="editRegionData.description"
                                class="p-inputtext-sm input-with-line" placeholder="Enter description" required />
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
        <!-- Diálogo de confirmación eliminar -->
        <Dialog v-model:visible="displayDeleteConfirmation" header="Delete confirmation" modal class="max-w-sm">
            <p>Are you sure you want to delete this region?</p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="No" icon="pi pi-times" @click="closeDeleteConfirmation"
                        class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="deleteRegion"
                        class="p-button-text p-button-danger" />
                </div>
            </template>
        </Dialog>

        <!-- Diálogo de confirmación inactivar -->
        <Dialog v-model:visible="displayConfirmation" header="Confirmation" modal class="max-w-sm">
            <p>Are you sure you want to proceed with this action?</p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="No" icon="pi pi-times" @click="closeConfirmation"
                        class="p-button-text p-button-secondary" />
                    <Button label="Yes" icon="pi pi-check" @click="changeRegionStatus"
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
