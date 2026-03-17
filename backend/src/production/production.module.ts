import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { ProductionGateway } from './production.gateway';
import { Printer } from './entities/printer.entity';
import { PrintJob } from './entities/print-job.entity';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { HomeAssistantModule } from '../home-assistant/home-assistant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Printer, PrintJob, MaintenanceLog]),
    NotificationsModule,
    HomeAssistantModule,
  ],
  providers: [ProductionService, ProductionGateway],
  controllers: [ProductionController],
  exports: [ProductionService, ProductionGateway],
})
export class ProductionModule { }
