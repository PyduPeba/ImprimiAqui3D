import api from '../lib/api';

export const productionService = {
    async getPrinters() {
        const response = await api.get('/production/printers');
        return response.data;
    },
    async getPrintersTelemetry() {
        const response = await api.get('/production/telemetry');
        return response.data;
    },
    async getQueue() {
        const response = await api.get('/production/queue');
        return response.data;
    },
    async sendPrinterCommand(printerId: string, command: 'pause' | 'resume' | 'abort') {
        const response = await api.post(`/production/printers/${printerId}/command`, { command });
        return response.data;
    },
    async getProductionAlerts() {
        const response = await api.get('/production/alerts');
        return response.data;
    },
    async assignJob(jobId: string, printerId: string) {
        const response = await api.patch(`/production/jobs/${jobId}/assign`, { printerId });
        return response.data;
    },
    async updateJobStatus(jobId: string, status: string) {
        const response = await api.patch(`/production/jobs/${jobId}/status`, { status });
        return response.data;
    },
    async createPrinter(data: any) {
        const response = await api.post('/production/printers', data);
        return response.data;
    },
    async updatePrinter(id: string, data: any) {
        const response = await api.put(`/production/printers/${id}`, data);
        return response.data;
    },
    async deletePrinter(id: string) {
        const response = await api.delete(`/production/printers/${id}`);
        return response.data;
    },
    async getMaintenanceLogs() {
        const response = await api.get('/production/maintenance');
        return response.data;
    },
    async getMaintenanceLogsByPrinter(printerId: string) {
        const response = await api.get(`/production/maintenance/printer/${printerId}`);
        return response.data;
    },
    async createMaintenanceLog(data: any) {
        const response = await api.post('/production/maintenance', data);
        return response.data;
    },
    async clearHistory() {
        const response = await api.delete('/production/jobs/clear');
        return response.data;
    }
};
