const PrinterClient = require('./moonraker-client');

const printerIP = '192.168.18.216';
const port = 8080; // CC2 Default

async function testConnection() {
    console.log(`--- Testando conexão com a impressora CC2: ${printerIP} (Porta ${port}) ---`);
    
    const client = new PrinterClient(printerIP, port);
    const status = await client.getPrinterStatus();

    if (status) {
        console.log('✅ Conectado com sucesso!');
        console.log('Status:', status);
    } else {
        console.log('❌ Falha ao conectar. Verifique se o IP está correto e a impressora está ligada.');
    }
}

testConnection();
