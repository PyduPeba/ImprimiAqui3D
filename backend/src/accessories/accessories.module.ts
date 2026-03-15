import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessoriesService } from './accessories.service';
import { AccessoriesController } from './accessories.controller';
import { Accessory } from './entities/accessory.entity';
import { SaleItemAccessory } from './entities/sale-item-accessory.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Accessory, SaleItemAccessory])],
    providers: [AccessoriesService],
    controllers: [AccessoriesController],
    exports: [AccessoriesService],
})
export class AccessoriesModule { }
