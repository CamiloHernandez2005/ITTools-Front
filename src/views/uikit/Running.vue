
<script>
import axios from 'axios';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import { onMounted, ref, watch } from 'vue';

export default {
    components: {
        Dropdown,
        Button,
        Dialog,
        DataTable,
        Column,
    },
    setup() {
        const regions = ref([]);
        const ServersDB = ref([]);
        const selectedRegion = ref(null);
        const filteredDB = ref([]);
        const selectedServerDB = ref(null);
        const runningProcesses = ref([]); // Para almacenar los procesos en ejecución
        const modalVisible = ref(false); // Controlar la visibilidad del modal
        const selectedProcessSPID = ref(null); // Almacena el SPID del proceso seleccionado
        const rowsPerPage = ref(10); // Cantidad de filas por página

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

        function filterServersByRegion() {
            if (selectedRegion.value) {
                filteredDB.value = ServersDB.value.filter((server) => server.regionId == selectedRegion.value);
            } else {
                filteredDB.value = [];
            }
        }

        async function loadProcesses() {
            if (selectedServerDB.value) {
                try {
                    const response = await axios.get(`/api/jobs/runningProcess/${selectedServerDB}`);
                    runningProcesses.value = response.data;
                } catch (error) {
                    console.error('Error fetching processes:', error.message);
                }
            }
        }

        async function killProcess(spid) {
            if (!spid) return; // No hacer nada si no hay SPID seleccionado
            
            const confirmation = confirm(`Are you sure you want to kill the process with SPID ${spid}?`);
    
            if (confirmation) {
                try {
                    const response = await axios.post(`/api/killProcess/${selectedServerDB}/${spid}`);
                    alert(response.data); // Muestra un mensaje de éxito o error
                    loadProcesses(); // Recargar procesos después de matar uno
                } catch (error) {
                    console.error('Error killing process:', error.message);
                    alert('Error al intentar matar el proceso.');
                }
            }
        }

        watch(selectedRegion, filterServersByRegion); // Filtrar servidores cuando se seleccione una región
        watch(selectedServerDB, loadProcesses); // Cargar procesos cuando se seleccione un servidor

        onMounted(async () => {
            await loadRegions();
            await loadServersDB();
        });

        return {
            regions,
            ServersDB,
            selectedRegion,
            filteredDB,
            selectedServerDB,
            runningProcesses,
            modalVisible,
            selectedProcessSPID,
            rowsPerPage,
            loadProcesses,
            killProcess
        };
    }
};
</script>
<template>
    <div class="flex flex-col h-screen p-4">
        <!-- Div para seleccionar la región -->
        <div class="w-full card p-4 flex flex-col gap-4 mb-6">
            <div class="font-semibold text-xl mb-4">Select Region</div>
            <label for="region" class="block text-sm font-medium mb-2">Region</label>
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
            <h2 class="font-semibold text-lg mb-2">Available Servers</h2>
            <div class="flex flex-col gap-2">
                <div v-for="server in filteredDB" :key="server.idServer" class="flex items-center">
                    <RadioButton v-model="selectedServerDB" :value="server.idServer" name="server" />
                    <span class="text-sm">{{ server.serverName }}</span>
                    <span class="text-sm">||</span>
                    <span class="text-sm">{{ server.ipServer }}</span>
                    <span class="text-sm">||</span>
                    <span class="text-sm">{{ server.description }}</span>
                </div>
                <div v-if="filteredDB.length === 0" class="text-sm text-gray-500 mt-2">No servers found for the selected region</div>
            </div>
        </div>

        <!-- Botón para cargar procesos -->
        <Button label="Load Processes" icon="pi pi-refresh" @click="loadProcesses" :disabled="!selectedServerDB"  style="width: 20%; margin-bottom: 1%;" mb-4/>

        <!-- Div para mostrar procesos en ejecución -->
        <div class="w-full card p-4 flex flex-col gap-4">
            <h2 class="font-semibold text-lg mb-2">Running Processes</h2>
            <DataTable :value="runningProcesses" class="p-datatable-sm" :paginator="true" :rows="rowsPerPage" :rowsPerPageOptions="[5, 10, 20]" :totalRecords="runningProcesses.length">
                <Column header="#" body="{ data }">
                    <template #default="{ data }">
                        <RadioButton v-model="selectedProcessSPID" :value="data.spid" name="process"/>
                    </template>
                </Column>
                <Column field="databaseName" header="Database Name" sortable />
                <Column field="timeSec" header="Time (Sec)" sortable />
                <Column field="username" header="Username" sortable />
                <Column field="hostname" header="Hostname" sortable />
                <Column field="sqlBatchText" header="SQL Batch Text" sortable />
                <Column field="spid" header="SPID" sortable />
                <Column field="status" header="Status" sortable />
                <Column field="command" header="Command" sortable />
                <Column field="proceso" header="Process" sortable />
            </DataTable>
            <div v-if="runningProcesses.length === 0 && selectedServerDB !== null" class="text-center mt-4 text-gray-500">No running processes available.</div>

            <!-- Botón para matar el proceso seleccionado -->
            <Button label="Kill Process" icon="pi pi-times" @click.prevent="killProcess(selectedProcessSPID)" :disabled="!selectedProcessSPID" style="width: 20%;"/>
        </div>

        <!-- Modal para mostrar detalles adicionales -->
        <Dialog v-model:visible.sync="modalVisible">
            <template #header>{{ selectedProcess.spid }}</template>

            <!-- Contenido del modal -->
            <!-- Aquí puedes agregar más detalles según sea necesario -->

            <!-- Botón para cerrar el modal -->
            <template #footer>
                <Button label="Close" @click.prevent="modalVisible = false"/>
            </template>
        </Dialog>

    </div>
</template>



<style scoped>
.radio-margin {
    margin-left: 1rem; /* Ajusta el margen según sea necesario */
}
</style>