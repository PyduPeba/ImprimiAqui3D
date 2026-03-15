const http = require('http');
const net = require('net');

const printerIP = '192.168.18.216';

function testTCP(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('error', () => resolve(false));
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, printerIP);
    });
}

function testHTTP(port, path) {
    return new Promise((resolve) => {
        const options = {
            hostname: printerIP,
            port: port,
            path: path,
            method: 'GET',
            timeout: 2000
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: data.substring(0, 100) }));
        });
        req.on('error', (err) => resolve({ error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ error: 'Timeout' }); });
        req.end();
    });
}

async function run() {
    console.log(`--- Investigando CC2 Protocol em ${printerIP} ---`);
    
    // Testar portas abertas
    const p1883 = await testTCP(1883);
    console.log(`Porta 1883 (MQTT): ${p1883 ? '✅ ABERTA' : '❌ FECHADA'}`);
    
    const p8080 = await testTCP(8080);
    console.log(`Porta 8080 (HTTP): ${p8080 ? '✅ ABERTA' : '❌ FECHADA'}`);

    const p7125 = await testTCP(7125);
    console.log(`Porta 7125 (Moonraker): ${p7125 ? '✅ ABERTA' : '❌ FECHADA'}`);

    if (p8080) {
        console.log('\nTestando HTTP API na porta 8080...');
        const info = await testHTTP(8080, '/system/info?X-Token=123456');
        console.log(`API /system/info: ${JSON.stringify(info)}`);
        
        const files = await testHTTP(8080, '/files?storage_media=local&path=/&X-Token=123456');
        console.log(`API /files: ${JSON.stringify(files)}`);
    } else if (p7125) {
        console.log('\nTestando Moonraker na 7125...');
        const info = await testHTTP(7125, '/printer/info');
        console.log(`API /printer/info: ${JSON.stringify(info)}`);
    }

    console.log('\n--- Fim da investigação ---');
}

run();
