<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { authService } from '@/services/AuthService';
import HelpModal from '@/components/Alertas.vue';

const helpModal = ref(null);

// Función para mostrar el mensaje de ayuda
const showHelpMessage = (message) => {
    if (helpModal.value) {
        helpModal.value.showHelp(message);
    }
};

// Escuchar el evento global showHelp
const showHelpListener = (message) => {
    console.log("Evento showHelp recibido: ", message);
    showHelpMessage(message);
};


// Resetear el temporizador de inactividad
const resetInactivityTimerHandler = () => {
    authService.resetInactivityTimer();
};

onMounted(() => {
    window.addEventListener('mousemove', resetInactivityTimerHandler);
    window.addEventListener('keydown', resetInactivityTimerHandler);
    authService.startInactivityTimer();

    // Escuchar el evento showHelp desde cualquier parte de la app
    window.addEventListener('showHelp', showHelpListener);
});

onUnmounted(() => {
    window.removeEventListener('mousemove', resetInactivityTimerHandler);
    window.removeEventListener('keydown', resetInactivityTimerHandler);
    authService.clearInactivityTimer();

    // Eliminar el listener de showHelp al desmontar
    window.removeEventListener('showHelp', showHelpListener);
});
</script>
<template>
  <router-view />
  <HelpModal ref="helpModal" />
</template>
