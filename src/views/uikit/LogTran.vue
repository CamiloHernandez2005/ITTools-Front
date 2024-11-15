<script>
import { ref, onMounted, watch } from 'vue';
import Dropdown from 'primevue/dropdown';
import RadioButton from 'primevue/radiobutton';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import ProgressSpinner from 'primevue/progressspinner';
import LogService from '@/services/LogService';
import Dialog from 'primevue/dialog';
import { regionService } from '@/services/RegionService';
import { serverService } from '@/services/AgentService';
import Checkbox from 'primevue/checkbox'; // Asegúrate de importar Checkbox
import { useToast } from 'primevue/usetoast'; // Importar useToast para las notificaciones
import SnakeGame from '@/views/uikit/snakeGame.vue';

export default {
    components: {
        Dropdown,
        RadioButton,
        Button,
        Calendar,
        ProgressSpinner,
        Dialog,
        Checkbox,// Registra el componente Checkbox
        SnakeGame
    },
    setup() {
        const toast = useToast(); // Inicializar el sistema de toast
        const breadcrumbItems = ref([
            { label: 'Home', icon: 'pi pi-home', url: '/' },
            { label: 'Logs', icon: 'pi pi-folder' },
            { label: 'Logs', icon: 'pi pi-share-alt', route: { name: 'LogTran' } }
        ]);
        const regions = ref([]);
        const agents = ref([]);
        const selectedRegion = ref(null);
        const filteredAgents = ref([]);
        const selectedAgent = ref(null);
        const date = ref(null); // Esta es la fecha seleccionada
        const logs = ref([]);
        const selectedLogs = ref([]); // Cambia a un array para seleccionar múltiples logs
        const errorMessage = ref('');
        const isLoading = ref(false); // Variable para el estado de carga
        const showAdditionalMessage = ref(false);
        const showAdditionalMessage2 = ref(false);
        const showAdditionalMessage3 = ref(false);
        const showAdditionalMessage4 = ref(false);
        const showAdditionalMessage5 = ref(false);

        const showSuccess = (message) => {
            toast.add({ severity: 'success', summary: 'Success', detail: message, life: 3000 });
        };

        const showError = (message) => {
            toast.add({ severity: 'error', summary: 'Error', detail: message, life: 3000 });
        };

        async function loadLogs() {
            if (selectedAgent.value && date.value && selectedRegion.value) {
                // Verificar que los tres campos estén seleccionados
                try {
                    const formattedDate = date.value.toISOString().split('T')[0].split('-').reverse().join('-');
                    const data = await LogService.filterLogsByDate(
                        selectedAgent.value,
                        formattedDate,
                        selectedRegion.value // Asegúrate de enviar el ID de la región
                    );
                    if (Array.isArray(data) && data.length > 0) {
                        logs.value = data;
                        showSuccess('Logs loaded successfully');
                    } else {
                        logs.value = [];
                        showError('No logs found for the selected date and region.');
                    }
                } catch (error) {
                    handleError(error);
                }
            }
        }

        async function loadRegions() {
            try {
                const data = await regionService.getAllRegions();
                regions.value = data.map((region) => ({ name: region.nameRegion, id: region.idRegion }));
            } catch (error) {
                showError('Error fetching regions: ' + error.message);
            }
        }

        async function loadAgents() {
            try {
                const data = await serverService.getAllServers();
                agents.value = data.filter((agent) => agent.status === 1);
            } catch (error) {
                showError('Error fetching agents: ' + error.message);
            }
        }

        function filterAgentsByRegion() {
            filteredAgents.value = selectedRegion.value ? agents.value.filter((agent) => agent.regionId === selectedRegion.value) : [];
        }

        async function downloadSelectedLogs() {
    if (selectedLogs.value.length > 0) {
        // Verificar si hay logs seleccionados
        isLoading.value = true; // Abrir el modal de carga
        showAdditionalMessage.value = false;
                showAdditionalMessage2.value = false;
                showAdditionalMessage3.value = false;
                showAdditionalMessage4.value = false;
                showAdditionalMessage5.value = false;

                const additionalMessageTimeout = setTimeout(() => {
                    showAdditionalMessage.value = true;
                }, 10000);

                const additionalMessageTimeout2 = setTimeout(() => {
                    showAdditionalMessage.value = false;
                    showAdditionalMessage2.value = true;
                }, 20000);

                const additionalMessageTimeout3 = setTimeout(() => {
                    showAdditionalMessage2.value = false;
                    showAdditionalMessage3.value = true;
                }, 30000);

                const additionalMessageTimeout4 = setTimeout(() => {
                    showAdditionalMessage3.value = false;
                    showAdditionalMessage4.value = true;
                }, 40000);

                const additionalMessageTimeout5 = setTimeout(() => {
                    showAdditionalMessage4.value = false;
                    showAdditionalMessage5.value = true;
                }, 50000);
        try {
            // Encontrar la IP del agente seleccionado
            const agent = agents.value.find(a => a.idAgent === selectedAgent.value);
            const agentIp = agent?.ipagent || 'UnknownIP'; // Usar un valor por defecto si la IP no existe
            
            // Obtener el nombre de la región
            const regionName = regions.value.find(region => region.id === selectedRegion.value)?.name || 'UnknownRegion'; // Obtener el nombre de la región

            // Llamar al servicio pasándole la región y la IP como parámetros
            await LogService.zipLogFile(selectedAgent.value, selectedLogs.value, regionName, agentIp);
            
            showSuccess('Logs downloaded successfully');
        } catch (error) {
            showError('Error downloading log file: ' + error.message);
        } finally {
            isLoading.value = false; // Cerrar el modal de carga
            clearTimeout(additionalMessageTimeout);
                    showAdditionalMessage.value = false;
                    clearTimeout(additionalMessageTimeout2);
                    showAdditionalMessage2.value = false;
                    clearTimeout(additionalMessageTimeout3);
                    showAdditionalMessage3.value = false;
                    clearTimeout(additionalMessageTimeout4);
                    showAdditionalMessage4.value = false;
                    clearTimeout(additionalMessageTimeout5);
                    showAdditionalMessage5.value = false;
        }
    } else {
        showError('Please select at least one log to download.');
    }
}


        onMounted(() => {
            loadRegions();
            loadAgents();
        });

        watch(selectedAgent, () => {
            logs.value = []; // Limpiar los logs al cambiar el agente
            loadLogs(); // Cargar logs al seleccionar una fecha
            selectedLogs.value =[]; // Limpiar la selección de logs
        });
        watch(date, () => {
            loadLogs(); // Cargar logs al seleccionar una fecha
            selectedLogs.value = []; // Limpiar la selección de logs
        });
        watch(selectedRegion, filterAgentsByRegion);

        return {
            regions,
            agents,
            selectedRegion,
            filteredAgents,
            selectedAgent,
            date,
            logs,
            selectedLogs,
            downloadSelectedLogs,
            errorMessage,
            isLoading,
            breadcrumbItems,
            showAdditionalMessage,
            showAdditionalMessage2,
            showAdditionalMessage3,
            showAdditionalMessage4,
            showAdditionalMessage5,
        };
    }
};
</script>

<template>
    <div class="flex flex-col h-screen p-4">
        <div class="w-full card p-1 mb-4 shadow-custom border">
            <div class="header-container">
                <div class="title font-semibold text-xl ml-4 ">Logs</div>
                <div class="breadcrumb-section mr-2">
                    <Breadcrumb :model="breadcrumbItems" class="breadcrumb-item" />
                </div>
            </div>
        </div>
        <div class="flex gap-6">
            <!-- Div for the first half -->
            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full shadow-custom border">
    <div class="mb-2">
        <div class="font-semibold text-xl mb-4">Region details</div>
        
        <!-- Agrupamos el Dropdown y el Calendar en un div flex -->
        <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
                <label for="region" class="block text-sm font-medium mb-2">Region</label>
                <Dropdown 
                    id="region" 
                    v-model="selectedRegion" 
                    :options="regions" 
                    option-label="name" 
                    option-value="id" 
                    placeholder="Select region" 
                    class="w-full" 
                    filter 
                    filterPlaceholder="Search region" 
                />
                
                <label for="last-modified" class="block text-sm font-medium mb-2 mt-4">Transaction date</label>
                <Calendar 
                    id="last-modified" 
                    v-model="date" 
                    class="w-full" 
                    placeholder="Select date" 
                />
            </div>

            <div class="flex-1">
                <label class="block text-sm font-medium mb-3">Agents</label>
                <div class="flex flex-col gap-2 ml-4">
                    <div v-for="agent in filteredAgents" :key="agent.idAgent" class="flex items-center">
                        <div class="flex items-center gap-2 radio-margin">
                            <RadioButton 
                                v-model="selectedAgent" 
                                :value="agent.idAgent" 
                                name="agent" 
                            />
                            <span class="text-sm">{{ agent.agentName }}</span>
                            <span class="text-sm">||</span>
                            <span class="text-sm">{{ agent.ipagent }}</span>
                        </div>
                    </div>
                    <div v-if="filteredAgents.length === 0" class="text-sm text-gray-500 ">No agents found for the selected region</div>
                </div>
            </div>
        </div>
    </div>
</div>


            <!-- Div for the second half -->
            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full shadow-custom border">
                <div class="font-semibold text-xl">Log files</div>

                <div v-if="logs.length > 0" class="mb-2 ml-2">
                    <table class="w-full table-auto border-collapse border border-gray-200">
                        <thead>
                            <tr class="text-white" style="background-color: #614d56">
                                <th class="text-left p-2">Log files</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="log in logs" :key="log" class="border-b border-gray-200">
                                <td class="p-2">
                                    <div class="flex items-center">
                                        <Checkbox v-model="selectedLogs" :value="log" name="log" />
                                        <span class="ml-2">{{ log }}</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="flex justify-end mt-4">
                        <Button label="Download logs" icon="pi pi-download" id="create-button" @click="downloadSelectedLogs" />
                    </div>
                </div>
                <div v-else class="text-sm text-gray-500 ml-2">No logs available.</div>
            </div>
        </div>

        <!-- Loading Modal -->
        <!-- Modal de carga -->
 <Dialog v-model:visible="isLoading" header="Dowloading..." modal :dismissableMask="false" :closable="false"  :style="{ 'max-width': '80vw', width: '40vw' }"  >
        
        <div class="flex w-full h-full justify-center items-center">
            
            <!-- Sección izquierda para el juego Snake -->
            <div class="w-1/2 h-full flex items-center justify-center border-right border-gray-300">
                <SnakeGame />
            </div>

            <!-- Sección derecha para el Progress Spinner y mensajes -->
            <div class="w-1/2 h-full flex flex-col items-center justify-center p-4 overflow-hidden">
                <ProgressSpinner />
                <p class="mt-4">Downloading logs...</p>

                <!-- Mensajes adicionales que aparecen en intervalos -->
                <p v-if="showAdditionalMessage" class="mt-2 text-sm text-gray-500">Please don't go away, your download is being processed...</p>
                <p v-if="showAdditionalMessage2" class="mt-2 text-sm text-gray-500">Don't forget to drink some water, your body will thank you!</p>
                <p v-if="showAdditionalMessage3" class="mt-2 text-sm text-gray-500">One more moment, we are working on your file...</p>
                <p v-if="showAdditionalMessage4" class="mt-2 text-sm text-gray-500">We're on it... This will only take a moment longer.</p>
                <p v-if="showAdditionalMessage5" class="mt-2 text-sm text-gray-500">We're about to finish, thank you for your patience.</p>
            </div>
        </div>
    </Dialog>

        <div v-if="errorMessage" class="text-red-500 mt-4">{{ errorMessage }}</div>
        <div v-else class="mt-4 ml-4">
            <div class="flex items-center">
                <i class="pi pi-info-circle mr-2"></i>
                <span>If you don't find the log, remember that after 7 days, logs are moved to the archive module.</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
/* Estilo para el encabezado de la tabla */
.header-row {
    background-color: #614d56;
}

/* Estilo general para la tabla */
table {
    width: 100%;
    border-collapse: collapse;
}

/* Estilo para los encabezados y celdas */
th,
td {
    padding: 0.5rem;
    border-bottom: 1px solid #ddd;
}

th {
    text-align: left;
    color: white; /* Asegura que el texto del encabezado sea blanco */
}

td {
    text-align: left;
}

/* Margen adicional para radio buttons */
.radio-margin {
    margin-left: 1rem; /* Ajusta el margen según sea necesario */
}

.p-calendar {
    width: 100%; /* Asegura que el calendario ocupe el 100% del ancho del contenedor */
    border-radius: 0.25rem; /* Ajusta el borde del calendario */
}

.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.shadow-custom {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 8px; /* Opcional: redondear bordes */
}
</style>
