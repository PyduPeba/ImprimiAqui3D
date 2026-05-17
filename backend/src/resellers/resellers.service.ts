import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Reseller } from './entities/reseller.entity';
import { ResellerInventory } from './entities/reseller-inventory.entity';
import { Product } from '../catalog/entities/product.entity';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class ResellersService {
    constructor(
        @InjectRepository(Reseller)
        private resellerRepo: Repository<Reseller>,
        @InjectRepository(ResellerInventory)
        private inventoryRepo: Repository<ResellerInventory>,
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
        private systemConfigService: SystemConfigService,
    ) {}

    // ─────────────────────────────────────────
    // CRUD Revendedores
    // ─────────────────────────────────────────

    async findAll() {
        return this.resellerRepo.find({ order: { name: 'ASC' } });
    }

    async findOne(id: string) {
        const reseller = await this.resellerRepo.findOne({ where: { id } });
        if (!reseller) throw new NotFoundException('Revendedor não encontrado');
        return reseller;
    }

    async create(data: any, user: any) {
        const { id, ...rest } = data;
        if (rest.defaultCommissionPercent !== undefined)
            rest.defaultCommissionPercent = Number(rest.defaultCommissionPercent);

        const reseller = this.resellerRepo.create(rest);
        const saved = await this.resellerRepo.save(reseller);

        await this.systemConfigService.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'CREATE',
            entityType: 'Reseller',
            entityId: saved.id,
            newValue: saved,
        });

        return saved;
    }

    async update(id: string, data: any, user: any) {
        const reseller = await this.findOne(id);
        const old = { ...reseller };
        const { id: _, ...rest } = data;
        if (rest.defaultCommissionPercent !== undefined)
            rest.defaultCommissionPercent = Number(rest.defaultCommissionPercent);
        Object.assign(reseller, rest);
        const saved = await this.resellerRepo.save(reseller);

        await this.systemConfigService.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'UPDATE',
            entityType: 'Reseller',
            entityId: id,
            oldValue: old,
            newValue: saved,
        });

        return saved;
    }

    async deactivate(id: string, user: any) {
        const reseller = await this.findOne(id);
        reseller.isActive = false;
        await this.resellerRepo.save(reseller);
        await this.systemConfigService.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'DELETE',
            entityType: 'Reseller',
            entityId: id,
            oldValue: reseller,
        });
        return { success: true };
    }

    // ─────────────────────────────────────────
    // Inventário do Revendedor
    // ─────────────────────────────────────────

    async getInventory(resellerId: string) {
        return this.inventoryRepo.find({
            where: { reseller: { id: resellerId } },
            relations: ['product', 'product.category', 'product.defaultMaterial'],
            order: { createdAt: 'DESC' },
        });
    }

    async sendProduct(resellerId: string, data: any, user: any) {
        const reseller = await this.findOne(resellerId);
        const product = await this.productRepo.findOne({ where: { id: data.productId } });
        if (!product) throw new NotFoundException('Produto não encontrado');

        // Resolve a % de comissão: prioridade: override do envio > padrão revendedor > padrão produto
        const commissionPercent =
            data.commissionPercent !== undefined && data.commissionPercent !== null
                ? Number(data.commissionPercent)
                : reseller.defaultCommissionPercent || product.commissionPercent || 0;

        const item = this.inventoryRepo.create({
            reseller,
            product,
            quantitySent: Number(data.quantitySent) || 0,
            quantitySold: 0,
            quantityReturned: 0,
            unitPrice: Number(data.unitPrice) || 0,
            commissionPercent,
            sentAt: new Date(),
            notes: data.notes || null,
        });

        const saved = await this.inventoryRepo.save(item);

        await this.systemConfigService.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'CREATE',
            entityType: 'ResellerInventory',
            entityId: saved.id,
            newValue: saved,
        });

        return saved;
    }

    async updateInventoryItem(resellerId: string, itemId: string, data: any, user: any) {
        const item = await this.inventoryRepo.findOne({
            where: { id: itemId, reseller: { id: resellerId } },
            relations: ['reseller', 'product'],
        });
        if (!item) throw new NotFoundException('Item de inventário não encontrado');
        const old = { ...item };

        if (data.quantitySold !== undefined) item.quantitySold = Number(data.quantitySold);
        if (data.quantityReturned !== undefined) item.quantityReturned = Number(data.quantityReturned);
        if (data.unitPrice !== undefined) item.unitPrice = Number(data.unitPrice);
        if (data.commissionPercent !== undefined) item.commissionPercent = Number(data.commissionPercent);
        if (data.notes !== undefined) item.notes = data.notes;

        const saved = await this.inventoryRepo.save(item);

        await this.systemConfigService.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'UPDATE',
            entityType: 'ResellerInventory',
            entityId: itemId,
            oldValue: old,
            newValue: saved,
        });

        return saved;
    }

    async removeInventoryItem(resellerId: string, itemId: string, user: any) {
        const item = await this.inventoryRepo.findOne({
            where: { id: itemId, reseller: { id: resellerId } },
        });
        if (!item) throw new NotFoundException('Item não encontrado');
        await this.inventoryRepo.remove(item);
        await this.systemConfigService.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'DELETE',
            entityType: 'ResellerInventory',
            entityId: itemId,
            oldValue: item,
        });
        return { success: true };
    }

    // ─────────────────────────────────────────
    // Resumos e Relatórios
    // ─────────────────────────────────────────

    async getResellerSummary(id: string) {
        const reseller = await this.findOne(id);
        const inventory = await this.getInventory(id);

        let totalSent = 0;
        let totalSold = 0;
        let totalReturned = 0;
        let totalInPossession = 0;
        let totalCommission = 0;
        let totalSalesValue = 0;

        const items = inventory.map((item) => {
            const inPossession = item.quantitySent - item.quantitySold - item.quantityReturned;
            const commPct = Number(item.commissionPercent) || Number(reseller.defaultCommissionPercent) || 0;
            const commissionValue = item.quantitySold * Number(item.unitPrice) * (commPct / 100);
            const salesValue = item.quantitySold * Number(item.unitPrice);

            totalSent += item.quantitySent;
            totalSold += item.quantitySold;
            totalReturned += item.quantityReturned;
            totalInPossession += inPossession;
            totalCommission += commissionValue;
            totalSalesValue += salesValue;

            return {
                ...item,
                inPossession,
                commissionValue,
                salesValue,
                effectiveCommissionPercent: commPct,
            };
        });

        return {
            reseller,
            items,
            totals: {
                totalSent,
                totalSold,
                totalReturned,
                totalInPossession,
                totalCommission,
                totalSalesValue,
            },
        };
    }

    async getAllResellersSummary() {
        const resellers = await this.resellerRepo.find({ order: { name: 'ASC' } });

        const summaries = await Promise.all(
            resellers.map(async (reseller) => {
                const inventory = await this.getInventory(reseller.id);
                let totalInPossession = 0;
                let totalSold = 0;
                let totalCommission = 0;

                inventory.forEach((item) => {
                    const inPossession = item.quantitySent - item.quantitySold - item.quantityReturned;
                    const commPct = Number(item.commissionPercent) || Number(reseller.defaultCommissionPercent) || 0;
                    const commissionValue = item.quantitySold * Number(item.unitPrice) * (commPct / 100);

                    totalInPossession += inPossession;
                    totalSold += item.quantitySold;
                    totalCommission += commissionValue;
                });

                return {
                    ...reseller,
                    totalInPossession,
                    totalSold,
                    totalCommission,
                    productCount: inventory.length,
                };
            }),
        );

        return summaries;
    }

    async getCommissionReport(resellerId: string | null, startDate?: string, endDate?: string) {
        const where: any = {};
        if (resellerId) where.reseller = { id: resellerId };
        if (startDate && endDate) {
            where.createdAt = Between(new Date(startDate), new Date(endDate));
        }

        const items = await this.inventoryRepo.find({
            where,
            relations: ['reseller', 'product', 'product.category'],
            order: { createdAt: 'DESC' },
        });

        const rows = items.map((item) => {
            const commPct = Number(item.commissionPercent) || Number(item.reseller?.defaultCommissionPercent) || 0;
            const commissionValue = item.quantitySold * Number(item.unitPrice) * (commPct / 100);
            const salesValue = item.quantitySold * Number(item.unitPrice);

            return {
                resellerName: item.reseller?.name,
                resellerId: item.reseller?.id,
                productName: item.product?.name,
                productSku: item.product?.sku,
                categoryName: item.product?.category?.name,
                quantitySent: item.quantitySent,
                quantitySold: item.quantitySold,
                quantityReturned: item.quantityReturned,
                quantityInPossession: item.quantitySent - item.quantitySold - item.quantityReturned,
                unitPrice: item.unitPrice,
                commissionPercent: commPct,
                commissionValue,
                salesValue,
                sentAt: item.sentAt,
                notes: item.notes,
            };
        });

        const totalCommission = rows.reduce((acc, r) => acc + r.commissionValue, 0);
        const totalSales = rows.reduce((acc, r) => acc + r.salesValue, 0);

        return { rows, totalCommission, totalSales };
    }
}
