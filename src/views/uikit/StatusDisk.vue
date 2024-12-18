<script>
import axios from 'axios';
import * as XLSX from "xlsx";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button'; // Importamos el componente Button
import { FilterMatchMode } from '@primevue/core/api';
import pdfMake from 'pdfmake/build/pdfmake';
import 'pdfmake/build/vfs_fonts'; // Asegúrate de que esta línea esté presente


export default {
    components: {
        DataTable,
        Column,
        Button // Registramos el componente Button
    },
    data() {
        return {
            backups: [], // Almacena la información de respaldo
            searchQuery: '', // Búsqueda global
            sortOrder: 'desc', // Orden descendente
            sortColumn: 'lastBackupDate',// Columna de ordenación
            home: {
                label: 'Home',
                icon: 'pi pi-home',
                url: '/homeusers'
            },
            filters: {
                ip: { value: null, matchMode: FilterMatchMode.CONTAINS },
                serverName: { value: null, matchMode: FilterMatchMode.CONTAINS },
                disk: { value: null, matchMode: FilterMatchMode.CONTAINS },
                totalSpace: { value: null, matchMode: FilterMatchMode.CONTAINS },
                freeSpace: { value: null, matchMode: FilterMatchMode.CONTAINS },
                percentAvailable: { value: null, matchMode: FilterMatchMode.CONTAINS },
                region: { value: null, matchMode: FilterMatchMode.CONTAINS },
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
                    icon: 'pi pi-fw pi-desktop',
                    label: 'Status Disk',
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
                    backup.region.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    backup.ip.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    backup.serverName.toLowerCase().includes(this.searchQuery.toLowerCase());

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
        async fetchStatusDisk() {
            try {
                const response = await axios.get('/statusDisk/status');
                this.backups = response.data;
                console.log("Datos de estado del disco obtenidos:", this.backups);
            } catch (error) {
                console.error("Error fetching disk status:", error);
            }
        },
        PDF() {
            const headers = [
                { text: 'IP', style: 'tableHeader' },
                { text: 'Server Name', style: 'tableHeader' },
                { text: 'Disk', style: 'tableHeader' },
                { text: 'Total Space GB', style: 'tableHeader' },
                { text: 'Free Space GB', style: 'tableHeader' },
                { text: 'Percent Available', style: 'tableHeader' },
                { text: 'Region', style: 'tableHeader' },
                { text: 'Status', style: 'tableHeader' },
            ];

            const body = this.filteredBackups.map(backup => [
                backup.ip || '-',
                backup.serverName || '-',
                backup.disk || '-',
                backup.totalSpace || '-',
                backup.freeSpace || '-',
                backup.percentAvailable || '-',
                backup.region || '-',
                backup.status || '-',
            ]);

            body.unshift(headers);

            const docDefinition = {
                content: [
                    { text: 'Status Disk Report', style: 'header' },
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

            pdfMake.createPdf(docDefinition).download('status_disk_report.pdf');
        },
        exportToExcel() {
            const data = this.filteredBackups.map(backup => ({
                IP: backup.ip || '-',
                'Server Name': backup.serverName || '-',
                Disk: backup.disk || '-',
                'Total Space GB': backup.totalSpace || '-',
                'Free Space GB': backup.freeSpace || '-',
                'Percent Available': backup.percentAvailable || '-',
                Region: backup.region || '-',
                Status: backup.status || '-',
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Status Disk');

            XLSX.writeFile(workbook, 'status_disk_report.xlsx');
        }
    },

    mounted() {
        this.fetchStatusDisk();
    }
};
</script>


<template>
    <div class="flex flex-col grid p-4">
        <div class="card p-6 flex flex-col gap-2 h-full shadow-custom border">
            <div class="header-container">
                <div class="title font-semibold text-xl">Status Disk</div>
                <Breadcrumb :home="home" :model="items" />
            </div>

            <!-- Tabla de datos -->
            <DataTable :value="filteredBackups" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]"
                dataKey="id" :rowHover="true" class="p-datatable-sm" v-model:filters="filters" filterDisplay="menu"
                id="pdf">

                <div class="flex justify-between items-center flex-wrap gap-2">
                    <div class="flex gap-2">
                        <!-- Botón para descargar en Excel -->
                        <Button class="p-button-success  icon-button2" @click="exportToExcel" 
                            icon="pi pi-file-excel"  />
                        <!-- Botón para descargar en PDF -->
                        <Button class="p-button-danger icon-button" @click="PDF" 
                            icon="pi pi-file-pdf"  />
                    </div>


                    <div class="flex gap-2">
                        <InputText v-model="filters.global.value" placeholder="Global search..."
                            class="p-inputtext p-component" />
                        <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter" />
                    </div>

                </div>
                <Column field="ip" header="IP" :showFilterMatchModes="false" sortable>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="serverName" header="Server Name" :showFilterMatchModes="false" sortable>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" :showFilterMatchModes="false"
                            placeholder="Search..." />
                    </template>
                </Column>

                <Column field="disk" header="Disk" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="totalSpace" header="Total Space GB" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="freeSpace" header="Free Space GB" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="percentAvailable" header="Percent Available" :showFilterMatchModes="false" sortable>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="region" header="Region" sortable :showFilterMatchModes="false">
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

            <!-- Botones de exportación -->

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
