import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vueJsx from '@vitejs/plugin-vue-jsx';
import fs from 'fs'; // Asegúrate de importar fs para leer los archivos

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        Components({
            resolvers: [PrimeVueResolver()],
        }),
        vueJsx(),
    ],

    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },

    server: {
        https: {
            key: fs.readFileSync('./src/components/unnametool.emida.net-key.pem'),
            cert: fs.readFileSync('./src/components/unnametool.emida.net.pem'),
        },
        host: '0.0.0.0', // Escuchar en todas las interfaces de red
        port: 5173, // Cambia el puerto si es necesario
    },
});
