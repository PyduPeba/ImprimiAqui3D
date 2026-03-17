"use client";

import api from '../lib/api';

export const dashboardService = {
    async getOverview() {
        const response = await api.get('/dashboard/overview');
        return response.data;
    },
    async getRevenueChart(days: number = 30) {
        const response = await api.get(`/dashboard/revenue-chart?days=${days}`);
        return response.data;
    },
    async getSalesByStatus() {
        const response = await api.get('/dashboard/sales-status');
        return response.data;
    },
    async getTopProducts(limit: number = 5) {
        const response = await api.get(`/dashboard/top-products?limit=${limit}`);
        return response.data;
    },
    async getTopMaterials(limit: number = 5) {
        const response = await api.get(`/dashboard/top-materials?limit=${limit}`);
        return response.data;
    },
    async getRecentSales(limit: number = 5) {
        const response = await api.get(`/dashboard/recent-sales?limit=${limit}`);
        return response.data;
    },
    async getStockAlerts() {
        const response = await api.get('/dashboard/stock-alerts');
        return response.data;
    },
    async getActiveModelingRequests() {
        const response = await api.get('/dashboard/modeling-requests');
        return response.data;
    },
    async getPrinters() {
        const response = await api.get('/dashboard/printers');
        return response.data;
    },
};
