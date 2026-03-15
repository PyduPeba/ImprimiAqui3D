import api from '../lib/api';

export const inventoryService = {
    async getMaterials() {
        const response = await api.get('/inventory');
        return response.data;
    },
    async createMaterial(data: any) {
        const response = await api.post('/inventory', data);
        return response.data;
    },
    async updateMaterial(id: string, data: any) {
        const response = await api.post(`/inventory/${id}`, data);
        return response.data;
    },
    async addStock(id: string, amount: number, reason: string) {
        const response = await api.post(`/inventory/${id}/add`, { amount, reason });
        return response.data;
    },
    async removeStock(id: string, amount: number, reason: string) {
        const response = await api.post(`/inventory/${id}/remove`, { amount, reason });
        return response.data;
    },
    async getMovements(materialId?: string) {
        const response = await api.get('/inventory/movements', { params: { materialId } });
        return response.data;
    }
};
