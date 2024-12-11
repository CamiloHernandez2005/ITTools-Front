<script>
import { AuditService } from '@/services/AuditService';
import dayjs from 'dayjs';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import { FilterMatchMode } from '@primevue/core/api';

export default {
    components: {
        DataTable,
        Column,
        Dialog,
        InputText,
        Button,
        Calendar,
        Dropdown
    },
    data() {
        return {
            audits: [], // Datos de auditorías
            searchQuery: '', // Query para búsqueda
            sortOrder: 'desc', // Ordenamiento (inicialmente descendente)
            sortColumn: 'dateTime', // Columna por la cual ordenar (fecha y hora)
            startDate: null, // Fecha de inicio para el filtro
            endDate: null, // Fecha de fin para el filtro
            selectedMethod: '', // Método seleccionado para el filtro
            methods: [
                { label: 'All', value: '' },
                { label: 'Create', value: 'Create' },
                { label: 'Update', value: 'Update' },
                { label: 'Delete', value: 'Delete' },
                { label: 'Download', value: 'Download' },
                { label: 'Get logs', value: 'Get logs in' },
                { label: 'Get archive logs', value: 'Get archive logs' },
                { label: 'Transaction search', value: 'Transaction search' }
            ],
            filters: {
                userName: { value: null, matchMode: FilterMatchMode.CONTAINS },
                userAction: { value: null, matchMode: FilterMatchMode.CONTAINS },
                userIP: { value: null, matchMode: FilterMatchMode.CONTAINS },
                dateTime: { value: null, matchMode: FilterMatchMode.BETWEEN }
            },
            home: {
                label: 'Home',
                icon: 'pi pi-home',
                url: '/homeusers'
            },
            items: [
                {
                    icon: 'pi pi-fw pi-chart-line',
                    label: 'Audits',
                    route: { name: 'Audit' }
                }
            ]
        };
    },
    computed: {
        filteredAudits() {
            let sortedAudits = this.audits.slice().sort((a, b) => {
                let valueA, valueB;

                if (this.sortColumn === 'dateTime') {
                    valueA = dayjs(a.dateTime);
                    valueB = dayjs(b.dateTime);
                } else {
                    valueA = a[this.sortColumn].toLowerCase();
                    valueB = b[this.sortColumn].toLowerCase();
                }

                return this.sortOrder === 'asc' ? (valueA > valueB ? 1 : -1) : valueA < valueB ? 1 : -1;
            });

            return sortedAudits.filter((audit) => {
                const formattedDateTime = this.formatDateTime(audit.dateTime);
                const auditDate = dayjs(audit.dateTime);

                // Filtro de búsqueda global
                const matchesSearchQuery =
                    audit.userName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    audit.userAction.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    formattedDateTime.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    audit.userIP.toLowerCase().includes(this.searchQuery.toLowerCase());

                // Filtro por rango de fechas
                const matchesDateRange =
                    (!this.startDate || auditDate.isAfter(dayjs(this.startDate).startOf('day'))) &&
                    (!this.endDate || auditDate.isBefore(dayjs(this.endDate).endOf('day'))) &&
                    (!this.filters.dateTime.value || auditDate.isSame(dayjs(this.filters.dateTime.value), 'day'));

                // Filtro por método
                const matchesMethod = !this.selectedMethod || audit.userAction.toLowerCase().includes(this.selectedMethod.toLowerCase());

                // Filtros por columna
                const matchesUserName = !this.filters.userName.value || audit.userName.toLowerCase().includes(this.filters.userName.value.toLowerCase());
                const matchesUserAction = !this.filters.userAction.value || audit.userAction.toLowerCase().includes(this.filters.userAction.value.toLowerCase());
                const matchesUserIP = !this.filters.userIP.value || audit.userIP.toLowerCase().includes(this.filters.userIP.value.toLowerCase());

                return matchesSearchQuery && matchesDateRange && matchesMethod && matchesUserName && matchesUserAction && matchesUserIP;
            });
        }
    },

    async created() {
        this.audits = await AuditService.getAllAudits();
    },
    methods: {
        clearFilter() {
            // Reinicia el filtro de búsqueda global y los filtros de fecha y método
            this.searchQuery = '';
            this.startDate = null;
            this.endDate = null;
            this.selectedMethod = '';

            // Limpia los filtros de columnas
            for (const key in this.filters) {
                if (this.filters[key]) {
                    this.filters[key].value = null;
                }
            }

            // Refresca el DataTable
            if (this.$refs.dataTable) {
                this.$refs.dataTable.reset();
            }
        },
        formatDateTime(value) {
            return value ? dayjs(value).format('DD/MMM/YYYY HH:mm:ss') : '';
        }
    }
};
</script>


<template>
    <div class="flex flex-col grid p-4">
        <div class="flex-2">
            <div class="card p-6 flex flex-col gap-2 h-full shadow-custom border">
                <div class="header-container">
                    <div class="title font-semibold text-xl">Audits</div>
                    <Breadcrumb :home="home" :model="items" />
                </div>
               

                <DataTable
                    ref="dataTable"
                    :value="filteredAudits"
                    class="p-datatable-sm"
                    :paginator="true"
                    :rows="10"
                    :rowsPerPageOptions="[5, 10, 20]"
                    :totalRecords="audits.length"
                    dataKey="id"
                    :rowHover="true"
                    v-model:filters="filters"
                    filterDisplay="menu"
                >
                <div class="flex justify-between items-center mb-2">
                    <div class="flex gap-2">
                        <Calendar v-model="startDate" placeholder="Start date" showIcon dateFormat="dd/mm/yy" />
                        <Calendar v-model="endDate" placeholder="End date" showIcon dateFormat="dd/mm/yy" />
                    </div>

                    <div>
                        <Dropdown v-model="selectedMethod" :options="methods" optionLabel="label" optionValue="value" placeholder="Categories" class="p-dropdown" :style="{ width: '300px' }" />
                    </div>
                    <div class="flex gap-2"><InputText v-model="searchQuery" placeholder="Global search..." class="p-inputtext p-component" /> <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter" /></div>
                </div>
                    <Column field="userName" header="User name" :showFilterMatchModes="false" sortable>
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by name" />
                        </template>
                    </Column>
                    <Column field="userAction" header="Action" :showFilterMatchModes="false" sortable>
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by action" />
                        </template>
                    </Column>
                    <Column field="dateTime" header="Date & time" :showFilterMatchModes="false" sortable>
                        <template #filter="{ filterModel }">
                            <Calendar v-model="filterModel.value" placeholder="Search by date" dateFormat="dd/mm/yy" />
                        </template>
                        <template #body="slotProps">
                            {{ formatDateTime(slotProps.data.dateTime) }}
                        </template>
                    </Column>
                    <Column field="userIP" header="User IP" :showFilterMatchModes="false" sortable>
                        <template #filter="{ filterModel }">
                            <InputText v-model="filterModel.value" type="text" placeholder="Search by ip" />
                        </template>
                    </Column>
                </DataTable>
            </div>
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
    border-radius: 8px; /* Opcional: redondear bordes */
}
</style>
