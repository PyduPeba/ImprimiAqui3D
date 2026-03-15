import api from '../lib/api';

export const salesService = {
    async getDashboardStats() {
        const response = await api.get('/reports/dashboard');
        return response.data;
    },

    async createQuotation(data: any) {
        const response = await api.post('/sales/quotation', data);
        return response.data;
    },

    async getSale(id: string) {
        const response = await api.get(`/sales/${id}`);
        return response.data;
    },

    async confirmSale(id: string, paymentData: any) {
        const response = await api.post(`/sales/${id}/confirm`, paymentData);
        return response.data;
    },

    async cancelSale(id: string) {
        const response = await api.post(`/sales/${id}/cancel`);
        return response.data;
    },

    async addPayment(saleId: string, paymentData: any) {
        const response = await api.post(`/sales/${saleId}/payment`, paymentData);
        return response.data;
    },

    async getRecentSales() {
        const response = await api.get('/sales');
        return response.data;
    },

    async getSales(filters: any = {}) {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.status) params.append('status', filters.status);
        if (filters.customerId) params.append('customerId', filters.customerId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const response = await api.get(`/sales?${params.toString()}`);
        return response.data;
    },
};
