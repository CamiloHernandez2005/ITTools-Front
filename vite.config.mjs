import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vueJsx from '@vitejs/plugin-vue-jsx';
import fs from 'fs'; // Importar fs para leer archivos
import path from 'path'; // Para manejar rutas absolutas

// Cargar configuración desde un archivo config.json
const configPath = path.resolve('./config.json');
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};

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

    build: {
        target: 'esnext', // Esto habilita características más modernas como top-level await
    },

    server: {
        https: config.https ? {
            key: fs.readFileSync(config.https.key), // Ruta dinámica al archivo de clave privada
            cert: fs.readFileSync(config.https.cert), // Ruta dinámica al archivo del certificado
        } : false,
        host: config.host || '0.0.0.0', // Configuración dinámica del host
        port: config.frontendPort || 5173, // Puerto dinámico desde config.json
    },
});
