import { Controller, Post, Body, Get, Param, UseGuards, Request, Res, Query } from '@nestjs/common';
import * as express from 'express';
import { SalesService } from './sales.service';
import { PdfService } from '../pdf/pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentMethod } from './enums/sales.enums';
import { SystemConfigService } from '../system-config/system-config.service';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
    constructor(
        private readonly salesService: SalesService,
        private readonly pdfService: PdfService,
        private readonly systemConfigService: SystemConfigService,
    ) { }

    @Post('quotation')
    async createQuotation(@Body() data: any, @Request() req: any) {
        try {
            return await this.salesService.createQuotation({ ...data, storeId: req.user.storeId }, req.user.id);
        } catch (error) {
            console.error('Error in createQuotation:', error);
            throw error;
        }
    }

    @Post()
    async createSale(@Body() data: any, @Request() req: any) {
        try {
            // A sale is a quotation that starts as PAID or IN_PROGRESS
            return await this.salesService.createQuotation({ ...data, isDirectSale: true, storeId: req.user.storeId }, req.user.id);
        } catch (error) {
            console.error('Error in createSale:', error);
            throw error;
        }
    }

    @Get()
    async findAll(@Query() query: any) {
        return this.salesService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.salesService.findOne(id);
    }

    @Post(':id/payment')
    async addPayment(
        @Param('id') id: string,
        @Body() body: { method: PaymentMethod; amount: number },
    ) {
        return this.salesService.addPayment(id, body.method, body.amount);
    }

    @Post(':id/confirm')
    async confirmSale(
        @Param('id') id: string,
        @Body() body: any,
    ) {
        return this.salesService.confirmSale(id, body);
    }

    @Post(':id/cancel')
    async cancelSale(@Param('id') id: string) {
        return this.salesService.cancelSale(id);
    }

    @Post('quote/pdf')
    @UseGuards(JwtAuthGuard)
    async generateQuotePdf(@Body() quoteData: any, @Request() req: any, @Res() res: any) {
        try {
            const storeId = req.user.storeId;
            const settings = await this.systemConfigService.getStoreConfig(storeId);

            const html = await this.pdfService.generateQuoteHtml(quoteData, settings);

            res.set({
                'Content-Type': 'text/html; charset=utf-8',
            });

            res.send(html);
        } catch (error) {
            console.error('Error in generateQuotePdf:', error);
            res.status(500).send('Internal Server Error');
        }
    }
}
