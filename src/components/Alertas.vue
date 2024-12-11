<template>
    <Toast ref="toast"></Toast>
  </template>
  
  <script>
  import Toast from 'primevue/toast';
  
  export default {
    name: 'Alertas',
    methods: {
      showHelpMessage(message) {
        this.$refs.toast.add({
          severity: 'info',
          summary: 'Ayuda',
          detail: message,
          life: 3000
        });
      }
    },
    components: {
      Toast
    }
  };
  </script>
  