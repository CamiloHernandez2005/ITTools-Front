<script>
import { ref, onMounted, watch } from 'vue';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import ProgressSpinner from 'primevue/progressspinner';
import InputText from 'primevue/inputtext';
import LogService from '@/services/LogService';
import Dialog from 'primevue/dialog';
import RadioButton from 'primevue/radiobutton'; // Asegúrate de importar RadioButton
import { regionService } from '@/services/RegionService';
import { serverService } from '@/services/AgentService';
import { useToast } from 'primevue/usetoast'; // Importar useToast para las notificacionesmport SnakeGame from '@/components/SnakeGame.vue';
import SnakeGame from '@/views/uikit/snakeGame.vue';


export default {
    components: {
        Dropdown,
        Checkbox,
        Button,
        Calendar,
        ProgressSpinner,
        Dialog,
        InputText,
        RadioButton, // Agregar el componente RadioButton
        SnakeGame
    },
    setup() {
        const toast = useToast(); // Inicializar el sistema de toast
        const breadcrumbItems = ref([
            { label: 'Home', icon: 'pi pi-home', url: '/homeusers' },
            { label: 'Logs', icon: 'pi pi-folder' },
            { label: 'Find in a log file', icon: 'pi pi-search-plus', route: { name: 'FindLog' } }
        ]);
        const regions = ref([]);
        const agents = ref([]);
        const selectedRegion = ref(null);
        const filteredAgents = ref([]);
        const selectedAgent = ref(null);
        const date = ref(null);
        const logs = ref([]);
        const selectedLogFiles = ref([]);
        const transactionId = ref('');
        const errorMessage = ref('');
        const isLoading = ref(false);
        const isDowload = ref(false);
        const showAdditionalMessage = ref(false);
        const showAdditionalMessage2 = ref(false);
        const showAdditionalMessage3 = ref(false);
        const showAdditionalMessage4 = ref(false);
        const showAdditionalMessage5 = ref(false);
        const showResultsModal = ref(false); // Modal visibility
        const searchResults = ref([]); // Store search results
        const visibleLogs = ref([]);


        const showSuccess = (message) => {
            toast.add({ severity: 'success', summary: 'Success', detail: message, life: 3000 });
        };

        const showError = (message) => {
            toast.add({ severity: 'error', summary: 'Error', detail: message, life: 3000 });
        };

        // Cargar logs según los parámetros seleccionados
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

        // Descargar logs seleccionados
        // Descargar logs encontrados en la búsqueda
        async function downloadSelectedLogs() {
            if (searchResults.value.length > 0) {
                // Verificar si hay resultados de búsqueda
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
                    // Obtener información del agente y región para la descarga
                    const agent = agents.value.find((a) => a.idAgent === selectedAgent.value);
                    const agentIp = agent?.ipagent || 'UnknownIP';
                    const regionName = regions.value.find((region) => region.id === selectedRegion.value)?.name || 'UnknownRegion';

                    // Extraer los nombres de archivo de los resultados de búsqueda
                    const filenames = searchResults.value.map((result) => result.filename);

                    // Llamada al servicio para descargar los archivos de log relacionados con la transacción
                    await LogService.zipLogFile(selectedAgent.value, filenames, regionName, agentIp);

                    showSuccess('Log files downloaded successfully');
                } catch (error) {
                    showError('Error downloading log file: ' + error.message);
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
            } else {
                showError('No logs found for the provided transaction ID to download.');
            }
        }

        // Descargar un solo log
        async function downloadSingleLog(filename) {
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
                const agent = agents.value.find((a) => a.idAgent === selectedAgent.value);
                const agentIp = agent?.ipagent || 'UnknownIP';
                const regionName = regions.value.find((region) => region.id === selectedRegion.value)?.name || 'UnknownRegion';

                await LogService.zipSingleLogFile(selectedAgent.value, filename, regionName, agentIp);

                showSuccess(`Log file ${filename} downloaded successfully`);
            } catch (error) {
                showError(`Error downloading log file ${filename}: ` + error.message);
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

        // Buscar logs por ID de transacción
        async function searchLogsByTransaction() {
            if (!transactionId.value) {
                showError('Please enter a transaction ID.');
                return;
            }

            if (selectedLogFiles.value.length === 0) {
                showError('Please select at least one log file.');
                return;
            }

            // Asegúrate de que selectedRegion tenga un valor válido
            if (!selectedRegion.value) {
                showError('Please select a region.');
                return;
            }

            isLoading.value = true;
            try {
                // Llama al servicio incluyendo la región
                const data = await LogService.searchLogsInSelectedFiles(
                    selectedAgent.value,
                    transactionId.value,
                    selectedLogFiles.value,
                    selectedRegion.value // Pasar la región aquí
                );

                if (Array.isArray(data)) {
                    searchResults.value = data; // Store the results

                    if (searchResults.value.length > 0) {
                        showResultsModal.value = true; // Show the modal
                        showSuccess('Logs found successfully');
                    } else {
                        showError('No logs found for the provided transaction ID.');
                    }
                } else {
                    showError('Error: Search results are not in the expected format.');
                    searchResults.value = [];
                }
            } catch (error) {
                // Manejar errores del servidor
                if (error.response) {
                    const errorMessage = error.response.data.message || 'No logs found for the provided transaction ID.';
                    showError(errorMessage);
                } else {
                    showError('An error occurred while searching for logs. Please try again.');
                }
            } finally {
                isLoading.value = false; // Ocultar indicador de carga
            }
        }

        // Manejar errores
        function handleError(error) {
            if (error.message.includes('Network Error') || error.message.includes('I/O error')) {
                showError('Unable to connect to the web service URL. Please check the URL and try again.');
            } else {
                showError('Error: ' + error.message);
            }
        }

        // Cargar regiones
        async function loadRegions() {
            try {
                const data = await regionService.getAllRegions();
                regions.value = data.map((region) => ({ name: region.nameRegion, id: region.idRegion }));
            } catch (error) {
                handleError(error);
            }
        }

        // Cargar agentes
        async function loadAgents() {
            try {
                const data = await serverService.getAllServers();
                agents.value = data.filter((agent) => agent.status === 1);
            } catch (error) {
                handleError(error);
            }
        }

        // Filtrar agentes por región
        function filterAgentsByRegion() {
            filteredAgents.value = selectedRegion.value ? agents.value.filter((agent) => agent.regionId === selectedRegion.value) : [];
        }

        const toggleLogVisibility = (index) => {
            if (visibleLogs.value.includes(index)) {
                visibleLogs.value = visibleLogs.value.filter((i) => i !== index); // Colapsar
            } else {
                visibleLogs.value.push(index); // Expandir
            }
        };

        const isLogVisible = (index) => {
            return visibleLogs.value.includes(index);
        };

        onMounted(() => {
            loadRegions();
            loadAgents();
        });

        watch(selectedAgent, () => {
            logs.value = []; // Limpiar los logs al cambiar el agente
            selectedLogFiles.value = []; // Limpiar la selección de logs
            loadLogs(); // Cargar nuevos logs con el agente seleccionado
        });

        watch(date, () => {
            loadLogs(); // Cargar logs al seleccionar una fecha
            selectedLogFiles.value = []; // Limpiar la selección de logs
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
            selectedLogFiles,
            transactionId,
            errorMessage,
            isLoading,
            isDowload,
            showResultsModal, // Modal visibility
            showAdditionalMessage,
            showAdditionalMessage2,
            showAdditionalMessage3,
            showAdditionalMessage4,
            showAdditionalMessage5,
            searchResults, // Store search results
            searchLogsByTransaction,
            downloadSelectedLogs,
            breadcrumbItems,
            visibleLogs,
            toggleLogVisibility,
            isLogVisible,
            downloadSingleLog,

        };
    }
};
</script>

<template>
    <div class="flex flex-col grid p-4">
        <div class="w-full card p-1 mb-4 shadow-custom border">
            <div class="header-container">
                <div class="title font-semibold text-xl ml-4">Find in a log file</div>
                <div class="breadcrumb-section mr-2">
                    <Breadcrumb :model="breadcrumbItems" class="breadcrumb-item" />
                </div>
            </div>
        </div>
        <div class="flex gap-6">
            <!-- First Half -->
            <div class="w-full md:w-1/2 card p-4 flex flex-col gap-4 h-full shadow-custom border">

                <div class="font-semibold text-xl ">Region details</div>

                <!-- Agrupamos el Dropdown y el Calendar en un div flex -->
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="flex-1">
                        <label for="region" class="block text-sm font-medium mb-2">Region</label>
                        <Dropdown id="region" v-model="selectedRegion" :options="regions" option-label="name"
                            option-value="id" placeholder="Select region" class="w-full" filter
                            filterPlaceholder="Search region" />

                        <label for="last-modified" class="block text-sm font-medium mb-2 mt-4">Transation date</label>
                        <Calendar id="last-modified" v-model="date" class="w-full" placeholder="Select date" />
                    </div>

                    <div class="flex-1">
                        <label class="block text-sm font-medium mb-3">Agents</label>
                        <div class="flex flex-col gap-2 ml-4">
                            <div v-for="agent in filteredAgents" :key="agent.idAgent" class="flex items-center">
                                <div class="flex items-center gap-2 radio-margin">
                                    <RadioButton v-model="selectedAgent" :value="agent.idAgent" name="agent" />
                                    <span class="text-sm">{{ agent.agentName }}</span>
                                    <span class="text-sm">||</span>
                                    <span class="text-sm">{{ agent.ipagent }}</span>
                                </div>
                            </div>
                            <div v-if="filteredAgents.length === 0" class="text-sm text-gray-500">No agents found for
                                the selected region</div>
                        </div>
                    </div>
                </div>

            </div>



            <!-- Second Half -->
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
                                        <Checkbox v-model="selectedLogFiles" :value="log" name="log" />
                                        <span class="ml-2">{{ log }}</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-else class="text-sm text-gray-500 ml-2">No logs available.</div>

                <div class="mb-4 flex justify-end items-center">
                    <div class="flex items-center">
                        <label for="transaction-id" class="block text-sm font-medium mb-0 mr-4">Transaction ID</label>
                        <InputText id="transaction-id" v-model="transactionId" type="text"
                            class="border input-with-line "
                            placeholder="Enter transaction ID" />
                    </div>
                </div>

                <div class="flex justify-end">
                    <Button id="create-button" @click="searchLogsByTransaction" label="Search" icon="pi pi-search" />
                </div>
            </div>
        </div>

        <div v-if="errorMessage" class="text-red-500 mt-4">{{ errorMessage }}</div>

        <Dialog v-model:visible="showResultsModal" header="Transaction logs" modal
            :style="{ 'max-width': '80vw', width: 'auto' }">
            <template #footer>
                <div class="flex mt-2 justify-between items-center w-full">
                    <div class="flex items-center">
                        <i class="pi pi-info-circle mr-2 mt-1"></i>
                        <span>For more information, please download the logs.</span>
                    </div>
                    <div class="flex">
                        <Button id="create-button" @click="downloadSelectedLogs" label="Download logs"
                            icon="pi pi-download" :loading="isDowload" class="mr-2 ml-4" />
                        <Button label="Close" id="close-button" @click="showResultsModal = false" />
                    </div>
                </div>
            </template>

            <div v-if="searchResults.length > 0">
                <div v-for="(result, index) in searchResults" :key="index">
                    <div class="font-bold flex items-center log-header mt-2 mb-2">
                        <span class="flex items-center mr-2 cursor-pointer" @click="toggleLogVisibility(index)">
                            <span class="cursor-pointer mr-2" style="margin-top: 4px">
                                <span v-if="isLogVisible(index)" class="pi pi-minus text-sm"></span>
                                <span v-else class="pi pi-plus text-sm"></span>
                            </span>
                            {{ result.filename }}
                        </span>
                        <!-- Botón de descarga para cada log -->
                        <Button label="Download" icon="pi pi-download" @click="downloadSingleLog(result.filename)"
                            class="p-button-sm" id="create-button" />
                    </div>

                    <div v-if="isLogVisible(index)">
                        <ul>
                            <li v-for="(log, logIndex) in result.logs" :key="logIndex" class="mb-2 ml-3">
                                {{ log }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>



            <div v-else>
                <p>No results found.</p>
            </div>
        </Dialog>

        <!-- Modal que contiene el juego -->

        <!-- Modal de carga -->
        <Dialog v-model:visible="isLoading" modal :dismissableMask="false" :showHeader="false" :closable="false"
            style="width: 20%; height: 30%; display: flex; align-items: center; justify-content: center">
            <div class="flex flex-col items-center justify-center">
                <ProgressSpinner />
                <p class="mt-4">Searching for transaction...</p>
            </div>
        </Dialog>

        <!-- Modal que contiene el juego -->


        <!-- Modal de carga -->
        <Dialog v-model:visible="isDowload" header="Dowloading..." modal :dismissableMask="false" :closable="false"
            :style="{ 'max-width': '80vw', width: '40vw' }">

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
                    <p v-if="showAdditionalMessage" class="mt-2 text-sm text-gray-500">Please don't go away, your
                        download is
                        being processed...</p>
                    <p v-if="showAdditionalMessage2" class="mt-2 text-sm text-gray-500">Don't forget to drink some
                        water, your
                        body will thank you!</p>
                    <p v-if="showAdditionalMessage3" class="mt-2 text-sm text-gray-500">One more moment, we are working
                        on your
                        file...</p>
                    <p v-if="showAdditionalMessage4" class="mt-2 text-sm text-gray-500">We're on it... This will only
                        take a
                        moment longer.</p>
                    <p v-if="showAdditionalMessage5" class="mt-2 text-sm text-gray-500">We're about to finish, thank you
                        for
                        your patience.</p>
                </div>
            </div>
        </Dialog>

        <div v-if="errorMessage" class="text-red-500 mt-4">{{ errorMessage }}</div>
        <div v-else class="mt-4 ml-4">
            <div class="flex items-center">
                <i class="pi pi-info-circle mr-2"></i>
                <span>In this module you can search for a transaction in one or several logs of an agent.</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
    color: white;
    /* Asegura que el texto del encabezado sea blanco */
}

td {
    text-align: left;
}

/* Margen adicional para radio buttons */
.radio-margin {
    margin-left: 1rem;
    /* Ajusta el margen según sea necesario */
}

.p-calendar {
    width: 100%;
    /* Asegura que el calendario ocupe el 100% del ancho del contenedor */
    border-radius: 0.375rem;
    /* Radio de borde consistente */
    border: 1px solid #d1d5db;
    /* Borde consistente */
}

button {
    cursor: pointer;
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
}

.shadow-custom {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    /* Opcional: redondear bordes */
}

.log-header {
    background-color: #614d56;
    color: #fff;
    padding: 5px;
    /* Espaciado interno */
    position: sticky;
    /* Mantener el encabezado sticky */
    top: 0;
    /* Pegado a la parte superior */
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
