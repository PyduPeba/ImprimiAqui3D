import api from '../lib/api';

export const catalogService = {
    async getProducts() {
        const response = await api.get('/products');
        return response.data;
    },
    async createProduct(data: any) {
        const response = await api.post('/products', data);
        return response.data;
    },
    async updateProduct(id: string, data: any) {
        const response = await api.put(`/products/${id}`, data);
        return response.data;
    },
    async deleteProduct(id: string) {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },

    // Categories
    async getCategories() {
        const response = await api.get('/products/categories/all');
        return response.data;
    },
    async createCategory(data: any) {
        const response = await api.post('/products/categories', data);
        return response.data;
    },
    async updateCategory(id: string, data: any) {
        const response = await api.put(`/products/categories/${id}`, data);
        return response.data;
    },
    async deleteCategory(id: string) {
        const response = await api.delete(`/products/categories/${id}`);
        return response.data;
    },
};
