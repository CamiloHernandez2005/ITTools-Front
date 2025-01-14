const https = require('https');
const path = require('path');
const fs = require('fs');
const express = require('express');
const config = require('./config.json');  // Importa la configuración desde config.json

const app = express();
const port = config.frontendPort;  // Usa el puerto del archivo de configuración
// Ruta a los certificados SSL desde el archivo config.json
const options = {
  key: fs.readFileSync(config.https.key),
  cert: fs.readFileSync(config.https.cert)
};

// Servir la carpeta actual (./dist) estáticamente
app.use(express.static(__dirname));

// Redirigir todas las rutas no encontradas al index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Crear el servidor HTTPS usando la configuración de config.json
https.createServer(options, app).listen(port, config.host, () => {
  console.log(`Servidor HTTPS corriendo en https://${config.host}:${port}`);
});

