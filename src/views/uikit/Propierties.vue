<script>
import axios from 'axios';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import RadioButton from 'primevue/radiobutton';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import { ref, watch, onMounted } from 'vue';
import Breadcrumb from 'primevue/breadcrumb';

export default {
    components: {
        Dropdown,
        DataTable,
        Column,
        RadioButton,
        Card,
        Button,
        Dialog,
        ProgressSpinner,
        Breadcrumb
    },
    setup() {
        const regions = ref([]);
        const serversDB = ref([]);
        const filteredServers = ref([]);
        const databases = ref([]);
        const properties = ref([]);
        const isLoading = ref(false); // Estado para mostrar el modal de carga
        const selectedRegion = ref(null);
        const selectedServerDB = ref(null);
        const selectedDatabase = ref(null);
        const rowsPerPage = ref(5);
        
        const breadcrumbItems = ref([
            { label: 'Home', icon: 'pi pi-home', url: '/' },
            { label: 'Database', icon: 'pi pi-database' },
            { label: 'Propierties', icon: 'pi pi-cog', route: { name: 'Propierties' } }
        ]); 

        // Función para mostrar el modal de carga
        const showLoading = () => {
            isLoading.value = true;
        };

        // Función para ocultar el modal de carga
        const hideLoading = () => {
            isLoading.value = false;
        };

        // Cargar regiones
        async function loadRegions() {
            showLoading();
            try {
                const response = await axios.get('/api/regions');
                regions.value = response.data.map((region) => ({
                    name: region.nameRegion,
                    id: region.idRegion
                }));
            } catch (error) {
                console.error('Error fetching regions:', error.message);
            } finally {
                hideLoading();
            }
        }

        // Cargar todos los servidores
        async function loadServersDB() {
            showLoading();
            try {
                const response = await axios.get('/api/serversdb');
                serversDB.value = response.data.filter((server) => server.status === 1);
            } catch (error) {
                console.error('Error fetching servers:', error.message);
            } finally {
                hideLoading();
            }
        }

        // Filtrar servidores por región seleccionada
        function filterServersByRegion() {
            if (selectedRegion.value) {
                filteredServers.value = serversDB.value.filter(
                    (server) => server.regionId === selectedRegion.value
                );
            } else {
                filteredServers.value = [];
            }
        }

        // Cargar bases de datos según el servidor seleccionado
        async function loadDatabases() {
            showLoading();
            if (!selectedServerDB.value) return;
            try {
                const response = await axios.get(`/api/database/list?serverId=${selectedServerDB.value}`);
                databases.value = response.data;
            } catch (error) {
                console.error('Error fetching databases:', error.message);
            } finally {
                hideLoading();
            }
        }

        // Cargar propiedades según la base de datos seleccionada
        async function loadProperties() {
            showLoading();
            if (!selectedServerDB.value || !selectedDatabase.value) return;
            try {
                const response = await axios.get(
                    `/api/database/properties?serverId=${selectedServerDB.value}&dataName=${selectedDatabase.value}`
                );
                properties.value = response.data.map((property) => ({
                    property_id: property.property_id,
                    project: property.project,
                    property: property.property,
                    module: property.module,
                    value: property.value,
                    instance: property.instance,
                }));
            } catch (error) {
                console.error('Error fetching properties:', error.message);
            } finally {
                hideLoading();
            }
        }

        // Filtrar servidores cuando se seleccione una región
        watch(selectedRegion, filterServersByRegion);

        // Cargar regiones y servidores cuando el componente se monta
        onMounted(async () => {
            await loadRegions();
            await loadServersDB();
        });

        return {
            regions,
            filteredServers,
            databases,
            properties,
            selectedRegion,
            selectedServerDB,
            selectedDatabase,
            rowsPerPage,
            isLoading, // Estado de carga
            loadDatabases,
            loadProperties,
            breadcrumbItems
        };
    },
};
</script>

<template>  
    <div class="flex flex-col min-h-screen">

        <div class="w-full card p-1 mb-4 shadow-custom border">
            <div class="header-container">
                <div class="title font-semibold text-xl ml-4">Propierties in the database </div>
                <div class="breadcrumb-section mr-2">
                    <Breadcrumb :model="breadcrumbItems" class="breadcrumb-item" />
                </div>
            </div>
        </div>

        <div class="flex justify-between space-x-6 mb-6">
            <!-- Panel de selección de región -->
            <div class="w-1/2 card p-4 flex-1 h-80 overflow-auto shadow-custom border">
                <div class="font-semibold text-xl mb-4">Select Region</div>
                <label for="region" class="block text-sm font-medium mb-2">Region</label>
                <Dropdown 
                    id="region" 
                    v-model="selectedRegion" 
                    :options="regions" 
                    option-label="name" 
                    option-value="id"
                    placeholder="Select Region" 
                    class="w-full h-10" 
                    filter 
                    filterPlaceholder="Search Region" 
                    style="width: 70%;" 
                />
                <h2 class="font-semibold text-lg mb-2 mt-10">Available Servers</h2>
                <div class="flex flex-col gap-2">
                    <div v-for="server in filteredServers" :key="server.idServer" class="flex items-center ">
                        <RadioButton 
                            v-model="selectedServerDB" 
                            :value="server.idServer" 
                            name="server"
                            @change="loadDatabases" 
                        />
                        <span class="text-sm ml-2">{{ server.serverName }}</span>
                        <span class="text-sm ml-2">||</span>
                        <span class="text-sm ml-2">{{ server.ipServer }}</span>
                        <span class="text-sm ml-2">||</span>
                        <span class="text-sm ml-2">{{ server.description }}</span>
                    </div>
                    <div v-if="filteredServers.length === 0" class="text-sm text-gray-500 mt-2">
                        No servers found for the selected region
                    </div>
                </div>
            </div>

            <!-- Panel de selección de base de datos -->
            <div class="w-1/2 card p-4 flex-1 h-80  shadow-custom border">
                <h2 class="font-semibold text-lg mb-4">Select Database</h2>
                <br>
                <div class="flex flex-col gap-2 ">
                    <Dropdown 
                        v-model="selectedDatabase" 
                        :options="databases" 
                        optionLabel="name" 
                        optionValue="name"
                        placeholder="Select a Database" 
                        class="w-3/4 h-10 mb-4" 
                    />
                    
                    <div v-if="databases.length === 0" class="text-sm text-gray-500 mt-2">
                        No databases found for the selected server.
                    </div>
                 
                        <div class="flex justify-center mt-20">
                            <Button 
                            @click="loadProperties" 
                            :disabled="!selectedDatabase" 
                            label="View Properties"
                            class="boton1" 
                            style="width: 50%;" 

                        />
                       
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabla de propiedades -->
        <div class="w-full card p-4 flex flex-col gap-4 shadow-custom border">
            <h2 class="font-semibold text-lg mb-2">Properties</h2>
            <DataTable 
                :value="properties" 
                class="p-datatable-sm" 
                :paginator="true" 
                :rows="rowsPerPage"
                :rowsPerPageOptions="[5, 10, 20]" 
                :totalRecords="properties.length"
            >
                <Column field="property_id" header="ID property" sortable />
                <Column field="project" header="Project" sortable />
                <Column field="property" header="Property Name" sortable />
                <Column field="module" header="Module" sortable />
                <Column field="value" header="Value" sortable />
                <Column field="instance" header="Instance" sortable />
            </DataTable>
            <div 
                v-if="properties.length === 0 && selectedDatabase !== null && selectedServerDB !== null"
                class="text-center mt-4 text-red-500"
            >
                No properties found for the selected database.
            </div>
        </div>

        <!-- Loading Modal -->
        <Dialog 
            v-model:visible="isLoading" 
            modal 
            :dismissableMask="false" 
            :showHeader="false" 
            :closable="false"
            style="width: 20%; height: 30%; display: flex; align-items: center; justify-content: center"
        >
            <div class="flex flex-col items-center justify-center">
                <ProgressSpinner />
                <p class="mt-4">Fetching data...</p>
            </div>
        </Dialog>
    </div>
</template>



<style scoped>
.ml-2 {
    margin-left: 0.5rem;
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
</style>
