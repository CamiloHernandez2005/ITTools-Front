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
                url: '/'
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
    <div class="flex flex-col h-screen p-4">
        <!-- Selección de la región -->
        <div class="w-full card p-1 mb-4 shadow-custom border">
            <div class="header-container">
                <div class="title font-semibold text-xl ml-4">Running </div>
                <div class="breadcrumb-section mr-2">
                    <Breadcrumb :home="home" :model="items" class="breadcrumb-item" />
                </div>
            </div>

         
            <div class="mb-6 ml-6 flex items-start gap-4">
                <!-- Sección de Región -->
                <div class="w-1/6">
                    <label for="region" class="block text-sm font-medium mb-2">Region</label>
                    <Dropdown id="region" v-model="selectedRegion" :options="regions" option-label="name"
                        option-value="id" placeholder="Select Region" class="w-full mb-4" filter
                        filterPlaceholder="Search Region"  />
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



        <!-- Lista de procesos en ejecución -->
        <div class="w-full card p-4 flex flex-col gap-4 shadow-custom border">
            <h2 class="font-semibold text-xl mb-2">Running Processes</h2>
            <DataTable :value="runningProcesses" class="p-datatable-sm" :paginator="true" :rows="5"
                :rowsPerPageOptions="[5, 10, 20]" :rowHover="true">
                <template #empty> No running process found. </template>
                <template #loading> Loading running process data. Please wait. </template>
                <Column header="Select">
                    <template #body="{ data }">
                        <RadioButton v-model="selectedProcessSPID" :value="data.spid" name="process" />
                    </template>
                </Column>
                <Column field="databaseName" header="Database name" />
                <Column field="timeSec" header="Time (Sec)" />
                <Column field="username" header="Username" />
                <Column field="hostname" header="Hostname" />
                <Column field="sqlBatchText" header="SQL batch text" />
                <Column field="spid" header="SPID" />
                <Column field="status" header="Status" />
                <Column field="command" header="Command" />
                <Column field="proceso" header="Process" />
            </DataTable>
            

            <div class="flex justify-end gap-2">
                <!-- Botón para cargar procesos -->
                <Button label="Load Processes" icon="pi pi-refresh" @click="loadProcesses" id="boton1"/>
                <Button label="Kill Process" icon="pi pi-times" @click.prevent="killProcess(selectedProcessSPID)"  id="boton2" />
            </div>
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
}

#boton2 {
    background: #614d56;
    color: white;
    border-color: #614d56;
}

#boton2:hover {
  background: white;
    color: #614d56;
    border-color: #614d56;
}

#boton1 {
    background: #64c4ac;
    color: white;
    border-color: #64c4ac;
}

#boton1:hover {
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
