import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResellersService } from './resellers.service';
import { ResellersController } from './resellers.controller';
import { Reseller } from './entities/reseller.entity';
import { ResellerInventory } from './entities/reseller-inventory.entity';
import { Product } from '../catalog/entities/product.entity';
import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Reseller, ResellerInventory, Product]),
        SystemConfigModule,
    ],
    providers: [ResellersService],
    controllers: [ResellersController],
    exports: [ResellersService],
})
export class ResellersModule {}
