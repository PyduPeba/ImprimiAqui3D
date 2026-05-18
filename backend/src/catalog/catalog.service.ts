import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
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

    // ─── Helpers ─────────────────────────────────────────

    /**
     * Calcula o custo de produção com base no peso e no material padrão.
     * Fator de energia/desgaste: 1.2 (configurável no futuro via SystemConfigService).
     */
    private calculateProductionCost(weightGrams: number, material: Material | null): number {
        if (!material || !material.pricePerGram) return 0;
        const energyFactor = 1.2;
        return Number(weightGrams) * Number(material.pricePerGram) * energyFactor;
    }

    private coerceProductFields(rest: any): void {
        // Valores default para campos não nulos caso venham undefined
        rest.weightGrams = rest.weightGrams !== undefined && rest.weightGrams !== '' ? Number(rest.weightGrams) : 0;
        rest.printTimeMinutes = rest.printTimeMinutes !== undefined && rest.printTimeMinutes !== '' ? Number(rest.printTimeMinutes) : 0;
        rest.stockQuantity = rest.stockQuantity !== undefined && rest.stockQuantity !== '' ? Number(rest.stockQuantity) : 0;
        
        if (rest.minStockAlert !== undefined && rest.minStockAlert !== null && rest.minStockAlert !== '')
            rest.minStockAlert = Number(rest.minStockAlert);
        else rest.minStockAlert = null;
        
        if (rest.commissionPercent !== undefined && rest.commissionPercent !== '') 
            rest.commissionPercent = Number(rest.commissionPercent);
        else rest.commissionPercent = 0;
        
        if (rest.salePrice !== undefined && rest.salePrice !== null && rest.salePrice !== '')
            rest.salePrice = Number(rest.salePrice);
        else delete rest.salePrice;
        
        if (rest.productionCost !== undefined && rest.productionCost !== null && rest.productionCost !== '')
            rest.productionCost = Number(rest.productionCost);
        else delete rest.productionCost;
        
        if (rest.fixedPrice !== undefined && rest.fixedPrice !== null && rest.fixedPrice !== '')
            rest.fixedPrice = Number(rest.fixedPrice);
        else delete rest.fixedPrice;

        // Evita erro de constraint unique no SKU vazio
        if (rest.sku === '') {
            rest.sku = null;
        }

        // Cores / Filamentos
        if (rest.isMultiColor !== undefined) rest.isMultiColor = Boolean(rest.isMultiColor);
        // materialColors is already a JSON array, no coercion needed
    }

    // ─── Produtos ─────────────────────────────────────────

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

    async findLowStock() {
        const products = await this.productRepository.find({
            relations: ['category'],
        });
        return products.filter(
            (p) => p.minStockAlert !== null && p.minStockAlert !== undefined && p.stockQuantity <= p.minStockAlert,
        );
    }

    async create(data: any, user: any) {
        console.log('CatalogService: Creating product', data);
        const { defaultMaterialId, categoryId, id, ...rest } = data;
        this.coerceProductFields(rest);

        const product = this.productRepository.create(rest as object) as Product;

        let material: Material | null = null;
        if (defaultMaterialId && typeof defaultMaterialId === 'string' && defaultMaterialId.length > 0) {
            try {
                material = await this.materialRepository.findOneBy({ id: defaultMaterialId });
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

        // Auto-calcular custo de produção se não foi passado manualmente
        if (!product.productionCostManualOverride || product.productionCost === undefined || product.productionCost === null) {
            product.productionCost = this.calculateProductionCost(product.weightGrams, material);
            product.productionCostManualOverride = false;
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
        this.coerceProductFields(rest);

        const product = await this.findOne(id);
        const oldProduct = JSON.parse(JSON.stringify(product));
        Object.assign(product, rest);

        let material: Material | null = product.defaultMaterial;

        if (defaultMaterialId && typeof defaultMaterialId === 'string' && defaultMaterialId.length > 0) {
            try {
                const foundMaterial = await this.materialRepository.findOneBy({ id: defaultMaterialId });
                if (foundMaterial) {
                    product.defaultMaterial = foundMaterial;
                    material = foundMaterial;
                }
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

        // Recalcular custo de produção se não for override manual
        if (!product.productionCostManualOverride) {
            product.productionCost = this.calculateProductionCost(product.weightGrams, material);
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

    // ─── Categorias ───────────────────────────────────────

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
