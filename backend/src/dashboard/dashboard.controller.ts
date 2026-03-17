import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { HomeAssistantService } from '../home-assistant/home-assistant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(
        private readonly dashboardService: DashboardService,
        private readonly haService: HomeAssistantService
    ) { }

    @Get('printers')
    async getPrinters() {
        return this.haService.getPrinters();
    }

    @Get('overview')
    async getOverview() {
        try {
            return await this.dashboardService.getOverviewMetrics();
        } catch (error) {
            console.error('Error in getOverview:', error);
            throw error;
        }
    }

    @Get('revenue-chart')
    async getRevenueChart(@Query('days') days?: string) {
        const daysNum = days ? parseInt(days) : 30;
        return this.dashboardService.getRevenueChart(daysNum);
    }

    @Get('sales-status')
    async getSalesByStatus() {
        return this.dashboardService.getSalesByStatus();
    }

    @Get('top-products')
    async getTopProducts(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit) : 5;
        return this.dashboardService.getTopProducts(limitNum);
    }

    @Get('top-materials')
    async getTopMaterials(@Query('limit') limit?: string) {
        try {
            const limitNum = limit ? parseInt(limit) : 5;
            return await this.dashboardService.getTopMaterials(limitNum);
        } catch (error) {
            console.error('Error in getTopMaterials:', error);
            throw error;
        }
    }

    @Get('recent-sales')
    async getRecentSales(@Query('limit') limit?: string) {
        try {
            const limitNum = limit ? parseInt(limit) : 5;
            return await this.dashboardService.getRecentSales(limitNum);
        } catch (error) {
            console.error('Error in getRecentSales:', error);
            throw error;
        }
    }

    @Get('stock-alerts')
    async getStockAlerts() {
        return this.dashboardService.getStockAlerts();
    }

    @Get('modeling-requests')
    async getActiveModelingRequests() {
        return this.dashboardService.getActiveModelingRequests();
    }
}
