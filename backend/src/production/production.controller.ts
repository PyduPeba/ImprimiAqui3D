import { Controller, Get, Post, Body, Param, Put, Delete, Logger } from '@nestjs/common';
import { ProductionService } from './production.service';
import { HomeAssistantService } from '../home-assistant/home-assistant.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('production')
export class ProductionController {
    private readonly logger = new Logger(ProductionController.name);

    constructor(
        private readonly productionService: ProductionService,
        private readonly homeAssistantService: HomeAssistantService,
        private readonly notificationsService: NotificationsService,
    ) {
        this.logger.log('ProductionController initialized');
    }

    @Get('telemetry')
    async getPrintersTelemetry() {
        await this.productionService.syncWithHA();
        return this.homeAssistantService.getPrinters();
    }

    @Get('queue')
    getQueue() {
        return this.productionService.getQueue();
    }

    @Get('alerts')
    async getProductionAlerts() {
        return this.notificationsService.findProductionAlerts(10);
    }

    // Maintenance Logs (Moved up for clarity)
    @Get('maintenance')
    findAllMaintenanceLogs() {
        this.logger.log('GET /production/maintenance');
        return this.productionService.findAllMaintenanceLogs();
    }

    @Get('maintenance/printer/:printerId')
    findMaintenanceLogsByPrinter(@Param('printerId') printerId: string) {
        return this.productionService.findMaintenanceLogsByPrinter(printerId);
    }

    @Post('maintenance')
    createMaintenanceLog(@Body() data: any) {
        return this.productionService.createMaintenanceLog(data);
    }

    // Printer Management
    @Get('printers')
    findAllPrinters() {
        return this.productionService.findAllPrinters();
    }

    @Get('printers/:id')
    findPrinterById(@Param('id') id: string) {
        return this.productionService.findPrinterById(id);
    }

    @Post('printers')
    createPrinter(@Body() data: any) {
        return this.productionService.createPrinter(data);
    }

    @Put('printers/:id')
    updatePrinter(@Param('id') id: string, @Body() data: any) {
        return this.productionService.updatePrinter(id, data);
    }

    @Delete('printers/:id')
    deletePrinter(@Param('id') id: string) {
        return this.productionService.deletePrinter(id);
    }

    @Post('printers/:id/command')
    sendPrinterCommand(@Param('id') id: string, @Body() body: { command: 'pause' | 'resume' | 'abort' }) {
        return this.productionService.sendPrinterCommand(id, body.command);
    }
}
