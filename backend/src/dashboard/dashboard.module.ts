import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Material } from '../inventory/entities/material.entity';
import { ModelingRequest } from '../modeling/entities/modeling-request.entity';
import { Customer } from '../customers/entities/customer.entity';
import { HomeAssistantModule } from '../home-assistant/home-assistant.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Sale, SaleItem, Material, ModelingRequest, Customer]),
        HomeAssistantModule,
    ],
    providers: [DashboardService],
    controllers: [DashboardController],
    exports: [DashboardService],
})
export class DashboardModule { }
