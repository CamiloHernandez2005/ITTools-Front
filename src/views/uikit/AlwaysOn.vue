<script>

import dayjs from 'dayjs';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import axios from 'axios';
import pdfMake from 'pdfmake/build/pdfmake';
import 'pdfmake/build/vfs_fonts';
import { FilterMatchMode } from '@primevue/core/api';
import * as XLSX from "xlsx";


export default {
    components: {
        DataTable,
        Column
    },
    data() {
        return {
            backups: [], // Almacena la información de AlwaysOn
            searchQuery: '', // Búsqueda global
            sortOrder: 'desc', // Orden descendente
            sortColumn: 'lastBackupDate', // Columna de ordenación
            home: {
                label: 'Home',
                icon: 'pi pi-home',
                url: '/homeusers'
            },
            filters: {
                availabilityGroupName: { value: null, matchMode: FilterMatchMode.CONTAINS },
                availabilityReplicaServerName: { value: null, matchMode: FilterMatchMode.CONTAINS },
                availabilityDatabaseName: { value: null, matchMode: FilterMatchMode.CONTAINS },
                replicaRole: { value: null, matchMode: FilterMatchMode.CONTAINS },
                availabilityMode: { value: null, matchMode: FilterMatchMode.CONTAINS },
                suspendReason: { value: null, matchMode: FilterMatchMode.CONTAINS },
                synchronizationState: { value: null, matchMode: FilterMatchMode.CONTAINS },
                lastRedoneTime: { value: null, matchMode: FilterMatchMode.BETWEEN },
                lastSentTime: { value: null, matchMode: FilterMatchMode.BETWEEN },
                lastCommitTime: { value: null, matchMode: FilterMatchMode.BETWEEN },
                global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            },
            items: [
                {
                    icon: 'pi pi-database',
                    label: 'Database',
                    route: { name: 'Database' }
                },
                {
                    icon: 'pi pi-fw p pi-check-circle',
                    label: 'AlwaysOn',
                    route: { name: 'AlwaysOn' }
                },
            ]
        };
    },
    computed: {
        filteredBackups() {
            let sortedBackups = this.backups.slice().sort((a, b) => {
                let valueA = a[this.sortColumn];
                let valueB = b[this.sortColumn];

                return this.sortOrder === 'asc' ? (valueA > valueB ? 1 : -1) : valueA < valueB ? 1 : -1;
            });

            return sortedBackups.filter((backup) => {
                const matchesSearchQuery =
                    backup.availabilityDatabaseName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    backup.availabilityReplicaServerName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    backup.availabilityGroupName.toLowerCase().includes(this.searchQuery.toLowerCase());

                return matchesSearchQuery;
            });
        }
    },
    methods: {

        clearFilter() {
            this.searchQuery = '';  // Limpia la búsqueda global
            Object.keys(this.filters).forEach((key) => {
                this.filters[key].value = null;  // Limpia los filtros individuales
            });
        },
        async fetchAlwaysOn() {
            try {
                const response = await axios.get('/statusAlways/status');
                // Almacena los datos en la propiedad de estado correcta
                this.backups = response.data; // Cambiado a backups
                console.log("Datos de AlwaysOn obtenidos:", this.backups);
            } catch (error) {
                console.error("Error fetching AlwaysOn status:", error);
            }
        },
        clearFilter() {
            this.searchQuery = '';
        },
        formatDateTime(value) {
            return value ? dayjs(value).format('DD/MMM/YYYY HH:mm:ss') : '';
        },
        PDF() {
            const headers = [
                { text: 'Availability Group Name', style: 'tableHeader' },
                { text: 'Availability Replica Server Name', style: 'tableHeader' },
                { text: 'Availability Database Name', style: 'tableHeader' },
                { text: 'Replica Role', style: 'tableHeader' },
                { text: 'Availability Mode', style: 'tableHeader' },
                { text: 'SuspendReason', style: 'tableHeader' },
                { text: 'Synchronization State', style: 'tableHeader' },
                { text: 'Last Redone Time', style: 'tableHeader' },
                { text: 'Last Sent Time', style: 'tableHeader' },
                { text: 'Last Commit Time', style: 'tableHeader' },
            ];

            const body = this.filteredBackups.map(backup => [
                backup.availabilityGroupName || '-',
                backup.availabilityReplicaServerName || '-',
                backup.availabilityDatabaseName || '-',
                backup.replicaRole || '-',
                backup.availabilityMode || '-',
                backup.suspendReason || '-',
                backup.synchronizationState || '-',
                this.formatDateTime(backup.lastRedoneTime) || '-',
                this.formatDateTime(backup.lastSentTime) || '-',
                this.formatDateTime(backup.lastCommitTime) || '-',
            ]);

            body.unshift(headers); // Añade encabezados al inicio

            const docDefinition = {
                pageSize: 'A2',
                content: [
                    { text: 'Status Always On Report', style: 'header', alignment: 'center' }, // Centrar el encabezado
                    {
                        table: {
                            headerRows: 1,
                            widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto','auto'], // Ajusta los anchos de las columnas
                            body: body,
                        },
                        layout: {
                            fillColor(rowIndex, node, columnIndex) {
                                return (rowIndex === 0) ? '#eeeeee' : null; // Color de fondo solo para encabezados
                            }
                        }
                    }
                ],
                styles: {
                    header: {
                        fontSize: 18,
                        bold: true,
                        margin: [0, 0, 0, 10],
                        alignment: 'center'
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 12,
                        fillColor: '#eeeeee',
                        alignment: 'center'
                    },
                    tableCell: {
                        fontSize: 10,
                        margin: [5, 5, 5, 5],
                        alignment: 'center'
                    }
                }
            };


            pdfMake.createPdf(docDefinition).download('status_AlwaysOn_report.pdf');
        },
        exportToExcel() {


            const data = this.filteredBackups.map(backup => ({
                'Availability Group Name': backup.availabilityGroupName || '-',
                'Vailability Replica ServerName': backup.vailabilityReplicaServerName || '-',
                'Availability Database Name': backup.availabilityDatabaseName || '-',
                'ReplicaRole': backup.replicaRole || '-',
                'AvailabilityMode': backup.availabilityMode || '-',
                'SuspendReason': backup.suspendReason || '-',
                'SynchronizationState': backup.synchronizationState || '-',
                'LastRedoneTime': this.formatDateTime(backup.lastRedoneTime) || '-',
                'LastSentTime': this.formatDateTime(backup.lastSentTime) || '-',
                'LastCommitTime': this.formatDateTime(backup.lastCommitTime) || '-',

            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Status Backup');

            XLSX.writeFile(workbook, 'status_AlwaysOn_report.xlsx');
        }

    },
    mounted() {
        this.fetchAlwaysOn(); // Llama al método para cargar datos automáticamente al montar el componente
    }



};
</script>

<template>
    <div class="flex flex-col grid p-4">

        <div class="card p-6 flex flex-col gap-2 h-full shadow-custom border">
            <div class="header-container">
                <div class="title font-semibold text-xl">AlwaysOn</div>
                <Breadcrumb :home="home" :model="items" />
                <!-- Botón eliminado -->
            </div>
            <DataTable :value="filteredBackups" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]"
                dataKey="id" :rowHover="true" v-model:filters="filters" filterDisplay="menu">
                <div class="flex justify-between items-center flex-wrap gap-2">
                    <div class="flex gap-2">

                        <Button icon="pi pi-file-excel" class="p-button-success  icon-button2" 
                            @click="exportToExcel" />
                        <Button icon="pi pi-file-pdf" class="p-button-danger icon-button"  @click="PDF" />
                    </div>
                    <div class="flex gap-2">
                        <InputText v-model="filters.global.value" placeholder="Global search..."
                            class="p-inputtext p-component" />
                        <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter" />
                    </div>
                </div>
                <Column field="availabilityGroupName" header="Availability group name" sortable
                    :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="availabilityReplicaServerName" header="Availability replica server name" sortable
                    :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="availabilityDatabaseName" header="Availability database name" sortable
                    :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="replicaRole" header="Replica role" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="availabilityMode" header="Availability Mode" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="suspendReason" header="Suspend Reason" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="synchronizationState" header="Synchronization state" sortable
                    :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="lastRedoneTime" header="Last redone time" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.lastRedoneTime) }}
                    </template>
                </Column>
                <Column field="lastSentTime" header="Last sent time" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.lastSentTime) }}
                    </template>
                </Column>
                <Column field="lastCommitTime" header="Last commit time" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.lastCommitTime) }}
                    </template>
                </Column>
            </DataTable>


            <!-- El modal de carga ha sido eliminado -->
        </div>

    </div>
</template>

<style>
.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: -1rem;
}

.shadow-custom {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
}
.icon-button {
    background-color: white !important; /* Fondo blanco */
    border: 1px solid red !important; /* Borde rojo */
}

.icon-button .p-button-icon {
    color: red !important; /* Color del ícono rojo */
}
.icon-button2 {
    background-color: white !important; /* Fondo blanco */
    border: 1px solid rgb(10, 177, 10) !important; /* Borde rojo */
}

.icon-button2 .p-button-icon {
    color: rgb(8, 168, 8) !important; /* Color del ícono rojo */
}



</style>