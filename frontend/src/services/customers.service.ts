import api from '../lib/api';

export const customersService = {
    async getCustomers() {
        const response = await api.get('/customers');
        return response.data;
    },
    async getCustomer(id: string) {
        const response = await api.get(`/customers/${id}`);
        return response.data;
    },
    async createCustomer(data: any) {
        const response = await api.post('/customers', data);
        return response.data;
    },
    async updateCustomer(id: string, data: any) {
        const response = await api.put(`/customers/${id}`, data);
        return response.data;
    },
    async deleteCustomer(id: string) {
        const response = await api.delete(`/customers/${id}`);
        return response.data;
    }
};
