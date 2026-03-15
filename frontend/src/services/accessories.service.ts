import api from '../lib/api';

export const accessoriesService = {
    async getAccessories(category?: string) {
        const params = category ? `?category=${category}` : '';
        const response = await api.get(`/accessories${params}`);
        return response.data;
    },
    async getAccessory(id: string) {
        const response = await api.get(`/accessories/${id}`);
        return response.data;
    },
    async createAccessory(data: any) {
        const response = await api.post('/accessories', data);
        return response.data;
    },
    async updateAccessory(id: string, data: any) {
        const response = await api.put(`/accessories/${id}`, data);
        return response.data;
    },
    async deleteAccessory(id: string) {
        const response = await api.delete(`/accessories/${id}`);
        return response.data;
    },
    async updateStock(id: string, quantity: number) {
        const response = await api.put(`/accessories/${id}/stock`, { quantity });
        return response.data;
    },
    async getTopUsed() {
        const response = await api.get('/accessories/top-used');
        return response.data;
    },
};
