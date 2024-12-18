<script>
import axios from 'axios'; // Asegúrate de importar Axios
import dayjs from 'dayjs';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
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
            backups: [], // Almacena la información de respaldo
            searchQuery: '', // Búsqueda global
            sortOrder: 'desc', // Orden descendente
            sortColumn: 'runDate', // Columna de ordenación
            failedJobs: [], // Almacena trabajos fallidos
            home: {
                label: 'Home',
                icon: 'pi pi-home',
                url: '/homeusers'
            },
            filters: {
                ip: { value: null, matchMode: FilterMatchMode.CONTAINS },
                jobName: { value: null, matchMode: FilterMatchMode.CONTAINS },
                serverName: { value: null, matchMode: FilterMatchMode.CONTAINS },
                stepID: { value: null, matchMode: FilterMatchMode.CONTAINS },
                stepName: { value: null, matchMode: FilterMatchMode.CONTAINS },
                message: { value: null, matchMode: FilterMatchMode.CONTAINS },
                runDate: { value: null, matchMode: FilterMatchMode.BETWEEN },
                runStatus: { value: null, matchMode: FilterMatchMode.CONTAINS },
                global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            },
            items: [
                {
                    icon: 'pi pi-database',
                    label: 'Database',
                    route: { name: 'Database' }
                },
                {
                    icon: 'pi pi-fw pi-times-circle',
                    label: 'Jobs Failed',
                    route: { name: 'JobsFailed' }
                },
            ]
        };
    },
    computed: {

        filteredFailedJobs() {
            let sortedFailedJobs = this.failedJobs.slice().sort((a, b) => {
                let valueA = a[this.sortColumn];
                let valueB = b[this.sortColumn];

                return this.sortOrder === 'asc' ? (valueA > valueB ? 1 : -1) : valueA < valueB ? 1 : -1;
            });

            return sortedFailedJobs.filter((job) => {
                const matchesSearchQuery =
                    (job.ip && job.ip.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                    (job.jobName && job.jobName.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                    (job.serverName && job.serverName.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                    (job.stepName && job.stepName.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                    (job.message && job.message.toLowerCase().includes(this.searchQuery.toLowerCase()));

                return matchesSearchQuery;
            });
        }
    },
    methods: {
        PDF() {


            const headers = [
                { text: 'IP', style: 'tableHeader' },
                { text: 'Job Name', style: 'tableHeader' },
                { text: 'Server Name', style: 'tableHeader' },
                { text: 'StepID', style: 'tableHeader' },
                { text: 'StepName', style: 'tableHeader' },
                { text: 'Message', style: 'tableHeader' },
                { text: 'RunDate', style: 'tableHeader' },
                { text: 'RunStatus', style: 'tableHeader' },
            ];

            const body = this.filteredFailedJobs.map(backup => [
                backup.ip || '-',
                backup.jobName || '-',
                backup.serverName || '-',
                backup.stepID || '-',
                backup.stepName || '-',
                backup.message || '-',
                this.formatDateTime(backup.runDate) || '-',
                backup.runStatus || '-',
            ]);

            body.unshift(headers); // Añade encabezados

            const docDefinition = {
                content: [
                    { text: 'Status JobsFailed Report', style: 'header' },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['auto', '*', 'auto', 'auto', 'auto', '*', 'auto', 'auto'],
                            body: body,
                        },
                    },
                ],
                styles: {
                    header: {
                        fontSize: 18,
                        bold: true,
                        margin: [0, 0, 0, 10],
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 12,
                        fillColor: '#eeeeee',
                    },
                },
            };

            pdfMake.createPdf(docDefinition).download('status_JobsFailed_report.pdf');
        },

        exportToExcel() {


            const data = this.filteredFailedJobs.map(backup => ({
                IP: backup.ip || '-',
                'Job Name': backup.serverName || '-',
                'Server Name': backup.daysLastBackup || '-',
                'StepID': backup.databaseName || '-',
                'StepName': backup.backupType || '-',
                'message': backup.backupType || '-',
                'Backup finish day': this.formatDateTime(backup.runDate) || '-',
                Status: backup.runStatus || '-',
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Status Backup');

            XLSX.writeFile(workbook, 'status_JobsFailed_report.xlsx');
        },
        clearFilter() {
            this.searchQuery = '';  // Limpia la búsqueda global
            Object.keys(this.filters).forEach((key) => {
                this.filters[key].value = null;  // Limpia los filtros individuales
            });
        },
        async fetchJobsFailed() {
            try {
                const response = await axios.get('/jobsFailed/status');
                this.failedJobs = response.data; // Asegúrate de tener 'failedJobs' en tu data
                console.log("Datos de trabajos fallidos obtenidos:", this.failedJobs);
            } catch (error) {
                console.error("Error fetching jobs failed:", error);
            }
        },
        clearFilter() {
            this.searchQuery = '';
        },
        formatDateTime(value) {
            return value ? dayjs(value).format('DD/MMM/YYYY HH:mm:ss') : '';
        }
    },
    mounted() {
        this.fetchJobsFailed(); // Llama al método para cargar trabajos fallidos automáticamente al montar el componente
    }
};
</script>

<template>
    <div class="flex flex-col grid p-4">
        <div class="card p-6 flex flex-col gap-2 h-full shadow-custom border">
            <div class="header-container">
                <div class="title font-semibold text-xl">Jobs Failed</div>
                <Breadcrumb :home="home" :model="items" />
                <!-- Botón eliminado -->
            </div>
            <DataTable :value="filteredFailedJobs" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]"
                dataKey="id" :rowHover="true" v-model:filters="filters" filterDisplay="menu">

                <div class="flex justify-between items-center flex-wrap gap-2">
                    <div class="flex gap-2">

                        <Button icon="pi pi-file-excel" class="p-button-success  icon-button2" @click="exportToExcel" />
                        <Button icon="pi pi-file-pdf" class="p-button-danger icon-button" @click="PDF" />
                    </div>
                    <div class="flex gap-2">
                        <InputText v-model="filters.global.value" placeholder="Global search..."
                            class="p-inputtext p-component" />
                        <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter" />
                    </div>
                </div>

                <Column field="ip" header="IP" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="jobName" header="Job name" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="serverName" header="Server name" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="stepID" header="Step ID" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="stepName" header="Step name" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="message" header="Message" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>

                <Column field="runDate" header="Run date" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.runDate) }}
                    </template>
                </Column>

                <Column field="runStatus" header="Run status" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
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
    background-color: white !important;
    /* Fondo blanco */
    border: 1px solid red !important;
    /* Borde rojo */
}

.icon-button .p-button-icon {
    color: red !important;
    /* Color del ícono rojo */
}

.icon-button2 {
    background-color: white !important;
    /* Fondo blanco */
    border: 1px solid rgb(10, 177, 10) !important;
    /* Borde rojo */
}

.icon-button2 .p-button-icon {
    color: rgb(8, 168, 8) !important;
    /* Color del ícono rojo */
}
</style>