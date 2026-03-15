import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { PricingService } from './pricing.service';
import { SalesController } from './sales.controller';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Payment } from './entities/payment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { WorkersModule } from '../workers/workers.module';
import { PdfModule } from '../pdf/pdf.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InventoryModule } from '../inventory/inventory.module';

import { SystemConfigModule } from '../system-config/system-config.module';
import { AccessoriesModule } from '../accessories/accessories.module';
import { Printer } from '../production/entities/printer.entity';
import { Material } from '../inventory/entities/material.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, Payment, Customer, Printer, Material]),
    SystemConfigModule,
    WorkersModule,
    PdfModule,
    NotificationsModule,
    InventoryModule,
    AccessoriesModule,
  ],
  providers: [SalesService, PricingService],
  controllers: [SalesController],
  exports: [SalesService, PricingService],
})
export class SalesModule { }
