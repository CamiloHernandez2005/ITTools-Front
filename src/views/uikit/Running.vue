<script>
import axios from 'axios';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref, watch } from 'vue';



export default {
    components: {
        Dropdown,
        Button,
        Dialog,
        DataTable,
        Column,
        ProgressSpinner
    },
    data() {
        return {
            selectedProcessSPID: null,
            home: {
                icon: 'pi pi-home',
                label: 'Home',
                route: { name: 'dashboard' }
            },
            items: [
                {
                    label: 'Database',
                    icon: 'pi pi pi-database',
                    route: { name: 'Database' }
                },
                {
                    icon: 'pi pi-fw pi-spinner',
                    label: 'Running ',
                    route: { name: 'Running' }
                }
            ]

        };
    },
    setup() {
        const regions = ref([]);
        const ServersDB = ref([]);
        const selectedRegion = ref(null);
        const filteredDB = ref([]);
        const selectedServerDB = ref(null);
        const runningProcesses = ref([]);
        const modalVisible = ref(false);
        const selectedProcessSPID = ref(null);
        const isLoading = ref(false); // Nueva propiedad para controlar el diálogo de carga
        const rowsPerPage = ref(10);

        // Cargar regiones
        async function loadRegions() {
            try {
                const response = await axios.get('/api/regions');
                regions.value = response.data.map((region) => ({ name: region.nameRegion, id: region.idRegion }));
            } catch (error) {
                console.error('Error fetching regions:', error.message);
            }
        }

        // Cargar servidores
        async function loadServersDB() {
            try {
                const response = await axios.get('/api/serversdb');
                ServersDB.value = response.data.filter((server) => server.status === 1);
            } catch (error) {
                console.error('Error fetching servers:', error.message);
            }
        }

        // Filtrar servidores por región
        function filterServersByRegion() {
            if (selectedRegion.value) {
                filteredDB.value = ServersDB.value.filter((server) => server.regionId == selectedRegion.value);
            } else {
                filteredDB.value = [];
            }
        }

        // Cargar procesos en ejecución del servidor seleccionado
        async function loadProcesses() {
            if (selectedServerDB.value) {
                isLoading.value = true; // Mostrar el diálogo de carga
                try {
                    const response = await axios.get(`/api/jobs/runningProcess/${selectedServerDB.value}`);
                    runningProcesses.value = response.data;
                } catch (error) {
                    console.error('Error fetching processes:', error.message);
                } finally {
                    isLoading.value = false; // Ocultar el diálogo de carga
                }
            }
        }

        // Matar un proceso específico
        async function killProcess(spid) {
            if (!spid) return;

            const confirmation = confirm(`Are you sure you want to kill the process with SPID ${spid}?`);

            if (confirmation) {
                try {
                    const response = await axios.post(`/api/jobs/killProcess/${selectedServerDB.value}/${spid}`);
                    alert(response.data); // Muestra el mensaje de éxito o error
                    loadProcesses(); // Recargar procesos después de matar uno
                } catch (error) {
                    console.error('Error killing process:', error.message);
                    alert('Error al intentar matar el proceso.');
                }
            }
        }
        function radioButtonTemplate(data) {
            return h(RadioButton, {
                modelValue: selectedProcessSPID.value,
                'onUpdate:modelValue': (value) => { selectedProcessSPID.value = value; },
                value: data.spid,
                name: "process"
            });
        }

        // Escuchar cambios en la selección de región y servidor
        watch(selectedRegion, filterServersByRegion);
        watch(selectedServerDB, loadProcesses);

        // Cargar regiones y servidores al montar el componente
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
            isLoading,
            rowsPerPage,
            loadProcesses,
            killProcess,
            radioButtonTemplate,
        };
    }
};
</script>

<template>
    <div class="flex flex-col min-h-screen">
        <!-- Selección de la región -->
        <div class="card p-6 flex flex-col gap-2  shadow-custom border">
            <!-- Agrupar los dos elementos: titulo y breadcrumb -->
            <div class="header-container">
                <div class="title font-semibold text-xl">Running Queries</div>
                <Breadcrumb :home="home" :model="items" />
            </div>
            <div class="font-semibold text-xl mb-4">Select Region</div>
            <label for="region" class="block text-sm font-medium mb-2">Region</label>
            <Dropdown id="region" v-model="selectedRegion" :options="regions" option-label="name" option-value="id"
                placeholder="Select Region" class="w-full" filter filterPlaceholder="Search Region"
                style="width: 30%;" />
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
                <div v-if="filteredDB.length === 0" class="text-sm text-gray-500 mt-2">No servers found for the selected
                    region</div>
            </div>
        </div>

        <!-- Botón para cargar procesos -->
        <Button label="Load Processes" icon="pi pi-refresh" @click="loadProcesses" :disabled="!selectedServerDB"
            style="width: 20%; margin-bottom: 1%; " class="boton1" />

        <!-- Lista de procesos en ejecución -->
        <div class="w-full card p-4 flex flex-col gap-4 shadow-custom border">
            <h2 class="font-semibold text-lg mb-2">Running Processes</h2>
            <DataTable :value="runningProcesses" class="p-datatable-sm" :paginator="true" :rows="rowsPerPage"
                :rowsPerPageOptions="[5, 10, 20]">
                <Column header="Select">
                    <template #body="{ data }">
                        <RadioButton v-model="selectedProcessSPID" :value="data.spid" name="process" />
                    </template>
                </Column>
                <Column field="databaseName" header="Database Name" />
                <Column field="timeSec" header="Time (Sec)" />
                <Column field="username" header="Username" />
                <Column field="hostname" header="Hostname" />
                <Column field="sqlBatchText" header="SQL Batch Text" />
                <Column field="spid" header="SPID" />
                <Column field="status" header="Status" />
                <Column field="command" header="Command" />
                <Column field="proceso" header="Process" />
            </DataTable>
            <div v-if="runningProcesses.length === 0 && selectedServerDB !== null"
                class="text-center mt-4 text-gray-500">No running
                processes available.</div>

            <!-- Botón para matar proceso -->
            <Button label="Kill Process" icon="pi pi-times" @click.prevent="killProcess(selectedProcessSPID)"
                :disabled="!selectedProcessSPID" style="width: 20%;"  class="boton2"/>
        </div>

        <!-- Loading Modal -->
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
    margin-top: -1rem;
}
.boton2 {
    background: #614d56;
    color: white;
    border-color: #614d56;
}

.boton2:hover {
    background: white;
    color: #614d56;
    border-color: #614d56;
}

.boton1 {
    background: #64c4ac;
    color: white;
    border-color: #64c4ac;
    margin-right: 1em;
}

.boton1:hover {
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
