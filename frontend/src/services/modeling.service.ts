import api from '../lib/api';

export const modelingService = {
    async getRequests() {
        const response = await api.get('/modeling');
        return response.data;
    },
    async getRequest(id: string) {
        const response = await api.get(`/modeling/${id}`);
        return response.data;
    },
    async createRequest(data: any) {
        const response = await api.post('/modeling', data);
        return response.data;
    },
    async updateRequest(id: string, data: any) {
        const response = await api.put(`/modeling/${id}`, data);
        return response.data;
    },
    async updateStatus(id: string, status: string) {
        const response = await api.put(`/modeling/${id}/status`, { status });
        return response.data;
    },
    async deleteRequest(id: string) {
        const response = await api.delete(`/modeling/${id}`);
        return response.data;
    },
    async addComment(id: string, message: string) {
        const response = await api.post(`/modeling/${id}/comments`, { message });
        return response.data;
    },
    async addAttachment(id: string, fileData: any) {
        const response = await api.post(`/modeling/${id}/attachments`, fileData);
        return response.data;
    },
    async deleteAttachment(id: string) {
        const response = await api.delete(`/modeling/attachments/${id}`);
        return response.data;
    },
};
