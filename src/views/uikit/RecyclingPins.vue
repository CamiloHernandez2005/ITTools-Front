<script>
import axios from 'axios';
import Breadcrumb from 'primevue/breadcrumb';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import RadioButton from 'primevue/radiobutton';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';
import * as XLSX from 'xlsx';


export default {
    components: {
        Dropdown,
        RadioButton,
        Button,
        Dialog,
        DataTable,
        Column,
        Breadcrumb

    },
    setup() {
        const toast = useToast();
        const regions = ref([]);
        const ServersDB = ref([]);
        const selectedRegion = ref(null);
        const filteredDB = ref([]);
        const selectedServerDB = ref(null);
        const modalVisible = ref(false);
        const ticketNumber = ref("");
        const authorizedBy = ref("");
        const file = ref(null);
        const updatedPins = ref([]);
        const nonUpdatedPins = ref([]);
        const excelPins = ref([]);
        const isRecycleModalVisible = ref(false);
        const selectedPin = ref(null);  // PIN seleccionado para consultar
        const selectedPinsForRecycle = ref([]); // Inicializa como un array vacío
        const consultedPins = ref([]);
        const pins = ref([]);
        const errors = ref([]);
        const selectedError = ref('');
        const modalVisibleError = ref(false);
        const confirmVisible = ref(false);
        let uploadType = ref('');
        const confirmationMessage = ref('');
        const fileUploadMessage = ref('');
        // Rastro de navegación
        const breadcrumbItems = ref([
            { label: 'Home', icon: 'pi pi-home', url: '/' },
            { label: 'Database', icon: 'pi pi-database' },
            { label: 'Recycling Pins', icon: 'pi pi-refresh', route: { name: 'RecyclingPins' } }
        ]);


        function showErrorDetails(data) {
            selectedError.value = data.errors; // Asigna el error al ref
            modalVisibleError.value = true; // Muestra el modal
        }



        // Loading state for the spinner dialog
        const isLoading = ref(false);


        const showSuccess = (detail) => {
            toast.add({ severity: 'success', summary: 'Success', detail, life: 3000 });
        };


        const showError = (detail) => {
            toast.add({ severity: 'error', summary: 'Error', detail, life: 3000 });
        };



        // Función para mostrar el modal de carga
        const showLoading = () => {
            isLoading.value = true;
        };

        // Función para ocultar el modal de carga
        const hideLoading = () => {
            isLoading.value = false;
        };

        const confirmUpload = (type) => {
            uploadType.value = type; // Guarda el tipo de carga
            confirmationMessage.value = `Are you sure you want to proceed with ${type === 'recycled' || type === "selRecycled" ? 'Recycled' : 'Quarantine'} Pins?`;
            confirmVisible.value = true; // Muestra el modal de confirmación
        };

        const executeUpload = () => {
            if (uploadType.value === 'recycled') {
                uploadFile(); // Llama a la función para cargar los pins reciclados
            } else if (uploadType.value === 'quarantine') {
                uploadFileQuarantine(); // Llama a la función para cargar los pins en cuarentena
            } else if (uploadType.value === 'selRecycled') {
                recyclePins();
            } else if (uploadType.value === 'selQuarantine') {
                quarantinePins();

            }
            confirmVisible.value = false; // Cierra el modal de confirmación
        };



        //Metodo para reciclar pines selecionados 
        async function recyclePins() {
            // Validación de campos obligatorios
            if (!ticket.value || ticket.value.trim() === '') {
                showError("The 'Ticket' field is required.");
                return;
            }
            if (!approvedBy.value || approvedBy.value.trim() === '') {
                showError("The 'Approved By' field is required.");
                return;
            }
            if (!selectedPinsForRecycle.value || selectedPinsForRecycle.value.length === 0) {
                showError("You must select at least one pin to recycle.");
                return;
            }

            console.log("Selected Pins:", selectedPinsForRecycle.value);

            const requestData = selectedPinsForRecycle.value;

            try {
                showLoading();

                const response = await axios.post('/api/pins/recycle', requestData, {
                    params: {
                        serverId: selectedServerDB.value,
                        authorization: approvedBy.value,
                        ticket: ticket.value,
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                // Manejo de la respuesta
                const { errorMessages, satisfyingMessages } = response.data; // Desestructura la respuesta

                // Si hay mensajes de error, mostrarlos
                if (errorMessages && errorMessages.length > 0) {
                    // Iterar sobre los mensajes de error para mostrarlos
                    showError(errorMessages.join('\n')); // Muestra todos los mensajes en una alerta
                } if (satisfyingMessages && satisfyingMessages.length > 0) {
                    showSuccess(satisfyingMessages.join('\n')); // Muestra todos los mensajes de éxito en una alerta
                }


                else {
                    // Si no hay errores, puedes manejar los pines reciclados como desees
                    console.log("Pines reciclados:", recycledPins);
                    showSuccess("Pines reciclados correctamente."); // Mensaje de éxito, opcional
                }

            } catch (error) {
                // Manejo de errores de red u otros errores
                showError(error.response?.data?.message || 'Error al reciclar pines.');
            } finally {
                hideLoading();
            }
        }




        async function quarantinePins() {
            // Validación de campos obligatorios
            if (!ticket.value || ticket.value.trim() === '') {
                showError("The 'Ticket' field is required.");
                return;
            }
            if (!approvedBy.value || approvedBy.value.trim() === '') {
                showError("The 'Approved By' field is required.");
                return;
            }
            if (!selectedPinsForRecycle.value || selectedPinsForRecycle.value.length === 0) {
                showError("You must select at least one pin to recycle.");
                return;
            }



            // Crear un objeto para enviar como JSON
            const requestData = selectedPinsForRecycle.value; // Solo la lista de pines

            try {
                showLoading();

                const response = await axios.post('/api/quarantine/quarantinePins', requestData, {
                    params: {
                        serverId: selectedServerDB.value,
                        authorization: approvedBy.value,
                        ticket: ticket.value,
                        // filename se puede incluir si es necesario
                    },
                    headers: {
                        'Content-Type': 'application/json' // Especificar que se envía JSON
                    }
                });

                // Manejo de la respuesta
                const { errorMessages, satisfyingMessages } = response.data; // Desestructura la respuesta

                // Si hay mensajes de error, mostrarlos
                if (errorMessages && errorMessages.length > 0) {
                    // Iterar sobre los mensajes de error para mostrarlos
                    showError(errorMessages.join('\n')); // Muestra todos los mensajes en una alerta
                }

                if (satisfyingMessages && satisfyingMessages.length > 0) {
                    showSuccess(satisfyingMessages.join('\n')); // Muestra todos los mensajes de éxito en una alerta
                }

            } catch (error) {
                // Manejo de errores de red u otros errores
                showError(error.response?.data?.message || 'Error recycling pins.');
            } finally {
                hideLoading();
            }
        }


        function downloadExcel() {
            // Asegúrate de que `pins.value` contenga los datos que deseas exportar
            const worksheet = XLSX.utils.json_to_sheet(pins.value); // Convierte los datos a una hoja
            const workbook = XLSX.utils.book_new(); // Crea un nuevo libro de trabajo
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Recycling Pins'); // Agrega la hoja al libro

            // Genera el archivo Excel y lo descarga
            XLSX.writeFile(workbook, 'recycling_pins.xlsx');
        }



        // Listar pins por servidor y PIN específico
        async function listPin() {


            // Verificar si el pin es una cadena vacía o solo espacios en blanco
            if (!selectedPin.value || selectedPin.value.trim() === '') {
                showError("The pin cannot be empty or composed only of whitespace");

                return;  // Salir de la función si el pin es inválido
            }

            showLoading();
            try {
                const response = await axios.get(`/api/pins/list?pin=${selectedPin.value}&serverId=${selectedServerDB.value}`);
                console.log("Response data:", response.data);
                pins.value = response.data;

                // Actualizar la tabla con los pines consultados
                consultedPins.value = pins.value.map(pin => ({
                    tempId: Date.now() + Math.random(),
                    pin: pin.pin,
                    productId: pin.productId,
                    controlNo: pin.controlNo,
                    amount: pin.amount,
                    insertDate: pin.insertDate,
                    activationDate: pin.activationDate,
                    recycleDate: pin.recycleDate,
                    transactionCount: pin.transactionCount,
                    batchID: pin.batchID,
                    expirationDate: pin.expirationDate,
                    state: pin.state
                }));
                await nextTick()

            } catch (error) {
                showError.value = 'Error listing pins: ' + error.message;

            } finally {
                hideLoading();
            }
        }



        async function loadRegions() {
            try {
                const response = await axios.get('/api/regions'); // Ajusta la URL según tu backend
                regions.value = response.data.map((region) => ({
                    name: region.nameRegion,
                    id: region.idRegion,
                }));
            } catch (error) {
                showError('Error fetching regions: ' + error.message);
            }
        }




        async function loadServersDB() {
            try {
                const response = await axios.get('/api/serversdb'); // Ajusta la URL según tu backend
                ServersDB.value = response.data.filter((server) => server.status === 1);
            } catch (error) {
                showError('Error fetching servers: ' + error.message);
            }
        }

        function filterServersByRegion() {
            if (selectedRegion.value) {
                filteredDB.value = ServersDB.value.filter((server) => server.regionId == selectedRegion.value);
            } else {
                filteredDB.value = [];
            }
        }

        function handleFileUpload(event) {
            const selectedFile = event.target.files[0];
            const validExtensions = ['.xlsx', '.dat', '.txt'];

            // Comprobar la extensión del archivo
            const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.'));
            if (validExtensions.includes(fileExtension)) {
                file.value = selectedFile;
                fileUploadMessage.value = ""; // Limpiar mensaje si el archivo es válido
            } else {
                file.value = null; // Restablecer archivo
                showError("Only .xlsx, .dat, and .txt files are allowed."); // Mensaje de advertencia
            }
        }



        //Metodo para reciclar pines por archivo 
        async function uploadFile() {
            if (!file.value || !ticketNumber.value || !authorizedBy.value || !selectedServerDB.value) {
                showError("Please complete all fields.");
                return;
            }

            const formData = new FormData();
            formData.append("file", file.value);
            formData.append("serverId", selectedServerDB.value);
            formData.append("Authorization", authorizedBy.value);
            formData.append("ticket", ticketNumber.value);

            // Mostrar el diálogo de carga
            showLoading();

            try {
                const response = await axios.post('/api/pins/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.data.recycledPins && response.data.failedPins && response.data.errorMessages) {
                    // Mapea los PINs reciclados
                    updatedPins.value = response.data.recycledPins.map(pin => ({ pinId: pin, status: 'Pin recycled successfully' }));

                    // Mapea los PINs fallidos y sus errores correspondientes
                    nonUpdatedPins.value = response.data.failedPins.map((pinId, index) => ({
                        pinId: pinId.trim(),  // Elimina espacios en blanco si es necesario
                        status: 'Failed',
                        errors: response.data.errorMessages[index] || 'Error desconocido'
                    }));
                } else {
                    showError("La respuesta no contiene 'recycledPins' o 'failedPins'");
                }

                // Cierra el modal
                modalVisible.value = false;

            } catch (error) {
                showError('Error uploading file: ' + error.message);
            } finally {
                hideLoading();  // Ocultar el diálogo de carga
            }
        }


        //Metdodo para poner pines en  quarentena 
        async function uploadFileQuarantine() {
            if (!file.value || !ticketNumber.value || !authorizedBy.value || !selectedServerDB.value) {
                showError("Please complete all fields.");
                return;
            }

            const formData = new FormData();
            formData.append("file", file.value);
            formData.append("serverId", selectedServerDB.value);
            formData.append("Authorization", authorizedBy.value);
            formData.append("ticket", ticketNumber.value);

            // Mostrar el diálogo de carga
            showLoading();

            try {
                const response = await axios.post('/api/quarantine/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                // Adaptar los datos a un formato adecuado para las tablas
                if (response.data.quarantinePins && response.data.failedPins && response.data.errorMessages) {
                    // Mapea los PINs reciclados
                    updatedPins.value = response.data.quarantinePins.map(pin => ({ pinId: pin, status: 'Pin moved to quarantine successfully ' }));

                    // Mapea los PINs fallidos y sus errores correspondientes
                    nonUpdatedPins.value = response.data.failedPins.map((pinId, index) => ({
                        pinId: pinId.trim(),  // Elimina espacios en blanco si es necesario
                        status: 'Failed',
                        errors: response.data.errorMessages[index] || 'Error desconocido'
                    }));
                } else {
                    showError("Response does not contain 'recycledPins' or 'failedPins'");
                }

                // Cierra el modal
                modalVisible.value = false;

            } catch (error) {
                showError('Error uploading file: ' + error.message);
            } finally {
                // Ocultar el diálogo de carga
                hideLoading();
            }
        }


        // Nueva función para abrir el modal
        function openUploadModal() {
            if (!selectedServerDB.value) {
                showError("You must select a server before uploading the file."); // Alerta si no se seleccionó un servidor
                return;
            }
            modalVisible.value = true; // Abrir el modal si se seleccionó un servidor
        }


        function showRecycleModal() {
            if (!selectedServerDB.value) {
                showError("You must select a server before selected Pins."); // Alerta si no se seleccionó un servidor
                return;
            }
            isRecycleModalVisible.value = true;

        }


        const onSelectionChange = (selection) => {
            selectedPinsForRecycle.value = selection;
            console.log("Selected Pins:", selectedPinsForRecycle.value);
        };

        watch(selectedPinsForRecycle, (newValue) => {
            console.log('Pins seleccionados:', newValue);
        });



        onMounted(async () => {
            await loadRegions();
            await loadServersDB();
        });

        watch(selectedRegion, filterServersByRegion);

        return {
            regions,
            ServersDB,
            selectedRegion,
            filteredDB,
            selectedServerDB,
            modalVisible,
            ticketNumber,
            authorizedBy,
            file,
            updatedPins,
            nonUpdatedPins,
            filterServersByRegion,
            handleFileUpload,
            uploadFile,
            showError,
            showLoading,
            hideLoading,
            isLoading,
            openUploadModal,
            toast,
            listPin,
            downloadExcel,
            recyclePins,
            excelPins,
            isRecycleModalVisible,
            showRecycleModal,
            selectedPin,
            selectedPinsForRecycle,
            consultedPins,
            pins,
            onSelectionChange,
            uploadFileQuarantine,
            quarantinePins,
            breadcrumbItems,
            showSuccess,
            errors,
            showErrorDetails,
            modalVisibleError,
            selectedError,
            confirmUpload,
            executeUpload,
            confirmVisible,
            uploadType,
            confirmationMessage,
            fileUploadMessage


        };
    },
};
</script>
<template>
    <div class="flex flex-col h-screen p-4">

        <div class="w-full card p-1 mb-4">
            <div class="header-container">
                <div class="title font-semibold text-xl ml-4">Recycling Pins Or Quarantine Pins</div>
                <div class="breadcrumb-section mr-2">
                    <Breadcrumb :model="breadcrumbItems" class="breadcrumb-item" />
                </div>
            </div>
        </div>

        <!-- Div para seleccionar la región -->
        <div class="w-full card p-4 flex flex-col gap-4 mb-6">
            <div class="font-semibold text-xl mb-4">Select Region</div>
            <label for="region" class="block text-sm font-medium mb-2">Region</label>
            <Dropdown id="region" v-model="selectedRegion" :options="regions" option-label="name" option-value="id"
                placeholder="Select Region" class="w-full" filter filterPlaceholder="Search Region"
                style="width: 30%;" />
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
                    <div v-if="filteredDB.length === 0" class="text-sm text-gray-500 mt-2">No servers found for the
                        selected region</div>
                </div>
            </div>
            <div class="flex justify-end mt-auto">
                <Button label="Upload File" icon="pi pi-cloud-upload" id="Boton1" @click="openUploadModal"
                    styleClass="p-button-sm mr-2" />
                <Button label="Selected Pins" icon="pi pi-check" id="Boton2" @click="showRecycleModal"
                    styleClass="p-button-sm" />
            </div>
        </div>

        <!-- Modal para subir archivo y otros detalles -->
        <Dialog v-model:visible="modalVisible" modal header="Recycled Or Quarantine Pins">
            <form @submit.prevent>
                <div class="flex gap-4">
                    <div class="flex flex-wrap gap-4">
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="ticketNumber" class="block mb-2">Ticket:</label>
                            <InputText id="ticketNumber" v-model="ticketNumber" class="input-with-line"
                                placeholder="Ticket Number" required />
                        </div>
                        <div class="flex flex-col grow basis-0 gap-2">
                            <label for="authorizedBy" class="block mb-2">Authorized By:</label>
                            <InputText id="authorizedBy" v-model="authorizedBy" class="input-with-line"
                                placeholder="Authorized By" required />
                        </div>
                    </div>
                    <div class="flex flex-col grow basis-0 gap-2">
                        <label for="fileUpload" class="block mb-2">Upload File:</label>
                        <input type="file" id="fileUpload" @change="handleFileUpload" class="p-inputtext-sm" />
                    </div>
                </div>

                <h5 class="mt-4">
                    The file must contain the following columns in the following order sku, Pin and controlNo
                    <br>
                    Only the following file types are allowed: <strong>.xlsx, .txt and .dat</strong>.
                </h5>

                <div class="flex justify-end mt-4">
                    <Button label="Recycled Pins" id="Boton1" icon="pi pi-sync" type="button"
                        @click.prevent="confirmUpload('recycled')" />
                    <Button label="Quarantine Pins" id="Boton2" icon="pi pi-exclamation-triangle" type="button"
                        @click.prevent="confirmUpload('quarantine')" />
                </div>
            </form>


        </Dialog>


        <!-- Modal de Confirmación -->
        <Dialog v-model:visible="confirmVisible" modal :style="{ width: '400px' }">
            <div class="text-center">

                <h3 class="text-2xl font-bold mb-2">Confirm Action</h3>
                <!-- Ícono de alerta centrado y más grande -->
                <i class="pi pi-exclamation-triangle text-red-500 mb-4" style="font-size: 4rem;"></i>


                <!-- Título centrado y destacado -->


                <!-- Mensaje de confirmación centrado debajo del título -->
                <div class="text-lg">{{ confirmationMessage }}</div>
            </div>

            <!-- Botones alineados a la derecha con espacio entre ellos -->
            <div class="flex justify-end mt-6 gap-3">
                <Button label="Yes" icon="pi pi-check" id="Boton1" @click.prevent="executeUpload" />
                <Button label="Cancel" icon="pi pi-times" id="Boton2" @click.prevent="confirmVisible = false" />

            </div>
        </Dialog>





        <Dialog v-model:visible="isRecycleModalVisible" modal :showHeader="true" header="Recycled Or Quarantine Pins"
            style="width: 800px;">
            <div class="p-4">
                <div class="mb-6">
                    <label for="pin" class="block font-semibold mb-1">PIN</label>
                    <div class="flex items-start gap-4">
                        <InputText id="pin" v-model="selectedPin" placeholder="Enter PIN"
                            class="w-3/4 input-with-line mr-4" />
                        <Button @click="listPin" label="Check Status" class="mt-0" id="Boton1" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <label for="ticket" class="block font-semibold mb-1">Ticket</label>
                        <InputText id="ticket" v-model="ticket" placeholder="Ticket" class="w-full input-with-line" />
                    </div>
                    <div>
                        <label for="approvedBy" class="block font-semibold mb-1">Approved By</label>
                        <InputText id="approvedBy" v-model="approvedBy" placeholder="Approved By"
                            class="w-full input-with-line" />
                    </div>
                </div>

                <DataTable :value="consultedPins" v-model:selection="selectedPinsForRecycle" selectionMode="multiple"
                    @selection-change="onSelectionChange">
                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                    <Column field="productId" header="productId/SKU"></Column>
                    <Column field="pin" header="pin"></Column>
                    <Column field="controlNo" header="ConrolNo"></Column>
                    <Column field="state" header="State"></Column>
                    <Column field="amount" header="Monto"></Column>

                </DataTable>

                <div class="flex justify-end space-x-4 mt-4">
                    <Button label="Excel" icon="pi pi-download" @click="downloadExcel" class="p-button-outlined" />
                    <Button label="Recycled Pins" id="Boton1" icon="pi pi-sync" type="button"
                        @click.prevent="confirmUpload('selRecycled')" />
                    <Button label="Quarantine Pins" id="Boton2" icon="pi pi-exclamation-triangle" type="button"
                        @click.prevent="confirmUpload('selQuarantine')" />
                </div>
            </div>
        </Dialog>



        <!-- Tabla de pines reciclados (actualizados) -->
        <div class="card p-4 mt-4">
            <h3 class="text-lg font-bold mb-4">Recycled Or Quarantine Pins</h3>
            <DataTable :value="updatedPins" class="p-datatable-sm" :paginator="true" rows="10"
                :rowsPerPageOptions="[5, 10, 20]" sortMode="multiple">
                <Column field="pinId" header="Pin ID" sortable />
                <Column field="status" header="Status" />
            </DataTable>
        </div>

        <!-- Tabla de pines fallidos (no actualizados) -->
        <div class="card p-4 mt-4">
            <h3>FAiled Pins</h3>
            <DataTable :value="nonUpdatedPins" class="p-datatable-sm" :paginator="true" rows="10"
                :rowsPerPageOptions="[5, 10, 20]" sortMode="multiple">
                <Column field="pinId" header="Pin ID" sortable />
                <Column header="Status">
                    <template #body="slotProps">
                        <span :class="{ 'text-red': slotProps.data.status === 'Failed' }">
                            {{ slotProps.data.status }}
                        </span>
                    </template>
                </Column>

                <!-- Columna que contiene el botón para ver detalles -->
                <Column header="Details">
                    <template #body="slotProps">
                        <Button label="Details" id="Boton1" icon="pi pi-eye"
                            @click="showErrorDetails(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="modalVisibleError" header="Detalles del Error">
            <p>{{ selectedError }}</p>
        </Dialog>

        <Dialog v-model:visible="isLoading" modal :dismissableMask="false" :showHeader="false" :closable="false"
            style="width: 20%; height: 30%; display: flex; align-items: center; justify-content: center">
            <div class="flex flex-col items-center justify-center">
                <ProgressSpinner />
                <p class="mt-4">Fetching data...</p>
            </div>
        </Dialog>

    </div>
</template>

<style>
.input-with-line {
    border: none !important;
    border-bottom: 1px solid #d1d5db !important;
    /* Línea de color gris claro */
    padding: 0.5rem 0.4rem;
    /* Ajustar el padding vertical */
    background: transparent;
    /* Fondo transparente */
    outline: none;
    /* Eliminar el borde de enfoque predeterminado */
    box-shadow: none;
    /* Eliminar la sombra del campo de entrada */
}


#Boton2 {
    background: #614d56;
    color: white;
    border-color: #614d56;
}

#Boton2:hover {
    background: white;
    color: #614d56;
    border-color: #614d56;
}

#Boton1 {
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

.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.text-red {
    color: red !important;
}
</style>
