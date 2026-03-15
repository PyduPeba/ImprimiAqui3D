import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    @Get()
    findAll() {
        return this.catalogService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.catalogService.findOne(id);
    }

    @Post()
    create(@Body() data: any, @Request() req: any) {
        return this.catalogService.create(data, req.user);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.catalogService.update(id, data, req.user);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.catalogService.delete(id, req.user);
    }

    // Category endpoints
    @Get('categories/all')
    findAllCategories() {
        return this.catalogService.findAllCategories();
    }

    @Get('categories/:id')
    findCategory(@Param('id') id: string) {
        return this.catalogService.findCategory(id);
    }

    @Post('categories')
    createCategory(@Body() data: any, @Request() req: any) {
        return this.catalogService.createCategory(data, req.user);
    }

    @Put('categories/:id')
    updateCategory(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.catalogService.updateCategory(id, data, req.user);
    }

    @Delete('categories/:id')
    deleteCategory(@Param('id') id: string, @Request() req: any) {
        return this.catalogService.deleteCategory(id, req.user);
    }
}
