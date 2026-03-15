import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PdfProcessor } from './processors/pdf.processor';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [
    PdfModule,
    BullModule.registerQueue({
      name: 'pdf-generation',
    }),
  ],
  providers: [PdfProcessor],
  exports: [BullModule],
})
export class WorkersModule { }
