import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    UseGuards,
    Request,
    Query,
} from '@nestjs/common';
import { ResellersService } from './resellers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('resellers')
@UseGuards(JwtAuthGuard)
export class ResellersController {
    constructor(private readonly resellersService: ResellersService) {}

    // ─── Revendedores ───────────────────────────────────
    @Get()
    findAll() {
        return this.resellersService.findAll();
    }

    @Get('summary')
    getAllSummary() {
        return this.resellersService.getAllResellersSummary();
    }

    @Get('report')
    getCommissionReport(
        @Query('resellerId') resellerId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.resellersService.getCommissionReport(resellerId || null, startDate, endDate);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.resellersService.findOne(id);
    }

    @Get(':id/summary')
    getResellerSummary(@Param('id') id: string) {
        return this.resellersService.getResellerSummary(id);
    }

    @Post()
    create(@Body() data: any, @Request() req: any) {
        return this.resellersService.create(data, req.user);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.resellersService.update(id, data, req.user);
    }

    @Delete(':id')
    deactivate(@Param('id') id: string, @Request() req: any) {
        return this.resellersService.deactivate(id, req.user);
    }

    // ─── Inventário do Revendedor ───────────────────────
    @Get(':id/inventory')
    getInventory(@Param('id') id: string) {
        return this.resellersService.getInventory(id);
    }

    @Post(':id/inventory')
    sendProduct(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.resellersService.sendProduct(id, data, req.user);
    }

    @Put(':id/inventory/:itemId')
    updateInventoryItem(
        @Param('id') id: string,
        @Param('itemId') itemId: string,
        @Body() data: any,
        @Request() req: any,
    ) {
        return this.resellersService.updateInventoryItem(id, itemId, data, req.user);
    }

    @Delete(':id/inventory/:itemId')
    removeInventoryItem(
        @Param('id') id: string,
        @Param('itemId') itemId: string,
        @Request() req: any,
    ) {
        return this.resellersService.removeInventoryItem(id, itemId, req.user);
    }
}
