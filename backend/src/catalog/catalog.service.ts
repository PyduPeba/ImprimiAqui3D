import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Material } from '../inventory/entities/material.entity';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class CatalogService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(Material)
        private materialRepository: Repository<Material>,
        private systemConfigService: SystemConfigService,
    ) { }

    async findAll() {
        return this.productRepository.find({ relations: ['defaultMaterial', 'category'] });
    }

    async findOne(id: string) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['defaultMaterial', 'category']
        });
        if (!product) throw new NotFoundException('Produto não encontrado');
        return product;
    }

    async create(data: any, user: any) {
        console.log('CatalogService: Creating product', data);
        const { defaultMaterialId, categoryId, id, ...rest } = data;

        // Coerção de campos numéricos
        if (rest.weightGrams !== undefined) rest.weightGrams = Number(rest.weightGrams);
        if (rest.printTimeMinutes !== undefined) rest.printTimeMinutes = Number(rest.printTimeMinutes);
        if (rest.fixedPrice !== undefined && rest.fixedPrice !== null && rest.fixedPrice !== '') {
            rest.fixedPrice = Number(rest.fixedPrice);
        } else {
            delete rest.fixedPrice;
        }

        const product = this.productRepository.create(rest as object) as Product;

        if (defaultMaterialId && typeof defaultMaterialId === 'string' && defaultMaterialId.length > 0) {
            try {
                const material = await this.materialRepository.findOneBy({ id: defaultMaterialId });
                if (material) product.defaultMaterial = material;
            } catch (err) {
                console.error('Error finding material:', err);
            }
        }

        if (categoryId && typeof categoryId === 'string' && categoryId.length > 0) {
            try {
                const category = await this.categoryRepository.findOneBy({ id: categoryId });
                if (category) product.category = category;
            } catch (err) {
                console.error('Error finding category:', err);
            }
        }

        const savedProduct = await this.productRepository.save(product);

        await this.systemConfigService.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'CREATE',
            entityType: 'Product',
            entityId: savedProduct.id,
            newValue: savedProduct
        });

        return savedProduct;
    }

    async update(id: string, data: any, user: any) {
        const { defaultMaterialId, categoryId, id: _, ...rest } = data;

        // Coerção de campos numéricos
        if (rest.weightGrams !== undefined) rest.weightGrams = Number(rest.weightGrams);
        if (rest.printTimeMinutes !== undefined) rest.printTimeMinutes = Number(rest.printTimeMinutes);
        if (rest.fixedPrice !== undefined && rest.fixedPrice !== null && rest.fixedPrice !== '') {
            rest.fixedPrice = Number(rest.fixedPrice);
        } else {
            delete rest.fixedPrice;
        }

        const product = await this.findOne(id);
        const oldProduct = JSON.parse(JSON.stringify(product)); // Deep copy to preserve values
        Object.assign(product, rest);

        if (defaultMaterialId && typeof defaultMaterialId === 'string' && defaultMaterialId.length > 0) {
            try {
                const material = await this.materialRepository.findOneBy({ id: defaultMaterialId });
                if (material) product.defaultMaterial = material;
            } catch (err) {
                console.error('Error finding material:', err);
            }
        }

        if (categoryId && typeof categoryId === 'string' && categoryId.length > 0) {
            try {
                const category = await this.categoryRepository.findOneBy({ id: categoryId });
                if (category) product.category = category;
            } catch (err) {
                console.error('Error finding category:', err);
            }
        }

        const savedProduct = await this.productRepository.save(product);

        await this.systemConfigService.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'UPDATE',
            entityType: 'Product',
            entityId: savedProduct.id,
            oldValue: oldProduct,
            newValue: savedProduct
        });

        return savedProduct;
    }

    async delete(id: string, user: any) {
        const product = await this.findOne(id);
        await this.systemConfigService.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'DELETE',
            entityType: 'Product',
            entityId: product.id,
            oldValue: product
        });
        return this.productRepository.remove(product);
    }

    // Category methods
    async findAllCategories() {
        return this.categoryRepository.find({ order: { name: 'ASC' } });
    }

    async findCategory(id: string) {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) throw new NotFoundException('Categoria não encontrada');
        return category;
    }

    async createCategory(data: any, user: any) {
        console.log('CatalogService: Creating category', data);
        const { id, ...rest } = data;
        if (rest.profitMargin !== undefined) rest.profitMargin = Number(rest.profitMargin);
        const category = this.categoryRepository.create(rest as object);
        const savedCategory = await this.categoryRepository.save(category);
        console.log('CatalogService: Category saved', savedCategory.id);

        await this.systemConfigService.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'CREATE',
            entityType: 'Category',
            entityId: savedCategory.id,
            newValue: savedCategory
        });

        return savedCategory;
    }

    async updateCategory(id: string, data: any, user: any) {
        const { id: _, ...rest } = data;
        if (rest.profitMargin !== undefined) rest.profitMargin = Number(rest.profitMargin);
        const oldCategory = await this.findCategory(id);
        await this.categoryRepository.update(id, rest);
        const updatedCategory = await this.findCategory(id);

        await this.systemConfigService.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'UPDATE',
            entityType: 'Category',
            entityId: id,
            oldValue: oldCategory,
            newValue: updatedCategory
        });

        return updatedCategory;
    }

    async deleteCategory(id: string, user: any) {
        const category = await this.findCategory(id);
        await this.systemConfigService.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'DELETE',
            entityType: 'Category',
            entityId: category.id,
            oldValue: category
        });
        return this.categoryRepository.remove(category);
    }
}
