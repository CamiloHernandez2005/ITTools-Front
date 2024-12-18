<script>
import dayjs from 'dayjs';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import axios from 'axios'; // Asegúrate de importar axios
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
            sortColumn: 'backupFinishDate', // Columna de ordenación
            home: {
                label: 'Home',
                icon: 'pi pi-home',
                url: '/homeusers'
            },
            filters: {
                ip: { value: null, matchMode: FilterMatchMode.CONTAINS },
                serverName: { value: null, matchMode: FilterMatchMode.CONTAINS },
                databaseName: { value: null, matchMode: FilterMatchMode.CONTAINS },
                backupType: { value: null, matchMode: FilterMatchMode.CONTAINS },
                daysLastBackup: { value: null, matchMode: FilterMatchMode.CONTAINS },
                backupFinishDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
                status: { value: null, matchMode: FilterMatchMode.CONTAINS },
                global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            },
            items: [
                {
                    icon: 'pi pi-database',
                    label: 'Database',
                    route: { name: 'Database' }
                },
                {
                    icon: 'pi pi-fw pi-refresh',
                    label: 'Status Backup',
                    route: { name: 'Status Disk' }
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
                    (backup.region && backup.region.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                    (backup.ip && backup.ip.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                    (backup.databaseName && backup.databaseName.toLowerCase().includes(this.searchQuery.toLowerCase()));

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

        async fetchStatusBackup() {
            try {
                const response = await axios.get('/statusBackup/status');
                this.backups = response.data; // Cambiado a backups
                console.log("Datos de estado de respaldo obtenidos:", this.backups);
            } catch (error) {
                console.error("Error fetching backup status:", error);
            }
        },

        formatDateTime(value) {
            return value ? dayjs(value).format('DD/MMM/YYYY HH:mm:ss') : '';
        },

        PDF() {
            if (!this.filteredBackups || this.filteredBackups.length === 0) {
                console.log("No hay datos para generar el reporte PDF");
                return;
            }

            const headers = [
                { text: 'IP', style: 'tableHeader' },
                { text: 'Server Name', style: 'tableHeader' },
                { text: 'Database Name', style: 'tableHeader' },
                { text: 'Backup Type', style: 'tableHeader' },
                { text: 'Days Last Backup', style: 'tableHeader' },
                { text: 'Backup Finish Date', style: 'tableHeader' },
                { text: 'Status', style: 'tableHeader' },
            ];

            const body = this.filteredBackups.map(backup => [
                backup.ip || '-',
                backup.serverName || '-',
                backup.databaseName || '-',
                backup.backupType || '-',
                backup.daysLastBackup || '-',
                this.formatDateTime(backup.backupFinishDate) || '-',
                backup.status || '-',
            ]);

            body.unshift(headers); // Añade encabezados

            const docDefinition = {
                content: [
                    { text: 'Status Backup Report', style: 'header' },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['auto', '*', 'auto', 'auto', 'auto', '*', 'auto'],
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

            pdfMake.createPdf(docDefinition).download('status_backup_report.pdf');
        },

        exportToExcel() {
            if (!this.filteredBackups || this.filteredBackups.length === 0) {
                console.log("No hay datos para exportar");
                return;
            }

            const data = this.filteredBackups.map(backup => ({
                IP: backup.ip || '-',
                'Server Name': backup.serverName || '-',
                'Days Last Backup': backup.daysLastBackup || '-',
                'Database Name': backup.databaseName || '-',
                'Backup Type': backup.backupType || '-',
                'Backup finish day': this.formatDateTime(backup.backupFinishDate) || '-',
                Status: backup.status || '-',
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Status Backup');

            XLSX.writeFile(workbook, 'status_Backup_report.xlsx');
        }
    },

    mounted() {
        this.fetchStatusBackup();
    }
};
</script>

<template>
    <div class="flex flex-col grid p-4">
        <div class="card p-6 flex flex-col gap-2 h-full shadow-custom border">
            <div class="header-container">
                <div class="title font-semibold text-xl">Status Backup</div>
                <Breadcrumb :home="home" :model="items" />
            </div>
            <DataTable 
                :value="filteredBackups" 
                :paginator="true" 
                :rows="10" 
                :rowsPerPageOptions="[5, 10, 20]"
                dataKey="id" 
                :rowHover="true"
                v-model:filters="filters"
                filterDisplay="menu">
                
                <div class="flex justify-between items-center flex-wrap gap-2">
                    <div class="flex gap-2">
               
               <Button icon="pi pi-file-excel"   class="p-button-success  icon-button2"   @click="exportToExcel" />
               <Button icon="pi pi-file-pdf"     class="p-button-danger icon-button"  @click="PDF" />
           </div>
                    <div class="flex gap-2">
                        <InputText v-model="filters.global.value" placeholder="Global search..." class="p-inputtext p-component" /> 
                        <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter" />
                    </div>
                </div>

                <Column field="ip" header="IP" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="databaseName" header="Database Name" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="serverName" header="Server Name" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="backupType" header="Backup Type" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="daysLastBackup" header="Days Last Backup" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="backupFinishDate" header="Backup Finish Date" sortable :showFilterMatchModes="false">
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.backupFinishDate) }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="status" header="Status" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>

            </DataTable>

           
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