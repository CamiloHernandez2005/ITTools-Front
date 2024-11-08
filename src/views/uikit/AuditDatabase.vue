<script>
import { AuditDatabaseService } from '@/services/AuditDatabaseService';
import dayjs from 'dayjs';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';

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
          audit.pin?.toLowerCase().includes(this.searchQuery.toLowerCase()) || // Filtrado por pin
          audit.filename?.toLowerCase().includes(this.searchQuery.toLowerCase()) || // Filtrado por filename
          audit.ticket?.toLowerCase().includes(this.searchQuery.toLowerCase()) || // Filtrado por ticket
          audit.sku?.toLowerCase().includes(this.searchQuery.toLowerCase()) || // Filtrado por SKU
          audit.controlNo?.toLowerCase().includes(this.searchQuery.toLowerCase()) || // Filtrado por ControlNo
          audit.statusPinBefore?.toLowerCase().includes(this.searchQuery.toLowerCase()) || // Filtrado por statusPinBefore
          audit.statusPinAfter?.toLowerCase().includes(this.searchQuery.toLowerCase()) || // Filtrado por statusPinAfter
          audit.descriptionError?.toLowerCase().includes(this.searchQuery.toLowerCase()) || // Filtrado por descriptionError
          formattedDateTime.toLowerCase().includes(this.searchQuery.toLowerCase());

        return matchesSearchQuery; // Solo se considera la búsqueda global
      });
    }
  },
  async created() {
    this.audits = await AuditDatabaseService.getAllAuditsDatabase();
  },
  methods: {
    formatDateTime(value) {
      return value ? dayjs(value).format('DD/MMM/YYYY HH:mm:ss') : '';
    }
  }
};
</script>

<template>
  <div class="flex flex-col h-screen p-4">
    <!-- Contenedor de la DataTable -->
    <div class="flex-2">
      <div class="card p-4 flex flex-col gap-4 h-full">
        <div class="font-semibold text-xl">Audits DataBase</div>

        <!-- Contenedor de búsqueda alineado a la derecha -->
        <div class="flex justify-end items-center mb-2">
          <InputText v-model="searchQuery" placeholder="Global search..." class="p-inputtext p-component" />
        </div>

        <DataTable :value="filteredAudits" class="p-datatable-sm" :paginator="true" :rows="10" :rowsPerPageOptions="[5, 10, 20]" :totalRecords="audits.length" sortMode="multiple">
          <Column field="filename" header="Filename" sortable />
          <Column field="pin" header="Pin" sortable />
          <Column field="ticket" header="Ticket" sortable />
          <Column field="authorizationFor" header="Authorization For" sortable />
          <Column field="username" header="User" sortable />
          <Column field="sku" header="Sku / ProductId" sortable />
          <Column field="controlNo" header="ControlNo" sortable />
          <Column field="statusPinBefore" header="Status Pin Before" sortable />
          <Column field="statusPinAfter" header="Status Pin After" sortable />
          <Column field="descriptionError" header="Description Error" sortable />
        </DataTable>
      </div>
    </div>
  </div>
</template>
