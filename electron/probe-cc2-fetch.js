async function probe() {
    const printerIP = '192.168.18.216';
    const baseUrl = `http://${printerIP}:8080`;
    const token = '123456';

    console.log(`--- Probing CC2 HTTP API: ${baseUrl} ---`);

    try {
        console.log('Testing /system/info...');
        const res = await fetch(`${baseUrl}/system/info?X-Token=${token}`, { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        console.log('✅ /system/info response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.log('❌ /system/info failed:', e.message);
    }

    try {
        console.log('Testing /printer/status (Guess)...');
        const res = await fetch(`${baseUrl}/printer/status?X-Token=${token}`, { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        console.log('✅ /printer/status response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.log('❌ /printer/status failed:', e.message);
    }

    console.log('--- End of Probe ---');
}

probe();
