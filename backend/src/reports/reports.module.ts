import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Sale } from '../sales/entities/sale.entity';
import { PrintJob } from '../production/entities/print-job.entity';
import { Material } from '../inventory/entities/material.entity';
import { MaterialMovement } from '../inventory/entities/material-movement.entity';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, PrintJob, Material, MaterialMovement]),
    InventoryModule
  ],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule { }
