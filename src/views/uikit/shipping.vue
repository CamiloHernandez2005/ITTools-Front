<script>
import { LogShipping } from '@/services/LogShipping';
import dayjs from 'dayjs';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { FilterMatchMode } from '@primevue/core/api';
import pdfMake from 'pdfmake/build/pdfmake';
import 'pdfmake/build/vfs_fonts';
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
            sortColumn: 'lastBackupDate', // Columna de ordenación
            home: {
                label: 'Home',
                icon: 'pi pi-home',
                url: '/homeusers'
            },
            filters: {
                ip: { value: null, matchMode: FilterMatchMode.CONTAINS },
                primaryServer: { value: null, matchMode: FilterMatchMode.CONTAINS },
                secondaryServer: { value: null, matchMode: FilterMatchMode.CONTAINS },
                primaryDatabase: { value: null, matchMode: FilterMatchMode.CONTAINS },
                lastRestoredDate: { value: null, matchMode: FilterMatchMode.BETWEEN },
                region: { value: null, matchMode: FilterMatchMode.CONTAINS },
                lastBackupDate: { value: null, matchMode: FilterMatchMode.BETWEEN },
                lastCopiedDate: { value: null, matchMode: FilterMatchMode.BETWEEN },
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
                    icon: 'pi pi-fw  pi-bookmark',
                    label: 'Log Shipping',
                    route: { name: 'Shipping' }
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
                    (backup.region?.toLowerCase() || '').includes(this.searchQuery.toLowerCase()) ||
                    (backup.ip?.toLowerCase() || '').includes(this.searchQuery.toLowerCase()) ||
                    (backup.primaryServer?.toLowerCase() || '').includes(this.searchQuery.toLowerCase());

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
        async fetchBackupInfo() {
            try {
                this.backups = await LogShipping.getAllBackupInfo();
            } catch (error) {
                console.error("Error fetching backup info:", error);
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
                { text: 'IP', style: 'tableHeader' },
                { text: 'Primary Server', style: 'tableHeader' },
                { text: 'Secondary Server', style: 'tableHeader' },
                { text: 'Primary Database', style: 'tableHeader' },
                { text: 'Last Restored Date', style: 'tableHeader' },
                { text: 'Last Backup Date', style: 'tableHeader' },
                { text: 'Last Copied Date', style: 'tableHeader' },
                { text: 'Region', style: 'tableHeader' },
                { text: 'Status', style: 'tableHeader' },
            ];

            const body = this.filteredBackups.map(backup => [
                backup.ip || '-',
                backup.primaryServer || '-',
                backup.secondaryServer || '-',
                backup.primaryDatabase || '-',
                this.formatDateTime(backup.lastRestoredDate) || '-',
                this.formatDateTime(backup.lastBackupDate) || '-',
                this.formatDateTime(backup.lastCopiedDate) || '-',
                backup.region || '-',
                backup.status || '-',
            ]);

            body.unshift(headers);

            const docDefinition = {
                pageSize: 'A4', // Cambia el tamaño de la página a A3
                pageOrientation: 'landscape', // Orientación horizontal
                content: [
                    { text: 'Log Shipping Report', style: 'header', alignment: 'center' }, // Centrar el encabezado
                    {
                        table: {
                            headerRows: 1,
                            widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'], // Ajusta los anchos de las columnas
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

            // Crear el PDF y descargarlo
            pdfMake.createPdf(docDefinition).download('log_shipping_report.pdf');
        },
        exportToExcel() {
            const data = this.filteredBackups.map(backup => ({
                IP: backup.ip || '-',
                'Primary Server': backup.primaryServer || '-',
                'Secondary Server': backup.secondaryServer || '-',
                'Primary Database': backup.primaryDatabase || '-',
                'Last Restored Date': this.formatDateTime(backup.lastRestoredDate) || '-',
                'Last Backup Date': this.formatDateTime(backup.lastBackupDate) || '-',
                'Last Copied Date': this.formatDateTime(backup.lastCopiedDate) || '-',
                Region: backup.region || '-',
                Status: backup.status || '-',
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Log Shipping');

            XLSX.writeFile(workbook, 'log_shipping_report.xlsx');
        }

    },
    mounted() {
        this.fetchBackupInfo(); // Llama al método para cargar datos automáticamente al montar el componente
    }
};
</script>

<template>
    <div class="flex flex-col grid p-4">
        <div class="card p-6 flex flex-col gap-2 h-full shadow-custom border">
            <div class="header-container">
                <div class="title font-semibold text-xl">Log Shipping</div>
                <Breadcrumb :home="home" :model="items" />
                <!-- Botón eliminado -->
            </div>
            <DataTable :value="filteredBackups" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]"
                dataKey="id" :rowHover="true" v-model:filters="filters" filterDisplay="menu">
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
                <Column field="region" header="Region" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="ip" header="IP" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="primaryServer" header="Primary server" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="secondaryServer" header="Secondary server" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="primaryDatabase" header="Primary database" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                </Column>
                <Column field="lastRestoredDate" header="Last restored date" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.lastRestoredDate) }}
                    </template>
                </Column>
                <Column field="lastBackupDate" header="Last backup date" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.lastBackupDate) }}
                    </template>
                </Column>
                <Column field="lastCopiedDate" header="Last copied date" sortable :showFilterMatchModes="false">
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" placeholder="Search..." />
                    </template>
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.lastCopiedDate) }}
                    </template>
                </Column>
                <Column field="status" header="Status" sortable :showFilterMatchModes="false">
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