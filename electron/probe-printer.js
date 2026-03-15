const http = require('http');

const printerIP = '192.168.18.216';
const ports = [80, 7125, 3000, 8080];
const paths = ['/printer/info', '/printer/objects/query?print_stats', '/api/v1/printer/status'];

async function probe(port, path) {
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
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve({ port, path, success: true, status: res.statusCode, data: data.substring(0, 100) });
                } else {
                    resolve({ port, path, success: false, status: res.statusCode });
                }
            });
        });

        req.on('error', (err) => {
            resolve({ port, path, success: false, error: err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ port, path, success: false, error: 'Timeout' });
        });

        req.end();
    });
}

async function runProbes() {
    console.log(`--- Iniciando Probe em ${printerIP} ---`);
    for (const port of ports) {
        console.log(`Testando Porta ${port}...`);
        for (const path of paths) {
            const result = await probe(port, path);
            if (result.success) {
                console.log(`✅ PORTA ${port}${path} - SUCESSO!`);
                console.log(`   Resposta: ${result.data}...`);
            } else {
                // console.log(`❌ PORTA ${port}${path} - Falha: ${result.error || result.status}`);
            }
        }
    }
    console.log(`--- Fim do Probe ---`);
}

runProbes();
