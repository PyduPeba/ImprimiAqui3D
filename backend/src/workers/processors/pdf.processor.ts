import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PdfService } from '../../pdf/pdf.service';
import { DataSource } from 'typeorm';
import { Sale } from '../../sales/entities/sale.entity';
import { Store } from '../../system-config/entities/store.entity';
import * as fs from 'fs';
import * as path from 'path';

@Processor('pdf-generation')
export class PdfProcessor {
    private readonly logger = new Logger(PdfProcessor.name);

    constructor(
        private readonly pdfService: PdfService,
        private readonly dataSource: DataSource,
    ) { }

    @Process('generate-receipt')
    async handleReceiptGeneration(job: Job) {
        this.logger.log(`Generating receipt for sale: ${job.data.saleId}`);
        // Implementation for receipt... (can be similar)
        return { url: `/uploads/receipts/${job.data.saleId}.pdf` };
    }

    @Process('generate-quotation')
    async handleQuotationGeneration(job: Job) {
        const saleId = job.data.saleId;
        this.logger.log(`Generating quotation for sale: ${saleId}`);

        try {
            const saleRepo = this.dataSource.getRepository(Sale);
            const storeRepo = this.dataSource.getRepository(Store);

            const sale = await saleRepo.findOne({
                where: { id: saleId },
                relations: ['customer', 'items', 'items.material', 'items.printer', 'items.accessories', 'items.accessories.accessory'],
            });

            if (!sale) {
                this.logger.error(`Sale not found: ${saleId}`);
                throw new Error('Sale not found');
            }

            const store = sale.storeId
                ? await storeRepo.findOne({ where: { id: sale.storeId } })
                : null;

            const html = await this.pdfService.generateQuoteHtml(sale, store?.settings);
            const buffer = await this.pdfService.generatePdf(html);

            const uploadDir = path.resolve('./uploads/quotations');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, `${saleId}.pdf`);
            fs.writeFileSync(filePath, buffer);

            this.logger.log(`Quotation generated: ${filePath}`);
            return { url: `/uploads/quotations/${saleId}.pdf` };
        } catch (error) {
            this.logger.error(`Failed to generate quotation for ${saleId}`, error);
            throw error;
        }
    }
}
