<script>
import axios from 'axios';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import RadioButton from 'primevue/radiobutton';
import Breadcrumb from 'primevue/breadcrumb';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref, watch } from 'vue';

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


        const breadcrumbItems = ref([
            { label: 'Home', icon: 'pi pi-home', url: '/' },
            { label: 'Database', icon: 'pi pi-database' },
            { label: 'Jobs', icon: 'pi pi-briefcase', route: { name: 'Jobs' } }
        ]);

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
            isLoading
        };
    }
};
</script>

<template>
    <div class="flex flex-col min-h-screen">
        <!-- Div para seleccionar la región -->
        <div class="w-full card p-4 flex flex-col gap-4 mb-6 shadow-custom border">
            <div class="w-full card p-1 mb-4">
            <div class="header-container">
                <div class="title font-semibold text-xl ml-4">Jobs </div>
                <div class="breadcrumb-section mr-2">
                    <Breadcrumb :model="breadcrumbItems" class="breadcrumb-item" />
                </div>
            </div>
        </div>
           
                <label for="region" class="block text-sm font-medium mb-2">  Region</label>
                <Dropdown 
                    id="region" 
                    v-model="selectedRegion" 
                    :options="regions" 
                    option-label="name" 
                    option-value="id" 
                    placeholder="Select Region" 
                    class="w-full" 
                    filter 
                    filterPlaceholder="Search Region" 
                    style="width: 30%;"
                />
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-3">ServersDB</label>
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
                        <div v-if="filteredDB.length === 0" class="text-sm text-gray-500 mt-2">No servers found for the selected region</div>
                    </div>
                </div>
            </div>



        <!-- Div para mostrar trabajos en ejecución -->
        <div class="w-full card p-4 flex flex-col gap-4 mb-6 shadow-custom border">
            <h2 class="font-semibold text-lg mb-2">Running Jobs</h2>
            <DataTable :value="runningJobs" class="p-datatable-sm" :paginator="true" :rows="rowsPerPage" :rowsPerPageOptions="[5, 10, 20]" :totalRecords="runningJobs.length">
                <Column field="jobName" header="Job Name" sortable />
                <Column field="startDate" header="Start Date" sortable />
                <Column field="stopDate" header="Stop Date" sortable />
                <Column field="executionTime" header="Execution Time (min)" sortable />
            </DataTable>
            <div v-if="runningJobs.length === 0" class="text-center mt-4 text-gray-500">No running jobs available.</div>
        </div>

        <!-- Div para mostrar trabajos programados -->
        <div class="w-full card p-4 flex flex-col gap-4 shadow-custom border">
            <h2 class="font-semibold text-lg mb-2">Scheduled Jobs</h2>
            <DataTable :value="scheduledJobs" class="p-datatable-sm" :paginator="true" :rows="rowsPerPage" :rowsPerPageOptions="[5, 10, 20]" :totalRecords="scheduledJobs.length">
                <Column field="jobName" header="Job Name" sortable />
                <Column field="scheduledDate" header="Scheduled Date" sortable />
                <Column field="startDate" header="Start Date" sortable />
                <Column field="stopDate" header="Stop Date" sortable />
                <Column field="executionTime" header="Execution Time (min)" sortable />
            </DataTable>
            <div v-if="scheduledJobs.length === 0" class="text-center mt-4 text-gray-500">No scheduled jobs available.</div>
        </div>

   <Button label="Refresh" id="Boton1" icon="pi pi-sync" 
   @click="loadJobs"  :disabled="!selectedServerDB" />
        <!-- Modal para mostrar detalles adicionales -->
        <Dialog v-model:visible.sync="modalVisible">
            <template #header>{{ selectedJob.jobName }}</template>

            <!-- Contenido del modal -->
            <!-- Aquí puedes agregar más detalles según sea necesario -->

            <!-- Botón para cerrar el modal -->
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
    margin-left: 1rem; /* Ajusta el margen según sea necesario */
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
    /* Opcional: redondear bordes */
}


</style>