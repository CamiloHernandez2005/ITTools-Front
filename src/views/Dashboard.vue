<script setup>
import ActuatorService from '@/services/ActuatorService';
import { serverService } from '@/services/AgentService';
import { regionService } from '@/services/RegionService';
import dayjs from 'dayjs'; // Importa dayjs
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { onMounted, onUnmounted, ref } from 'vue';


// Registro de componentes necesarios para Chart.js
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const status200 = ref(0);
const status400 = ref(0);
const status404 = ref(0);
const status500 = ref(0);
const lastUpdated200 = ref('');
const lastUpdated400 = ref('');
const lastUpdated404 = ref('');
const lastUpdated500 = ref('');
const userEmail = ref(localStorage.getItem('userEmail') || '');
const requests = ref([]);
const healthInfo = ref({});
const uptime = ref(0);
const audits = ref([]);
const topUsers = ref([]);
const filteredAudits = ref([]);
// Variables para los gráficos
const regionCounts = ref({});
const agentCounts = ref({});
const regions = ref([]);
const agents = ref([]);
const chartDataRegions = ref(null);
const chartOptionsAudits = ref(null);
const calendarUrl = ref('');
const filters = ref({
    global: { value: null, matchMode: 'contains' },
    requestUri: { value: null, matchMode: 'contains' },
    method: { value: null, matchMode: 'contains' },
    statusCode: { value: null, matchMode: 'equals' },
    timestamp: { value: null, matchMode: 'between' }
});

function formatDateTime(value) {
    return value ? dayjs(value).format('DD/MMM/YYYY HH:mm:ss') : '';
}

function setCalendarUrl() {
            if (userEmail.value) {
                calendarUrl.value = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(userEmail.value)}&ctz=America%2FBogota`;
            }
        };



// Función para obtener regiones y agentes
async function fetchRegionAndAgentData() {
    try {
        regions.value = await regionService.getAllRegions();
        agents.value = await serverService.getAllServers(); // Obtener servidores (agentes)
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función para convertir bytes a gigas
function formatBytes(bytes) {
    if (bytes === 0) return '0 GB';
    const gigas = bytes / 1073741824;
    return gigas.toFixed(2);
}

// Función para formatear uptime (segundos) a HH:MM:SS
function formatUptime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Actualiza el tiempo de actividad (uptime) en tiempo real
function updateUptime() {
    uptime.value += 1;
}

// Al montar el componente
onMounted(async () => {
    const interval = setInterval(updateUptime, 1000); // Inicializa el intervalo aquí

    // Llama a las funciones asincrónicas
    await fetchRegionAndAgentData();
    await fetchData();

    // Limpia el intervalo al desmontar
    onUnmounted(() => clearInterval(interval));

    await fetchAuditData();
    setCalendarUrl();

});

// Función para analizar los mensajes de auditoría
function parseAuditMessage(userAction = '') {
    if (typeof userAction !== 'string') {
        console.error('No valid:', userAction);
        return {
            regionId: null,
            agentId: null
        };
    }

    // Usar expresiones regulares para encontrar los IDs de región y agente
    const regionMatch = userAction.match(/Region ID: (\d+)/i);
    const agentMatch = userAction.match(/Agent ID: (\d+)/i);

    // Si no se encuentra el ID de región o agente, retornamos null
    return {
        regionId: regionMatch ? parseInt(regionMatch[1]) : null,
        agentId: agentMatch ? parseInt(agentMatch[1]) : null
    };
}

// Función para obtener y filtrar los datos de auditoría
async function fetchAuditData() {
    try {
        const response = await ActuatorService.getAuditData();
        audits.value = response.data; // Almacenar los datos de auditoría
        filteredAudits.value = audits.value; // Filtro de auditoría si se requiere

        processAuditData(); // Procesar los datos de auditoría
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función para obtener el nombre de una región por su ID
function getRegionNameById(regionId) {
    const region = regions.value.find((region) => region.idRegion === regionId);
    return region ? region.nameRegion : 'Unknown Region';
}

// Función para obtener el nombre de un agente por su ID
function getAgentNameById(agentId) {
    const agent = agents.value.find((agent) => agent.idAgent === agentId);
    return agent ? agent.agentName : 'Unknown Agent';
}

function processAuditData() {
    const regionCountMap = {}; // To count records per region
    const regionAgentCountMap = {}; // To count agents within each region
    const userAuditCountMap = {}; // Mapa para contar auditorías por usuario

    audits.value.forEach((audit) => {
        if (!audit.userAction) {
            console.error('Invalid action:', audit);
            return;
        }

        const parsedData = parseAuditMessage(audit.userAction);

        if (parsedData.regionId !== null) {
            const regionName = getRegionNameById(parsedData.regionId);

            if (!regionCountMap[regionName]) {
                regionCountMap[regionName] = 0;
                regionAgentCountMap[regionName] = {};
            }
            regionCountMap[regionName]++;

            if (parsedData.agentId !== null) {
                const agentName = getAgentNameById(parsedData.agentId);

                if (!regionAgentCountMap[regionName][agentName]) {
                    regionAgentCountMap[regionName][agentName] = 0;
                }
                regionAgentCountMap[regionName][agentName]++;
            }
        }

        const userName = audit.userName || 'Unknown User';
        if (!userAuditCountMap[userName]) {
            userAuditCountMap[userName] = 0;
        }
        userAuditCountMap[userName]++;

        // Ordenar el mapa por el número de auditorías
        const sortedUsers = Object.entries(userAuditCountMap).sort((a, b) => b[1] - a[1]);

        // Almacenar el top 5 en la variable `topUsers`
        topUsers.value = sortedUsers.slice(0, 5);
    });

    // Assign processed data to chart
    regionCounts.value = regionCountMap;
    agentCounts.value = regionAgentCountMap;

    // Pass the region counts and agent details to the chart
    chartDataRegions.value = setAuditChartData(regionCountMap, regionAgentCountMap);
}

// Configura los datos para el gráfico de anillo
function setAuditChartData(regionCountMap, regionAgentMap) {
    const labels = [];
    const data = [];
    const backgroundColors = [];

    const colorPalette = ['#54d4b4', '#614d56', '#a0d995', '#f7a072', '#c94c4c'];
    let colorIndex = 0;

    for (const region in regionCountMap) {
        labels.push(region);
        data.push(regionCountMap[region]);
        backgroundColors.push(colorPalette[colorIndex % colorPalette.length]);
        colorIndex++;
    }

    return {
        labels,
        datasets: [
            {
                data,
                backgroundColor: backgroundColors
            }
        ],
        // Add agent details to the `regionAgentMap` for tooltip access
        agentDetails: regionAgentMap,
    };
}

function setAuditChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

    return {
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: textMutedColor
                }
            },
            tooltip: {
                callbacks: {
                    // Custom tooltip to show agent breakdown
                    label: function (context) {
                        const region = context.label;
                        const regionAgentMap = chartDataRegions.value.agentDetails;
                        const agents = regionAgentMap[region];

                        const regionLine = `${region}`;
                        // Prepare the line for the total number of records in the region
                        const regionTotalLine = `Total: ${context.raw}`;

                        if (agents) {
                            // Prepare the agent details to be displayed on multiple lines
                            const agentDetails = Object.entries(agents).map(([agent, count]) => {
                                return `${agent}: ${count}`;
                            });
                            // Return the region total on the first line and agent details on the following lines
                            return [
                                regionLine, // Region name at the top
                                regionTotalLine, // Total records for the region
                                ...agentDetails
                            ];
                        }
                        return [`${region}: ${context.raw}`];
                    }
                }
            }
        },
        maintainAspectRatio: false
    };
}

// Assign options to chartOptionsAudits
chartOptionsAudits.value = setAuditChartOptions();

// Función para obtener datos generales
function updateStatusCounter(statusCode, count, lastTimestamp) {
    switch (statusCode) {
        case 200:
            if (status200.value !== count) {
                // Solo actualiza si el valor ha cambiado
                status200.value = count;
                lastUpdated200.value = formatDateTime(lastTimestamp); // Formatea la fecha
            }
            break;
        case 400:
            if (status400.value !== count) {
                // Solo actualiza si el valor ha cambiado
                status400.value = count;
                lastUpdated400.value = formatDateTime(lastTimestamp); // Formatea la fecha
            }
            break;
        case 404:
            if (status404.value !== count) {
                // Solo actualiza si el valor ha cambiado
                status404.value = count;
                lastUpdated404.value = formatDateTime(lastTimestamp); // Formatea la fecha
            }
            break;
        case 500:
            if (status500.value !== count) {
                // Solo actualiza si el valor ha cambiado
                status500.value = count;
                lastUpdated500.value = formatDateTime(lastTimestamp); // Formatea la fecha
            }
            break;
        default:
            console.warn(`Code error: ${statusCode}`);
            break;
    }
}
function filteredRequests() {
    return requests.value.filter((request) => {
        // Filtro de búsqueda global
        const matchesGlobalFilter =
            !filters.value.global.value ||
            request.requestUri.toLowerCase().includes(filters.value.global.value.toLowerCase()) ||
            request.method.toLowerCase().includes(filters.value.global.value.toLowerCase()) ||
            request.statusCode.toString().includes(filters.value.global.value.toLowerCase()) ||
            formatDateTime(request.timestamp).toLowerCase().includes(filters.value.global.value.toLowerCase());

        // Filtro específico de columna
        const matchesRequestUri = !filters.value.requestUri.value || request.requestUri.toLowerCase().includes(filters.value.requestUri.value.toLowerCase());

        const matchesMethod = !filters.value.method.value || request.method.toLowerCase().includes(filters.value.method.value.toLowerCase());

        const matchesStatusCode = !filters.value.statusCode.value || request.statusCode.toString().includes(filters.value.statusCode.value);

        const matchesTimestamp = !filters.value.timestamp.value || dayjs(request.timestamp).isSame(dayjs(filters.value.timestamp.value), 'day');

        return matchesGlobalFilter && matchesRequestUri && matchesMethod && matchesStatusCode && matchesTimestamp;
    });
}

// Luego en tu función fetchData puedes usar esta función para actualizar los valores
async function fetchData() {
    try {
        const responseData = await ActuatorService.getRequest(); // Obtener datos de las solicitudes
        const response = await ActuatorService.getHealth(); // Obtener datos de salud
        healthInfo.value = response; // Almacenar la información de salud

        // Convierte cada timestamp en los datos de la solicitud a un objeto Date
        requests.value = responseData.map((request) => ({
            ...request,
            timestamp: new Date(request.timestamp) // Convierte timestamp a Date
        }));

        uptime.value = Math.floor(await ActuatorService.getUptime()); // Obtener y almacenar el uptime

        // Inicializar contadores y timestamps
        const statusCountMap = {
            200: { count: 0, lastTimestamp: '' },
            400: { count: 0, lastTimestamp: '' },
            404: { count: 0, lastTimestamp: '' },
            500: { count: 0, lastTimestamp: '' }
        };

        // Procesar cada solicitud para contar códigos de estado y obtener el último timestamp
        requests.value.forEach((request) => {
            const statusCode = request.statusCode; // Código de estado
            const timestamp = request.timestamp; // Timestamp convertido a Date

            // Si el código de estado es manejado, incrementar el contador
            if (statusCountMap[statusCode]) {
                statusCountMap[statusCode].count++;
                // Actualizar el último timestamp si es más reciente
                if (!statusCountMap[statusCode].lastTimestamp || timestamp > statusCountMap[statusCode].lastTimestamp) {
                    statusCountMap[statusCode].lastTimestamp = timestamp;
                }
            }
        });

        // Actualizar los contadores y los timestamps
        updateStatusCounter(200, statusCountMap[200].count, statusCountMap[200].lastTimestamp);
        updateStatusCounter(400, statusCountMap[400].count, statusCountMap[400].lastTimestamp);
        updateStatusCounter(404, statusCountMap[404].count, statusCountMap[404].lastTimestamp);
        updateStatusCounter(500, statusCountMap[500].count, statusCountMap[500].lastTimestamp);
    } catch (error) {
        console.error('Error:', error);
    }
}

function getStatusClass(statusCode) {
    switch (statusCode) {
        case 200:
            return 'text-green-500';
        case 400:
            return 'text-yellow-500';
        case 404:
            return 'text-blue-500';
        case 500:
            return 'text-red-500';
        default:
            return 'text-gray-500';
    }
}

// Función para obtener el ícono según el código de estado
function getStatusIcon(statusCode) {
    switch (statusCode) {
        case 200:
            return 'pi pi-check-circle'; // Ícono de éxito
        case 400:
            return 'pi pi-exclamation-circle'; // Ícono de advertencia
        case 404:
            return 'pi pi-times-circle'; // Ícono de no encontrado
        case 500:
            return 'pi pi-ban'; // Ícono de error
        default:
            return 'pi pi-info-circle'; // Ícono por defecto
    }
}
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 lg:col-span-2 xl:col-span-3">
            <div class="card mb-0 bg-green-100 shadow-custom border ">
                <div class="flex justify-between mb-2">
                    <div>
                        <span class="block text-surface-900 font-medium mb-2">200 Response</span>
                        <div class="text-surface-900 font-medium text-xl">{{ status200 }}</div>
                        <div class="text-gray-600">Updated: {{ lastUpdated200 }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-green-400 rounded-border"
                        style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-check text-white !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Respuesta 404 -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 bg-blue-100 shadow-custom border">
                <div class="flex justify-between mb-2 ">
                    <div>
                        <span class="block text-surface-900 font-medium mb-2">404 Response</span>
                        <div class="text-surface-900 font-medium text-xl">{{ status404 }}</div>
                        <div class="text-gray-600">Updated: {{ lastUpdated404 }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-400 rounded-border"
                        style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-exclamation-triangle text-white !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Respuesta 400 -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 bg-orange-100 shadow-custom border">
                <div class="flex justify-between mb-2">
                    <div>
                        <span class="block text-surface-900 font-medium mb-2">400 Response</span>
                        <div class="text-surface-900 font-medium text-xl">{{ status400 }}</div>
                        <div class="text-gray-600">Updated: {{ lastUpdated400 }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-400 rounded-border"
                        style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-times text-white !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Respuesta 500 -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 bg-red-100 shadow-custom border ">
                <div class="flex justify-between mb-2">
                    <div>
                        <span class="block text-surface-900 font-medium mb-2">500 Response</span>
                        <div class="text-surface-900 font-medium text-xl">{{ status500 }}</div>
                        <div class="text-gray-600">Updated: {{ lastUpdated500 }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-red-400 rounded-border"
                        style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-server text-white !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabla con las solicitudes -->
        <div class="col-span-12 xl:col-span-6">
            <div class="card flex flex-col shadow-custom border">
                <div class="font-semibold text-xl mb-4">System information</div>
                <div class="flex flex-wrap items-start justify-between">
                    
                    <div class="flex items-center mr-8 mb-2">
                        <i class="pi pi-server mr-2 mt-1"></i>
                        <strong>System:</strong>
                        <span class="ml-1">{{ healthInfo.status }}</span>
                    </div>
                    <div class="flex items-center mr-8 mb-2">
                        <i class="pi pi-database mr-2 mt-1"></i>
                        <strong>DB:</strong>
                        <span class="ml-1">{{ healthInfo.components?.db?.details?.database }} - {{
                            healthInfo.components?.db?.status }}</span>
                    </div>
                </div>

                <div class="flex flex-wrap items-center justify-between mt-2">
                    <div class="flex items-center mr-8 mb-2">
                        <i class="pi pi-desktop mr-2 mt-1"></i>
                        <strong>Disk space:</strong>
                        <span class="ml-1">{{ formatBytes(healthInfo.components?.diskSpace?.details?.total) }} GB</span>
                    </div>
                    <div class="flex items-center mr-8 mb-2">
                        <i class="pi pi-desktop mr-2 mt-1"></i>
                        <strong>Disk free:</strong>
                        <span class="ml-1">{{ formatBytes(healthInfo.components?.diskSpace?.details?.free) }} GB</span>
                    </div>
                </div>

                <div class="flex items-center mt-2">
                    <i class="pi pi-clock mr-2 mt-1"></i>
                    <strong>Uptime:</strong>
                    <span class="ml-1">{{ formatUptime(uptime) }} h</span>
                </div>
            </div>
            <div class="card shadow-custom border">
                <div class="font-semibold text-xl mb-4">Http response</div>
                <DataTable :value="filteredRequests()" class="p-datatable-sm" :paginator="true" :rows="8"
                    :rowsPerPageOptions="[8, 10, 20]" :totalRecords="filteredRequests().length" :sortField="'timestamp'"
                    :sortOrder="-1" dataKey="id" :rowHover="true"
                    v-model:filters="filters" filterDisplay="menu">
                    <template #empty> No http request found. </template>
                    <template #loading> Loading http request. Please wait. </template>
                    <Column field="requestUri" header="Request URL" :showFilterMatchModes="false" :sortable="true">
                        <template #body="{ data }">
                            {{ data.requestUri }}
                        </template>
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by request" />
                        </template>
                    </Column>

                    <Column field="method" header="Method" :showFilterMatchModes="false" :sortable="true">
                        <template #body="{ data }">
                            {{ data.method }}
                        </template>
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by method" />
                        </template>
                    </Column>

                    <Column field="statusCode" header="Status code" :showFilterMatchModes="false" :sortable="true">
                        <template #body="slotProps">
                            <span :class="getStatusClass(slotProps.data.statusCode)" class="flex items-center">
                                <i :class="getStatusIcon(slotProps.data.statusCode)" class="mr-2"></i>
                                {{ slotProps.data.statusCode }}
                            </span>
                        </template>
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="number" placeholder="Filter by status code" />
                        </template>
                    </Column>

                    <Column field="timestamp" header="Date & time" :showFilterMatchModes="false" :sortable="true">
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.timestamp) }}
                        </template>

                        <template #filter="{ filterModel }">
                            <Calendar v-model="filterModel.value" placeholder="Search by date" dateFormat="dd/mm/yy" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Información del sistema -->
        <div class="col-span-12 xl:col-span-6">
            <div class="card shadow-custom border">
                <div class="font-semibold text-xl mb-2">Activity</div>
                <DataTable :value="filteredAudits" class="p-datatable-sm" :paginator="true" :rows="5"
                    :rowsPerPageOptions="[5, 10, 20]" :totalRecords="audits.length" :sortField="'dateTime'"
                    :sortOrder="-1"  :rowHover="true">
                    <template #empty> No activity found. </template>
                    <template #loading> Loading activity. Please wait. </template>
                    <Column field="userAction" header="Action" sortable/>
                    <Column field="dateTime" header="Date & time" sortable>
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.dateTime) }}
                        </template>
                    </Column>
                </DataTable>
            </div>
            <!-- Gráfica de agentes más utilizados -->
            <div class="col-span-6">
                <div class="card shadow-custom border ">
                    <div class="font-semibold text-xl mb-4">User interact</div>

                    <ListItem v-for="(user, index) in topUsers" :key="user[0]" class="mb-4">
                        <div class="flex justify-between items-center mb-6">
                            <div class="flex items-center">
                                <span>{{ index + 1 }}. {{ user[0] }}</span>
                            </div>
                            <div class="font-semibold">{{ user[1] }} auditorías</div>
                        </div>
                    </ListItem>
                </div>
            </div>
        </div>

        <!-- Gráfica de regiones más utilizadas -->
        <div class="col-span-12 xl:col-span-6 h-full">
            <div class="card shadow-custom border ">
                <div class="font-semibold text-xl mb-2">Regions usage</div>
                <!-- Gráfico de pastel -->
                <Chart type="doughnut" :data="chartDataRegions" :options="chartOptionsAudits" class="h-96" />
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6">
            <div class="card shadow-custom border h-full">
                <div class="font-semibold text-xl mb-4">Calendar</div>
                <div v-if="calendarUrl">
                            <iframe :src="calendarUrl" style="border: 0" width="100%" height="330px" frameborder="0"
                                scrolling="no">
                            </iframe>
                        </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.shadow-custom {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    /* Opcional: redondear bordes */
}
</style>
