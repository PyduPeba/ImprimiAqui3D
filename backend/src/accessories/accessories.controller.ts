import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AccessoriesService } from './accessories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accessories')
@UseGuards(JwtAuthGuard)
export class AccessoriesController {
    constructor(private readonly accessoriesService: AccessoriesService) { }

    @Get('top-used')
    getTopUsed() {
        return this.accessoriesService.getTopUsed();
    }

    @Get()
    findAll(@Query('category') category?: string) {
        if (category) {
            return this.accessoriesService.findByCategory(category);
        }
        return this.accessoriesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.accessoriesService.findOne(id);
    }

    @Post()
    create(@Body() data: any) {
        return this.accessoriesService.create(data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.accessoriesService.update(id, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.accessoriesService.delete(id);
    }

    @Put(':id/stock')
    updateStock(@Param('id') id: string, @Body('quantity') quantity: number) {
        return this.accessoriesService.updateStock(id, quantity);
    }
}
