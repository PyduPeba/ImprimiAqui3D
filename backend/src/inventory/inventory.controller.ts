import { Controller, Get, Post, Body, UseGuards, Param, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get()
    async getInventory() {
        return this.inventoryService.getInventory();
    }

    @Post()
    async createMaterial(@Body() data: any, @Request() req: any) {
        return this.inventoryService.createMaterial(data, req.user);
    }

    @Post(':id')
    async updateMaterial(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        try {
            return await this.inventoryService.updateMaterial(id, data, req.user);
        } catch (error) {
            console.error('[InventoryController] Update error:', error);
            throw error; // Let Nest handle it, but console.error will go to Docker logs
        }
    }

    @Get('movements')
    async getMovements(@Body('materialId') materialId?: string) {
        return this.inventoryService.getMovements(materialId);
    }

    @Post(':id/add')
    async addStock(@Param('id') id: string, @Body() body: { amount: number, reason: string }, @Request() req: any) {
        return this.inventoryService.addStock(id, body.amount, body.reason, req.user);
    }

    @Post(':id/remove')
    async removeStock(@Param('id') id: string, @Body() body: { amount: number, reason: string }, @Request() req: any) {
        return this.inventoryService.removeStock(id, body.amount, body.reason, req.user);
    }
}
