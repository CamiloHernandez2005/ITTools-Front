<script>
import axios from 'axios';
import Breadcrumb from 'primevue/breadcrumb';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import ProgressSpinner from 'primevue/progressspinner';
import RadioButton from 'primevue/radiobutton';
import { onMounted, ref, watch, computed, reactive } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import dayjs from 'dayjs';
import InputText from 'primevue/inputtext';
import { resolveFieldData } from '@primevue/core';

export default {
    components: {
        Dropdown,
        RadioButton,
        Button,
        Dialog,
        DataTable,
        Column,
        Breadcrumb,
        ProgressSpinner,
        InputText
    },
    setup() {
        const regions = ref([]);
        const ServersDB = ref([]);
        const selectedRegion = ref(null);
        const filteredDB = ref([]);
        const selectedServerDB = ref(null);
        const runningJobs = ref([]); // Para almacenar los trabajos en ejecución
        const scheduledJobs = ref([]); // Para almacenar los trabajos programados
        const modalVisible = ref(false); // Controlar la visibilidad del modal
        const selectedJob = ref({}); // Para almacenar el trabajo seleccionado

        // Dentro del setup() de tu componente

        // Computed property para filtrar trabajos programados
        const filtersScheduledJobs = ref({
            jobName: { value: null, matchMode: FilterMatchMode.CONTAINS },
            scheduledDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
            startDate: { value: null, matchMode: FilterMatchMode.BETWEEN },
            stopDate: { value: null, matchMode: FilterMatchMode.BETWEEN },
            executionTime: { value: null, matchMode: FilterMatchMode.CONTAINS },
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },


        }); 

        const filtersRunningJobs = ref({
            jobName: { value: null, matchMode: FilterMatchMode.CONTAINS },
            startDate: { value: null, matchMode: FilterMatchMode.BETWEEN },
            stepName: { value: null, matchMode: FilterMatchMode.CONTAINS }
        });

        const breadcrumbItems = ref([
            { label: 'Home', icon: 'pi pi-home', url: '/homeusers' },
            { label: 'Database', icon: 'pi pi-database' },
            { label: 'Jobs', icon: 'pi pi-briefcase', route: { name: 'Jobs' } }
        ]);

        const clearFilter = () => {
            Object.keys(filtersScheduledJobs.value).forEach((key) => {
                filtersScheduledJobs.value[key].value = null;
            });
        };



        // Loading state for the spinner dialog
        const isLoading = ref(false);



        // Función para mostrar el modal de carga
        const showLoading = () => {
            isLoading.value = true;
        };

        // Función para ocultar el modal de carga
        const hideLoading = () => {
            isLoading.value = false;
        };


        async function loadRegions() {
            try {
                const response = await axios.get('/api/regions'); // Ajusta la URL según tu backend
                regions.value = response.data.map((region) => ({ name: region.nameRegion, id: region.idRegion }));
            } catch (error) {
                console.error('Error fetching regions:', error.message);
            }
        }

        async function loadServersDB() {
            try {
                const response = await axios.get('/api/serversdb'); // Ajusta la URL según tu backend
                ServersDB.value = response.data.filter((server) => server.status === 1);
            } catch (error) {
                console.error('Error fetching servers:', error.message);
            }
        }

        async function loadJobs() {
            if (selectedServerDB.value) {
                try {

                    showLoading();
                    // Obtener trabajos en ejecución
                    const runningResponse = await axios.get(`/api/jobs/runningJobs/${selectedServerDB.value}`);
                    runningJobs.value = runningResponse.data;

                    // Obtener trabajos programados
                    const scheduledResponse = await axios.get(`/api/jobs/scheduled/${selectedServerDB.value}`);
                    scheduledJobs.value = scheduledResponse.data;
                } catch (error) {
                    console.error('Error fetching jobs:', error.message);
                }
                finally {
                    hideLoading();
                }
            }
        }



        function filterServersByRegion() {
            if (selectedRegion.value) {
                filteredDB.value = ServersDB.value.filter((server) => server.regionId == selectedRegion.value);
            } else {
                filteredDB.value = [];
            }
        }

        function openModal(job) {
            selectedJob.value = job; // Asigna el trabajo seleccionado al estado
            modalVisible.value = true; // Abre el modal
        }

        onMounted(async () => {
            await loadRegions();
            await loadServersDB();
        });

        function formatDateTime(value) {
            return value ? dayjs(value).format('DD/MMM/YYYY HH:mm:ss') : '';
        }

        watch(selectedRegion, filterServersByRegion);
        watch(selectedServerDB, loadJobs); // Cargar trabajos cuando se seleccione un servidor

        return {
            regions,
            ServersDB,
            selectedRegion,
            filteredDB,
            selectedServerDB,
            runningJobs,
            scheduledJobs,
            modalVisible,
            selectedJob,
            openModal,
            breadcrumbItems,
            showLoading,
            hideLoading,
            isLoading,
            loadJobs,
            formatDateTime,
            filtersScheduledJobs,
            filtersRunningJobs,
            clearFilter

        };
    }
};
</script>

<template>
    <div class="flex flex-col  grid p-4">

        <div class="w-full card p-1 mb-4 shadow-custom border">
            <div class="header-container">
                <div class="title font-semibold text-xl ml-4">Jobs </div>
                <div class="breadcrumb-section mr-2">
                    <Breadcrumb :model="breadcrumbItems" class="breadcrumb-item" />
                </div>
            </div>

            <div class="mb-6 ml-6 flex items-start gap-4">
                <!-- Sección de Región -->
                <div class="w-1/6">
                    <label for="region" class="block text-sm font-medium mb-2">Region</label>
                    <Dropdown id="region" v-model="selectedRegion" :options="regions" option-label="name"
                        option-value="id" placeholder="Select region" class="w-full mb-4" filter
                        filterPlaceholder="Search region" />
                </div>

                <!-- Sección de ServersDB (alineada a la derecha de Region) -->
                <div class="flex-grow">
                    <label class="block text-sm font-medium mb-2">ServersDB</label>
                    <div class="flex flex-col gap-2">
                        <div v-for="server in filteredDB" :key="server.idServer" class="flex items-center">
                            <div class="flex items-center gap-2 radio-margin">
                                <RadioButton v-model="selectedServerDB" :value="server.idServer" name="server" />
                                <span class="text-sm">{{ server.serverName }}</span>
                                <span class="text-sm">||</span>
                                <span class="text-sm">{{ server.ipServer }}</span>
                                <span class="text-sm">||</span>
                                <span class="text-sm">{{ server.description }}</span>
                            </div>
                        </div>
                        <div v-if="filteredDB.length === 0" class="text-sm text-gray-500 ml-2">No servers found for the
                            selected region</div>
                    </div>
                </div>
            </div>

        </div>



        <div class="flex gap-6 mb-2">

            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-2 h-full shadow-custom border">
                <h2 class="font-semibold text-lg ">Scheduled jobs</h2>
                <DataTable :value="scheduledJobs" :filters="filtersScheduledJobs" filterDisplay="menu"
                    class="p-datatable-sm" :paginator="true" :rows="5" :rowsPerPageOptions="[5, 10, 20]"
                    :totalRecords="scheduledJobs.length" :rowHover="true" v-model:filters="filtersScheduledJobs"
                    :global-filter-fields="['jobName', ' scheduledDate', ' startDate', 'stopDate', 'executioTime']">

                    <template #header>
                        <div class="flex justify-end">

                            <div class="flex gap-2">
                                <InputText v-model="filtersScheduledJobs.global.value" placeholder="Global search" />
                                <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined
                                    @click="clearFilter()" />
                            </div>
                        </div>
                    </template>

                    <template #empty> No scheduled jobs found. </template>
                    <template #loading> Loading scheduled jobs data. Please wait. </template>

                    <Column field="jobName" header="Job name" sortable :showFilterMatchModes="false">
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by job name" />
                        </template>
                    </Column>
                    <Column field="scheduledDate" header="Scheduled date" sortable :showFilterMatchModes="false">
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.scheduledDate) }}
                        </template>
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by scheduled date " />
                        </template>
                    </Column>
                    <Column field="startDate" header="Start date" :showFilterMatchModes="false" sortable>
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.startDate) }}
                        </template>
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by start date" />
                        </template>

                    </Column>
                    <Column field="stopDate" header="Stop date" :showFilterMatchModes="false" sortable>
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.stopDate) }}
                        </template>
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by stop date" />
                        </template>
                    </Column>
                    <Column field="executionTime" header="Execution time" sortable :showFilterMatchModes="false">

                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by execution time" />
                        </template>
                    </Column>
                </DataTable>





            </div>
            <!-- Div para mostrar trabajos en ejecución -->
            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-2 h-full shadow-custom border">

                <h2 class="font-semibold text-lg ">Running jobs</h2>
                <DataTable :value="runningJobs" :filters="filtersRunningJobs" filterDisplay="menu"
                    class="p-datatable-sm" :paginator="true" :rows="5" :rowsPerPageOptions="[5, 10, 20]"
                    :totalRecords="runningJobs.length" :rowHover="true"
                    :globalFilterFields="['jobName', 'startDate', 'stepName']">
                    <template #header>
                        <div class="flex justify-end">

                            <div class="flex gap-2">
                                <InputText v-model="filtersScheduledJobs.global.value" placeholder="Global search" />
                                <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined
                                    @click="clearFilter()" />
                            </div>
                        </div>
                    </template>

                    <template #empty> No running jobs found. </template>
                    <template #loading> Loading running jobs data. Please wait. </template>

                    <Column field="jobName" header="Job name" sortable :showFilterMatchModes="false">
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.scheduledDate) }}
                        </template>
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by job name " />
                        </template>
                    </Column>
                    <Column field="startDate" header="Start date" sortable :showFilterMatchModes="false">
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.scheduledDate) }}
                        </template>
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by start date " />
                        </template>
                    </Column>
                    <Column field="stepName" header="Step name" :showFilterMatchModes="false" sortable>
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.scheduledDate) }}
                        </template>
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by step name " />
                        </template>
                    </Column>
                </DataTable>


            </div>

            <!-- Div para mostrar trabajos programados -->

        </div>


        <Button label="Refresh" id="Boton1" icon="pi pi-sync" @click="loadJobs" />
        <!-- Modal para mostrar detalles adicionales -->
        <Dialog v-model:visible.sync="modalVisible">
            <template #footer>
                <Button label="Close" @click.prevent="modalVisible = false" />
            </template>
        </Dialog>

        <Dialog v-model:visible="isLoading" modal :dismissableMask="false" :showHeader="false" :closable="false"
            style="width: 20%; height: 30%; display: flex; align-items: center; justify-content: center">
            <div class="flex flex-col items-center justify-center">
                <ProgressSpinner />
                <p class="mt-4">Searching for data...</p>
            </div>
        </Dialog>

    </div>
</template>



<style scoped>
.radio-margin {
    margin-left: 1rem;
    /* Ajusta el margen según sea necesario */
}

.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

#Boton1 {
    width: 15em;
    background: #64c4ac;
    color: white;
    border-color: #64c4ac;
    margin-right: 1em;
}

#Boton1:hover {
    background: white;
    color: #64c4ac;
    border-color: #64c4ac;
}

.shadow-custom {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
}
</style>