/**
 * CC2 / Moonraker API Client for fetching printer status
 * Uses native fetch available in Node.js 18+ / Electron
 */

class PrinterClient {
    constructor(host, port = 8080) {
        this.host = host;
        this.port = port;
        this.token = '123456'; // Default token for CC2
        this.isCC2 = port === 8080;
        this.baseUrl = `http://${host}:${port}`;
    }

    /**
     * Gets the current printer status including filename and progress
     * @returns {Promise<{state: string, filename: string, progress: number} | null>}
     */
    async getPrinterStatus() {
        if (this.isCC2) {
            return this.getCC2Status();
        } else {
            return this.getMoonrakerStatus();
        }
    }

    async getCC2Status() {
        try {
            const url = `${this.baseUrl}/system/info?X-Token=${this.token}`;
            const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
            
            if (!response.ok) {
                console.error(`CC2 API error: ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            const machine = data.machine_status || {};
            const task = data.print_task || {};
            
            // Map CC2 status codes to strings (based on printer-status-utils.js)
            const statusMap = {
                0: 'idle',
                1: 'printing',
                2: 'paused',
                16: 'completed',
                999: 'error'
            };

            return {
                state: statusMap[machine.code] || 'unknown',
                filename: task.filename || 'N/A',
                progress: task.progress || 0
            };
        } catch (error) {
            console.error(`Failed to fetch from CC2 (${this.host}):`, error.message);
            return null;
        }
    }

    async getMoonrakerStatus() {
        try {
            const url = `${this.baseUrl}/printer/objects/query?print_stats&display_status&virtual_sdcard`;
            const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
            
            if (!response.ok) {
                console.error(`Moonraker API error: ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            const status = data.result?.status;

            if (!status) return null;

            const printStats = status.print_stats || {};
            const displayStatus = status.display_status || {};
            
            let progress = printStats.progress || displayStatus.progress || 0;
            if (progress > 0 && progress <= 1) {
                progress = Math.round(progress * 100);
            }

            return {
                state: printStats.state || 'unknown',
                filename: printStats.filename || 'N/A',
                progress: progress
            };
        } catch (error) {
            console.error(`Failed to fetch from Moonraker (${this.host}):`, error.message);
            return null;
        }
    }
}

module.exports = PrinterClient;

