import api from '../lib/api';

export const resellersService = {
    // ─── Revendedores ───────────────────────────────────
    async getAll() {
        const response = await api.get('/resellers');
        return response.data;
    },

    async getAllSummary() {
        const response = await api.get('/resellers/summary');
        return response.data;
    },

    async getOne(id: string) {
        const response = await api.get(`/resellers/${id}`);
        return response.data;
    },

    async getSummary(id: string) {
        const response = await api.get(`/resellers/${id}/summary`);
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/resellers', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/resellers/${id}`, data);
        return response.data;
    },

    async deactivate(id: string) {
        const response = await api.delete(`/resellers/${id}`);
        return response.data;
    },

    // ─── Inventário ─────────────────────────────────────
    async getInventory(resellerId: string) {
        const response = await api.get(`/resellers/${resellerId}/inventory`);
        return response.data;
    },

    async sendProduct(resellerId: string, data: any) {
        const response = await api.post(`/resellers/${resellerId}/inventory`, data);
        return response.data;
    },

    async updateInventoryItem(resellerId: string, itemId: string, data: any) {
        const response = await api.put(`/resellers/${resellerId}/inventory/${itemId}`, data);
        return response.data;
    },

    async removeInventoryItem(resellerId: string, itemId: string) {
        const response = await api.delete(`/resellers/${resellerId}/inventory/${itemId}`);
        return response.data;
    },

    // ─── Relatório ──────────────────────────────────────
    async getCommissionReport(params?: { resellerId?: string; startDate?: string; endDate?: string }) {
        const response = await api.get('/resellers/report', { params });
        return response.data;
    },
};
