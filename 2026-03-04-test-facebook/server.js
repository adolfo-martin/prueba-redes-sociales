const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const selfsigned = require('selfsigned');

const app = express();
const PORT = 3000;

const keyPath = path.join(__dirname, 'key.pem');
const certPath = path.join(__dirname, 'cert.pem');

let certs;

async function startServer() {
    try {
        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
            certs = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath)
            };
            console.log('Certificados cargados.');
        } else {
            console.log('Generando certificados SSL con selfsigned...');
            // Esta es la forma más básica de usar selfsigned
            const pems = await selfsigned.generate(null, { days: 365 });
            
            fs.writeFileSync(keyPath, pems.private);
            fs.writeFileSync(certPath, pems.cert);
            
            certs = { key: pems.private, cert: pems.cert };
        }

        app.use(express.static(__dirname));
        https.createServer(certs, app).listen(PORT, () => {
            console.log(`\n=========================================`);
            console.log(`SERVIDOR HTTPS: https://localhost:${PORT}`);
            console.log(`=========================================\n`);
        });
    } catch (e) {
        console.error('Error crítico al iniciar el servidor:', e.message);
        
        // Plan B: Servidor HTTP normal si HTTPS falla
        console.log('Iniciando servidor HTTP de respaldo...');
        app.listen(PORT, () => {
            console.log(`\n=========================================`);
            console.log(`SERVIDOR HTTP (Respaldo): http://localhost:${PORT}`);
            console.log(`=========================================\n`);
        });
    }
}

startServer();
