import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(
        private reportsService: ReportsService,
    ) { }

    @Get('sales')
    async getSalesReport(@Query() query: any) {
        return this.reportsService.getSalesReport(query);
    }

    @Get('inventory')
    async getInventoryReport(@Query() query: any) {
        return this.reportsService.getInventoryReport(query);
    }

    @Get('production')
    async getProductionReport(@Query() query: any) {
        return this.reportsService.getProductionReport(query);
    }
}
