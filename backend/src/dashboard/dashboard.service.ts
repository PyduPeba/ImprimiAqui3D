import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between, In } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Material } from '../inventory/entities/material.entity';
import { ModelingRequest } from '../modeling/entities/modeling-request.entity';
import { SaleStatus } from '../sales/enums/sales.enums';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Sale)
        private saleRepository: Repository<Sale>,
        @InjectRepository(SaleItem)
        private saleItemRepository: Repository<SaleItem>,
        @InjectRepository(Material)
        private materialRepository: Repository<Material>,
        @InjectRepository(ModelingRequest)
        private modelingRepository: Repository<ModelingRequest>,
    ) { }

    async getOverviewMetrics() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Sales this month
        const salesThisMonth = await this.saleRepository.count({
            where: {
                createdAt: MoreThan(startOfMonth),
                status: In([SaleStatus.CONFIRMED, SaleStatus.IN_PRODUCTION, SaleStatus.COMPLETED])
            },
        });

        // Sales last month
        const salesLastMonth = await this.saleRepository.count({
            where: {
                createdAt: Between(startOfLastMonth, endOfLastMonth),
                status: In([SaleStatus.CONFIRMED, SaleStatus.IN_PRODUCTION, SaleStatus.COMPLETED])
            },
        });

        // Revenue this month
        const salesThisMonthData = await this.saleRepository.find({
            where: {
                createdAt: MoreThan(startOfMonth),
                status: In([SaleStatus.CONFIRMED, SaleStatus.IN_PRODUCTION, SaleStatus.COMPLETED])
            },
        });
        const revenueThisMonth = salesThisMonthData.reduce((sum, sale) => sum + Number(sale.total), 0);

        // Revenue last month
        const salesLastMonthData = await this.saleRepository.find({
            where: {
                createdAt: Between(startOfLastMonth, endOfLastMonth),
                status: In([SaleStatus.CONFIRMED, SaleStatus.IN_PRODUCTION, SaleStatus.COMPLETED])
            },
        });
        const revenueLastMonth = salesLastMonthData.reduce((sum, sale) => sum + Number(sale.total), 0);

        // Orders in production
        const ordersInProduction = await this.saleRepository.count({
            where: { status: SaleStatus.IN_PRODUCTION },
        });

        // Low stock materials
        const materials = await this.materialRepository.find();
        const lowStockMaterials = materials.filter(
            m => Number(m.stockWeight) <= Number(m.minStockAlert)
        ).length;

        // Calculate percentages
        const salesChange = salesLastMonth > 0
            ? ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100
            : 0;

        const revenueChange = revenueLastMonth > 0
            ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
            : 0;

        return {
            salesThisMonth,
            salesChange: Math.round(salesChange),
            revenueThisMonth,
            revenueChange: Math.round(revenueChange),
            ordersInProduction,
            lowStockMaterials,
        };
    }

    async getRevenueChart(days: number = 30) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const sales = await this.saleRepository.find({
            where: { 
                createdAt: MoreThan(startDate),
                status: In([SaleStatus.CONFIRMED, SaleStatus.IN_PRODUCTION, SaleStatus.COMPLETED])
            },
            order: { createdAt: 'ASC' },
        });

        // Group by day - Map date to object
        const statsByDay = new Map<string, { revenue: number, count: number }>();

        // Initialize all days with 0
        for (let i = 0; i < days; i++) {
            const date = new Date(now.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            statsByDay.set(dateStr, { revenue: 0, count: 0 });
        }

        // Add sales data
        sales.forEach(sale => {
            const dateStr = sale.createdAt.toISOString().split('T')[0];
            const current = statsByDay.get(dateStr) || { revenue: 0, count: 0 };
            statsByDay.set(dateStr, {
                revenue: current.revenue + Number(sale.total),
                count: current.count + 1
            });
        });

        return Array.from(statsByDay.entries()).map(([date, stats]) => ({
            date,
            revenue: Math.round(stats.revenue * 100) / 100,
            count: stats.count,
        }));
    }

    async getSalesByStatus() {
        const statuses = Object.values(SaleStatus);
        const results = [];

        for (const status of statuses) {
            const count = await this.saleRepository.count({
                where: { status: status as any },
            });
            if (count > 0) {
                results.push({ status, count });
            }
        }

        return results;
    }

    async getTopProducts(limit: number = 5) {
        const items = await this.saleItemRepository
            .createQueryBuilder('item')
            .leftJoin('item.product', 'product')
            .select('COALESCE(product.name, item.customName)', 'name')
            .addSelect('SUM(item.quantity)', 'quantity')
            .addSelect('SUM(item.unitPrice * item.quantity)', 'revenue')
            .where('item.fileType = :type', { type: 'CATALOG' })
            .groupBy('product.name, item.customName')
            .orderBy('SUM(item.quantity)', 'DESC')
            .limit(limit)
            .getRawMany();

        return items.map(item => ({
            name: item.name,
            quantity: parseInt(item.quantity),
            revenue: Math.round(parseFloat(item.revenue) * 100) / 100,
        }));
    }

    async getTopMaterials(limit: number = 5) {
        const items = await this.saleItemRepository
            .createQueryBuilder('item')
            .innerJoin('item.material', 'material')
            .select('material.name', 'name')
            .addSelect('SUM(item.weight * item.quantity)', 'totalWeight')
            .addSelect('COUNT(item.id)', 'usageCount')
            .groupBy('material.id, material.name')
            .orderBy('SUM(item.weight * item.quantity)', 'DESC')
            .limit(limit)
            .getRawMany();

        return items.map(item => ({
            name: item.name,
            totalWeight: Math.round(parseFloat(item.totalWeight)),
            usageCount: parseInt(item.usageCount),
        }));
    }

    async getRecentSales(limit: number = 5) {
        return this.saleRepository.find({
            relations: ['customer'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async getStockAlerts() {
        const materials = await this.materialRepository.find({
            order: { name: 'ASC' },
        });
        return materials.filter(
            m => Number(m.stockWeight) <= Number(m.minStockAlert)
        );
    }

    async getActiveModelingRequests() {
        return this.modelingRepository.find({
            where: [
                { status: 'BRIEFING' as any },
                { status: 'MODELING' as any },
                { status: 'REVIEW' as any },
            ],
            relations: ['customer'],
            order: { createdAt: 'DESC' },
            take: 5,
        });
    }
}
