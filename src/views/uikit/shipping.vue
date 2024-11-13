<script>
import { BackupService } from '@/services/BackupService';
import dayjs from 'dayjs';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import Dialog from 'primevue/dialog';

export default {
    components: {
        DataTable,
        Column,
        Button,
        ProgressSpinner,
        Dialog
    },
    data() {
        return {
            backups: [], // Almacena la información de respaldo
            searchQuery: '', // Búsqueda global
            sortOrder: 'desc', // Orden descendente
            sortColumn: 'lastBackupDate', // Columna de ordenación
            isLoading: false // Controla la visibilidad del diálogo de carga
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
                    backup.primaryServer.toLowerCase().includes(this.searchQuery.toLowerCase());

                return matchesSearchQuery;
            });
        }
    },
    methods: {
        async fetchBackupInfo() {
            this.isLoading = true; // Mostrar el diálogo de carga
            try {
                this.backups = await BackupService.getAllBackupInfo();
            } catch (error) {
                console.error("Error fetching backup info:", error);
            } finally {
                this.isLoading = false; // Ocultar el diálogo de carga
            }
        },
        clearFilter() {
            this.searchQuery = '';
        },
        formatDateTime(value) {
            return value ? dayjs(value).format('DD/MMM/YYYY HH:mm:ss') : '';
        }
    }
};
</script>

<template>
    <div class="flex flex-col min-h-screen">
        <div class="card p-4 flex flex-col gap-2 h-full shadow-custom border">
            <div class="header-container ">
                <div class="title font-semibold text-xl">Log Shipping</div>
                <!-- Botón para cargar la información de respaldo -->
                <Button label="Load Information" id="boton1" icon="pi pi-refresh" @click="fetchBackupInfo" />
            </div>
            <DataTable :value="filteredBackups" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]"
                dataKey="id" :rowHover="true">
                <Column field="region" header="Region" sortable />
                <Column field="ip" header="IP" sortable />
                <Column field="primaryServer" header="Primary Server" sortable />
                <Column field="secondaryServer" header="Secondary Server" sortable />
                <Column field="primaryDatabase" header="Primary Database" sortable />
                <Column field="lastBackupDate" header="Last Backup Date" sortable>
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.lastBackupDate) }}
                    </template>
                </Column>
                <Column field="lastCopiedDate" header="Last Copied Date" sortable>
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.lastCopiedDate) }}
                    </template>
                </Column>
                <Column field="lastRestoredDate" header="Last Restored Date" sortable>
                    <template #body="slotProps">
                        {{ formatDateTime(slotProps.data.lastRestoredDate) }}
                    </template>
                </Column>
                <Column field="status" header="Status" sortable />
            </DataTable>

            <!-- Dialog de carga -->
            <Dialog v-model:visible="isLoading" modal :dismissableMask="false" :showHeader="false" :closable="false"
                style="width: 20%; height: 30%; display: flex; align-items: center; justify-content: center">
                <div class="flex flex-col items-center justify-center">
                    <ProgressSpinner />
                    <p class="mt-4">Searching for data...</p>
                </div>
            </Dialog>
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

#boton1 {
    background: #64c4ac;
    color: white;
    border-color: #64c4ac;
    margin-right: 1em;
}

#boton1:hover {
    background: white;
    color: #64c4ac;
    border-color: #64c4ac;
}
.header-container{
    margin-top: 2em;
}
</style>
