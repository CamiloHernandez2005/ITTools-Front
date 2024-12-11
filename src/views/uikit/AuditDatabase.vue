<script>
import { AuditDatabaseService } from '@/services/AuditDatabaseService';
import dayjs from 'dayjs';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { FilterMatchMode } from '@primevue/core/api';

export default {
  components: {
    DataTable,
    Column,
    Dialog,
    InputText,
    Button,
  },
  data() {
    return {
      audits: [],
      searchQuery: '',
      sortOrder: 'desc',
      sortColumn: 'dateRecycling',
      filterAuditDatabase: {
        username: { value: null, matchMode: FilterMatchMode.CONTAINS },
        pin: { value: null, matchMode: FilterMatchMode.CONTAINS },
        filename: { value: null, matchMode: FilterMatchMode.CONTAINS },
        ticket: { value: null, matchMode: FilterMatchMode.CONTAINS },
        sku: { value: null, matchMode: FilterMatchMode.CONTAINS },
        controlNo: { value: null, matchMode: FilterMatchMode.CONTAINS },
        statusPinBefore: { value: null, matchMode: FilterMatchMode.CONTAINS },
        statusPinAfter: { value: null, matchMode: FilterMatchMode.CONTAINS },
        descriptionError: { value: null, matchMode: FilterMatchMode.CONTAINS },
        authorizationFor: { value: null, matchMode: FilterMatchMode.CONTAINS },
        recycleDate: { value: null, matchMode: FilterMatchMode.BETWEEN },
      },
      columnOptions: [
        { field: 'username', header: 'User name', visible: true },
        { field: 'pin', header: 'Pin', visible: true },
        { field: 'filename', header: 'File name', visible: true },
        { field: 'ticket', header: 'Ticket', visible: true },
        { field: 'controlNo', header: 'Control No', visible: true },
        { field: 'statusPinBefore', header: 'Status pin before', visible: true },
        { field: 'statusPinAfter', header: 'Status pin after', visible: true },
        { field: 'descriptionError', header: 'Description error', visible: true },
        { field: 'authorizationFor', header: 'Authorization For', visible: true },
        { field: 'recycleDate', header: 'Recycle date', visible: true }
      ],
      selectedColumns: ['pin', 'filename', 'username'],
      home: {
        label: 'Home',
        icon: 'pi pi-home',
        url: '/homeusers'
      },
      items: [
        {
          label: 'Database',
          icon: 'pi pi pi-database',
          route: { name: 'Database' }
        },
        {
          icon: 'pi pi-fw pi-database',
          label: 'Audit database',
          route: { name: 'AuditDatabase' }
        }
      ]
    };
  },
  computed: {
    filteredAudits() {
      let sortedAudits = this.audits.slice().sort((a, b) => {
        let valueA, valueB;

        if (this.sortColumn === 'dateRecycling') {
          valueA = dayjs(a.dateRecycling);
          valueB = dayjs(b.dateRecycling);
        } else {
          valueA = a[this.sortColumn]?.toString().toLowerCase();
          valueB = b[this.sortColumn]?.toString().toLowerCase();
        }

        return this.sortOrder === 'asc' ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
      });

      return sortedAudits.filter((audit) => {
        const formattedDateTime = this.formatDateTime(audit.dateRecycling);

        const matchesSearchQuery =
          audit.username?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          audit.pin?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          audit.filename?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          audit.ticket?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          audit.sku?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          audit.controlNo?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          audit.statusPinBefore?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          audit.statusPinAfter?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          audit.descriptionError?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          formattedDateTime.toLowerCase().includes(this.searchQuery.toLowerCase());

        return matchesSearchQuery;
      });
    },

    columnsToShow() {
      return this.columnOptions.filter(column =>
        this.selectedColumns.includes(column.field)
      );
    }
  },

  async created() {
    this.audits = await AuditDatabaseService.getAllAuditsDatabase();
  },

  methods: {
    formatDateTime(value) {
      return value ? dayjs(value).format('DD/MMM/YYYY HH:mm:ss') : '';
    },
    clearFilter() {
      this.searchQuery = '';  // Limpia la búsqueda global
      Object.keys(this.filterAuditDatabase).forEach((key) => {
        this.filterAuditDatabase[key].value = null;  // Limpia los filtros individuales
      });
    }
  }
};
</script>


<template>
  <div class="flex flex-col grid p-4">
    <!-- Contenedor de la DataTable -->
    <div class="flex-2">
      <div class="card p-6 flex flex-col gap-2 h-full shadow-custom border">

        <div class="header-container">
          <div class="title font-semibold text-xl">Audits database</div>
          <Breadcrumb :home="home" :model="items" />
        </div>
        <!-- Contenedor de búsqueda alineado a la derecha -->


        <DataTable 
  :value="filteredAudits" 
  class="p-datatable-sm" 
  :paginator="true" 
  :rows="10" 
  :rowHover="true"
  :rowsPerPageOptions="[5, 10, 20]" 
  :totalRecords="audits.length" 
  sortMode="multiple"
  v-model:filters="filterAuditDatabase" 
  filterDisplay="menu"
  :global-filter-fields="columnsToShow.map(column => column.field)"
>
  <!-- Template del encabezado -->
  <template #header>
    <div class="flex justify-between items-center flex-wrap gap-2">
       <!-- Selector de columnas -->
       <div class="flex items-center gap-2">
        <label for="column-select" class="font-medium">Select columns:</label>
        <MultiSelect 
          v-model="selectedColumns" 
          :options="columnOptions" 
          optionLabel="header" 
          optionValue="field"
          display="chip" 
          placeholder="Select columns" 
        />
      </div>
      <!-- Filtro global -->
      <div class="flex items-center gap-2">
        <InputText 
          v-model="searchQuery" 
          placeholder="Global search..." 
          class="p-inputtext p-component" 
        />
        <Button 
          type="button" 
          icon="pi pi-filter-slash" 
          label="Clear" 
          outlined 
          @click="clearFilter()" 
        />
      </div>

     
    </div>
  </template>

  <!-- Configuración de columnas -->
  <Column 
    v-for="column in columnsToShow" 
    :key="column.field" 
    :field="column.field" 
    :header="column.header"
    sortable 
    :showFilterMatchModes="false"
  >
    <!-- Personalización del cuerpo para la columna recycleDate -->
    <template v-if="column.field === 'recycleDate'" #body="{ data }">
      {{ formatDateTime(data.recycleDate) }}
    </template>

    <!-- Filtro para las columnas -->
    <template #filter="{ filterModel }">
      <InputText 
        v-model="filterModel.value" 
        :placeholder="'Search by data'" 
      />
    </template>
  </Column>

  <template #empty>
    No audits found.
  </template>
</DataTable>

      </div>
    </div>
  </div>
</template>
<style>
.shadow-custom {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  /* Opcional: redondear bordes */
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -1rem;
}
</style>
