<script setup>
import { onMounted, onUnmounted } from 'vue';
import { authService } from '@/services/AuthService';

const resetInactivityTimerHandler = () => {
    authService.resetInactivityTimer();
};

onMounted(() => {
    window.addEventListener('mousemove', resetInactivityTimerHandler);
    window.addEventListener('keydown', resetInactivityTimerHandler);
    authService.startInactivityTimer();
});

onUnmounted(() => {
    window.removeEventListener('mousemove', resetInactivityTimerHandler);
    window.removeEventListener('keydown', resetInactivityTimerHandler);
    authService.clearInactivityTimer();
});
</script>

<template>
  <router-view />
</template>
