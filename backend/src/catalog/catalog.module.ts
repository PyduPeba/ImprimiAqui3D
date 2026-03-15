import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Material } from '../inventory/entities/material.entity';
import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, Category, Material]),
        SystemConfigModule
    ],
    providers: [CatalogService],
    controllers: [CatalogController],
    exports: [CatalogService],
})
export class CatalogModule { }
