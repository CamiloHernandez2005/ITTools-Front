<script>
import { ref, onMounted, watch } from 'vue';
import { computed } from 'vue';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import LogService from '@/services/LogService';
import Breadcrumb from 'primevue/breadcrumb';
import { regionService } from '@/services/RegionService';
import { serverService } from '@/services/AgentService';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import { useToast } from 'primevue/usetoast'; // Importar useToast
import SnakeGame from '@/views/uikit/snakeGame.vue';

export default {
    components: {
        Dropdown,
        Checkbox,
        InputText,
        Calendar,
        Button,
        Dialog,
        ProgressSpinner,
        Breadcrumb,
        SnakeGame
    },
    setup() {
        const toast = useToast(); // Inicializar toast
        const breadcrumbItems = ref([
            { label: 'Home', icon: 'pi pi-home', url: '/' },
            { label: 'Logs', icon: 'pi pi-folder' },
            { label: 'Multi find log', icon: 'pi pi-search', route: { name: 'FindLogTran' } }
        ]);
        const regions = ref([]);
        const agents = ref([]);
        const selectedRegion = ref(null);
        const filteredAgents = ref([]);
        const selectedAgents = ref([]); // Lista de agentes seleccionados
        const transactionId = ref('');
        const transactionDate = ref('');
        const results = ref([]);
        const isDialogVisible = ref(false);
        const showAdditionalMessage = ref(false);
        const showAdditionalMessage2 = ref(false);
        const showAdditionalMessage3 = ref(false);
        const showAdditionalMessage4 = ref(false);
        const showAdditionalMessage5 = ref(false);
        const isLoading = ref(false); // Estado de carga
        const isDowload = ref(false); // Estado de carga
        const visibleLogs = ref([]);
        const groupedResults = computed(() => {
            const grouped = {};
            results.value.forEach((result) => {
                if (!grouped[result.agentName]) {
                    grouped[result.agentName] = [];
                }
                grouped[result.agentName].push(result);
            });
            return grouped;
        });

        const toggleLogVisibility = (agentName, logIndex) => {
            const key = `${agentName}-${logIndex}`; // Crear clave única para cada log
            if (visibleLogs.value.includes(key)) {
                visibleLogs.value = visibleLogs.value.filter((i) => i !== key); // Colapsar log
            } else {
                visibleLogs.value.push(key); // Expandir log
            }
        };

        const isLogVisible = (agentName, logIndex) => {
            const key = `${agentName}-${logIndex}`; // Crear clave única para cada log
            return visibleLogs.value.includes(key); // Retorna true si el log está visible
        };

        // Funciones de éxito y error
        const showSuccess = (detail) => {
            toast.add({ severity: 'success', summary: 'Success', detail, life: 3000 });
        };

        const showError = (detail) => {
            toast.add({ severity: 'error', summary: 'Error', detail, life: 3000 });
        };

        async function loadRegions() {
            try {
                const data = await regionService.getAllRegions();
                regions.value = data.map((region) => ({ name: region.nameRegion, id: region.idRegion }));
            } catch (error) {
                showError('Error fetching regions');
            }
        }

        async function loadAgents() {
            try {
                const data = await serverService.getAllServers();
                agents.value = data.filter((agent) => agent.status === 1);
            } catch (error) {
                showError('Error fetching agents');
            }
        }

        function filterAgentsByRegion() {
            if (selectedRegion.value) {
                // Filtrar los agentes por la región seleccionada
                filteredAgents.value = agents.value.filter((agent) => agent.regionId == selectedRegion.value);
            } else {
                filteredAgents.value = [];
            }
            // Limpiar los resultados y los agentes seleccionados al cambiar de región
            results.value = [];
            selectedAgents.value = []; // Desmarcar todos los agentes seleccionados
        }

        async function searchTransaction() {
            if (!transactionId.value) {
                showError('Please enter a transaction ID.');
                return;
            }

            if (!transactionDate.value) {
                showError('Please select a date.');
                return;
            }

            const year = transactionDate.value.getFullYear();
            const month = String(transactionDate.value.getMonth() + 1).padStart(2, '0');
            const day = String(transactionDate.value.getDate()).padStart(2, '0');
            const formattedDate = `${day}-${month}-${year}`;

            results.value = [];

            if (selectedAgents.value.length === 0) {
                showError('Please select at least one agent.');
                return;
            }

            if (!selectedRegion.value) {
                showError('Please select a region.');
                return;
            }

            isLoading.value = true;

            try {
                for (const agentId of selectedAgents.value) {
                    const logsData = await LogService.getLogsByTransaction(agentId, transactionId.value, formattedDate, selectedRegion.value);
                    if (Array.isArray(logsData) && logsData.length > 0) {
                        const agentName = agents.value.find((agent) => agent.idAgent === agentId)?.agentName || 'Unknown Agent'; // Obtener el nombre del agente
                        logsData.forEach((log) => {
                            results.value.push({
                                filename: log.filename,
                                logs: log.logs.map((logMessage) => ({ message: logMessage })),
                                region: selectedRegion.value, // Añadir la región
                                agentName: agentName // Añadir el nombre del agente
                            });
                        });
                    }
                }

                if (results.value.length > 0) {
                    isDialogVisible.value = true;
                    showSuccess('Logs found successfully');
                } else {
                    showError('No logs found for the provided transaction ID.');
                }
            } catch (error) {
                showError('An error occurred while searching for logs. Please check the transaction ID.');
            } finally {
                isLoading.value = false;
            }
        }

        async function downloadSingleLog(log) {
            isDowload.value = true;
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
                const agent = agents.value.find((a) => a.agentName === log.agentName); // Encontrar el agente correspondiente a este log
                const regionName = regions.value.find((region) => region.id === selectedRegion.value)?.name || 'UnknownRegion';
                const agentIp = agent?.ipagent || 'UnknownIP'; // Manejar el caso en que el agente no se encuentra

                // Llamada al servicio para descargar el archivo
                await LogService.zipSingleLogFile(agent.idAgent, log.filename, regionName, agentIp);
                showSuccess(`Log file ${log.filename} downloaded successfully`);
            } catch (error) {
                showError(`Error downloading log file ${log.filename}: ` + error.message);
            } finally {
                isDowload.value = false;
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
        }

        async function downloadLogs() {
            if (selectedAgents.value.length === 0) {
                showError('Please select at least one agent to download logs.');
                return;
            }

            isDowload.value = true;
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
                // Iterar sobre cada agente seleccionado para descargar los logs
                for (const agentId of selectedAgents.value) {
                    const agent = agents.value.find((a) => a.idAgent === agentId); // Encontrar el agente correspondiente
                    if (agent) {
                        const filenames = results.value.filter((result) => result.agentName === agent.agentName).map((result) => result.filename); // Extraer los nombres de archivos correspondientes al agente

                        // Crear el nombre de la región y la IP del agente
                        const regionName = regions.value.find((region) => region.id === selectedRegion.value)?.name || 'UnknownRegion';
                        const agentIp = agent.ipagent || 'UnknownIP';

                        // Pasar la región y la IP al servicio para descargar
                        await LogService.zipLogFile(agentId, filenames, regionName, agentIp); // Pasa regionName y agentIp por separado
                    }
                }

                showSuccess('Logs downloaded successfully');
            } catch (error) {
                showError('An error occurred while downloading the logs.');
            } finally {
                isDowload.value = false;
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
        }

        onMounted(() => {
            loadRegions();
            loadAgents();
        });

        watch(selectedRegion, filterAgentsByRegion); // Ejecutar filterAgentsByRegion cuando cambie selectedRegion

        return {
            regions,
            agents,
            selectedRegion,
            filteredAgents,
            selectedAgents,
            transactionId,
            transactionDate,
            results,
            isDialogVisible,
            isLoading,
            isDowload,
            groupedResults,
            searchTransaction,
            downloadLogs,
            downloadSingleLog, // Agregar a la interfaz
            breadcrumbItems,
            showSuccess,
            showError,
            visibleLogs,
            toggleLogVisibility,
            isLogVisible,
            showAdditionalMessage,
            showAdditionalMessage2,
            showAdditionalMessage3,
            showAdditionalMessage4,
            showAdditionalMessage5
        };
    }
};
</script>

<template>
    <div class="flex flex-col grid p-4">
        <div class="w-full card p-1 mb-4 shadow-custom border">
            <div class="header-container">
                <div class="title font-semibold text-xl ml-4">Multi find logs</div>
                <div class="breadcrumb-section mr-2">
                    <Breadcrumb :model="breadcrumbItems" class="breadcrumb-item" />
                </div>
            </div>
        </div>
        <div class="flex gap-6">
            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full shadow-custom border">
              
                    <div class="font-semibold text-xl">Region details</div>

                    <!-- Agrupamos el Dropdown y el Calendar en un div flex -->
                    <div class="flex flex-col md:flex-row gap-4">
                        <div class="flex-1">
                            <label for="region" class="block text-sm font-medium mb-2">Region</label>
                            <Dropdown id="region" v-model="selectedRegion" :options="regions" option-label="name" option-value="id" placeholder="Select region" class="w-full" filter filterPlaceholder="Search Region" />

                            <label for="transaction-date" class="block text-sm font-medium mb-2 mt-4">Transaction date</label>
                            <Calendar id="transaction-date" v-model="transactionDate" dateFormat="mm/dd/yy" placeholder="Select date" class="w-full" />
                        </div>

                        <div class="flex-1">
                            <label class="block text-sm font-medium mb-2">Agents</label>
                            <div class="flex flex-col gap-2 ml-2">
                                <div v-for="agent in filteredAgents" :key="agent.idAgent" class="flex items-center">
                                    <div class="flex items-center gap-2 checkbox-margin">
                                        <Checkbox v-model="selectedAgents" :value="agent.idAgent" />
                                        <span class="text-sm">{{ agent.agentName }}</span>
                                        <span class="text-sm">||</span>
                                        <span class="text-sm">{{ agent.ipagent }}</span>
                                    </div>
                                </div>
                                <div v-if="filteredAgents.length === 0" class="text-sm text-gray-500 mt-1 ml-2">No agents found for the selected region</div>
                            </div>
                        </div>
                    </div>
              
            </div>

            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full shadow-custom border"  >
                <div class="font-semibold text-xl  ">Transaction details</div>

                <div class="flex items-center">
                    <!-- Contenedor para el input y label -->
                    <label for="transaction-id" class="block text-sm font-medium mb-0 mr-4">Transaction ID</label>
                    <InputText id="transaction-id" v-model="transactionId" type="text" class="border input-with-line " placeholder="Enter transaction ID" />
                    <!-- Ajuste del tamaño -->
                </div>

                <div class="flex justify-end">
                    <!-- Alineación del botón al final -->
                    <Button id="create-button" label="Search" icon="pi pi-search" @click="searchTransaction" />
                </div>
            </div>
        </div>

        <Dialog v-model:visible="isDialogVisible" header="Transaction logs" modal :style="{ 'max-width': '80vw', width: 'auto' }">
            <template #footer>
                <div class="flex mt-2 justify-between items-center w-full">
                    <div class="flex items-center">
                        <i class="pi pi-info-circle mr-2 mt-1"></i>
                        <span>For more information, please download the logs.</span>
                    </div>
                    <div class="flex">
                        <Button label="Download logs" icon="pi pi-download" id="create-button" @click="downloadLogs" class="mr-2 ml-4" />
                        <Button label="Close" id="close-button" @click="isDialogVisible = false" />
                    </div>
                </div>
            </template>

            <div v-if="results.length > 0">
                <div v-for="(agentGroup, agentName) in groupedResults" :key="agentName">
                    <div class="font-bold ml-3">Agent: {{ agentName }}</div>
                    <ul>
                        <li v-for="(log, logIndex) in agentGroup" :key="logIndex">
                            <div class="font-bold flex items-center log-header mt-2 mb-2">
                                <!-- Icon for collapsing and expanding logs -->
                                <span class="cursor-pointer mr-2" style="margin-top: 4px" @click="toggleLogVisibility(agentName, logIndex)">
                                    <span v-if="isLogVisible(agentName, logIndex)" class="pi pi-minus text-sm"></span>
                                    <span v-else class="pi pi-plus text-sm"></span>
                                </span>
                                <!-- Clickable filename to toggle logs -->
                                <span class="font-bold cursor-pointer" @click="toggleLogVisibility(agentName, logIndex)">
                                    {{ log.filename }}
                                </span>
                                <!-- Botón de descarga individual -->
                                <Button label="Download" icon="pi pi-download" @click="downloadSingleLog(log)" class="p-button-sm ml-2" id="create-button" />
                            </div>
                            <ul v-show="isLogVisible(agentName, logIndex)">
                                <li v-for="(message, messageIndex) in log.logs" :key="messageIndex" class="mb-2 ml-3">
                                    {{ message.message }}
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>

            <div v-else>
                <p>No logs found for the selected transaction ID.</p>
            </div>
        </Dialog>

        <!-- Loading Modal -->
        <Dialog v-model:visible="isLoading" modal :dismissableMask="false" :showHeader="false" :closable="false" style="width: 20%; height: 30%; display: flex; align-items: center; justify-content: center">
            <div class="flex flex-col items-center justify-center">
                <ProgressSpinner />
                <p class="mt-4">Searching for transaction...</p>
            </div>
        </Dialog>

      
       <!-- Modal de carga -->
 <Dialog v-model:visible="isDowload" header="Dowloading..." modal :dismissableMask="false" :closable="false"  :style="{ 'max-width': '80vw', width: '40vw' }"  >
        
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



        <div class="mt-4 ml-4">
            <div class="flex items-center">
                <i class="pi pi-info-circle mr-2"></i>
                <span>In this module you can search for a transaction on several agents, this may take some time..</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Margen adicional para radio buttons */
.radio-margin {
    margin-left: 1rem;
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

/* Margen adicional para checkboxes */
.checkbox-margin {
    margin-left: 0.5rem;
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

.log-header {
    background-color: #614d56;
    color: #fff;
    padding: 5px; /* Espaciado interno */
    position: sticky; /* Mantener el encabezado sticky */
    top: 0; /* Pegado a la parte superior */
}
.input-with-line {
    border: none;
    border-bottom: 1px solid #d1d5db; /* Línea de color gris claro */
    padding: 0.5rem 0.4rem; /* Ajustar el padding vertical */
    background: transparent; /* Fondo transparente */
    outline: none; /* Eliminar el borde de enfoque predeterminado */
    box-shadow: none; /* Eliminar la sombra del campo de entrada */
}
</style>
