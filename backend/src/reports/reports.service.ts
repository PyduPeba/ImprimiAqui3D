import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { PrintJob } from '../production/entities/print-job.entity';
import { PrintStatus } from '../production/enums/production.enums';
import { Material } from '../inventory/entities/material.entity';
import { MaterialMovement } from '../inventory/entities/material-movement.entity';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Sale)
        private saleRepository: Repository<Sale>,
        @InjectRepository(PrintJob)
        private printJobRepository: Repository<PrintJob>,
        @InjectRepository(Material)
        private materialRepository: Repository<Material>,
        @InjectRepository(MaterialMovement)
        private materialMovementRepository: Repository<MaterialMovement>,
    ) { }

    async getDashboardStats(startDate: Date, endDate: Date) {
        const sales = await this.saleRepository.find({
            where: {
                createdAt: Between(startDate, endDate),
            },
        });

        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
        const salesCount = sales.length;

        const printJobs = await this.printJobRepository.find({
            where: {
                createdAt: Between(startDate, endDate),
            },
        });

        const activeJobs = printJobs.filter(
            (job) => job.status === PrintStatus.PRINTING || job.status === PrintStatus.WAITING,
        ).length;

        const completedJobs = printJobs.filter(
            (job) => job.status === PrintStatus.COMPLETED,
        ).length;

        const failureRate = printJobs.length > 0
            ? (printJobs.filter((job) => job.status === PrintStatus.FAILED).length / printJobs.length) * 100
            : 0;

        return {
            revenue: totalRevenue,
            salesCount,
            activeJobs,
            completedJobs,
            failureRate: Number(failureRate.toFixed(2)),
        };
    }

    async getSalesReport(filters: any = {}) {
        const { startDate, endDate } = filters;

        const queryBuilder = this.saleRepository
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.customer', 'customer')
            .leftJoinAndSelect('sale.items', 'items')
            .leftJoinAndSelect('items.material', 'material')
            .leftJoinAndSelect('items.printer', 'printer');

        if (startDate && endDate) {
            queryBuilder.andWhere('sale.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }

        queryBuilder.orderBy('sale.createdAt', 'DESC');

        const sales = await queryBuilder.getMany();

        // Calculate summary with advanced metrics
        let totalRevenue = 0;
        let totalNetRevenue = 0;
        let totalEstimatedCost = 0;

        sales.forEach((sale: any) => {
            const saleTotal = Number(sale.total);
            totalRevenue += saleTotal;

            // Use persisted values if available, otherwise calculate on the fly (for old data)
            const netValue = Number(sale.netValue) || (saleTotal - (saleTotal * (Number(sale.channelCommission || 0) / 100)) - Number(sale.channelFixedFee || 0));
            totalNetRevenue += netValue;

            let saleCost = 0;
            if (Number(sale.totalCost) > 0) {
                saleCost = Number(sale.totalCost);
            } else {
                sale.items?.forEach((item: any) => {
                    const materialCost = Number(item.weight || 0) * Number(item.material?.pricePerGram || 0.1);
                    const printerCost = (Number(item.printTime || 0) / 60) * Number(item.printer?.hourlyRate || 5);
                    saleCost += (materialCost + printerCost) * (item.quantity || 1);
                });
            }
            totalEstimatedCost += saleCost;
        });

        const totalSales = sales.length;
        const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
        const grossProfit = totalRevenue - totalEstimatedCost;
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        const statusBreakdown = sales.reduce((acc: any, sale) => {
            acc[sale.status] = (acc[sale.status] || 0) + 1;
            return acc;
        }, {});

        return {
            summary: {
                totalRevenue: Number(totalRevenue.toFixed(2)),
                totalNetRevenue: Number(totalNetRevenue.toFixed(2)),
                totalEstimatedCost: Number(totalEstimatedCost.toFixed(2)),
                grossProfit: Number(grossProfit.toFixed(2)),
                grossMargin: Number(grossMargin.toFixed(1)),
                totalSales,
                averageTicket: Number(averageTicket.toFixed(2)),
                statusBreakdown,
            },
            sales: sales.map((sale: any) => ({
                id: sale.id,
                code: sale.code,
                date: sale.createdAt,
                customer: sale.customer?.name || 'Consumidor',
                status: sale.status,
                total: Number(sale.total),
                netValue: Number((Number(sale.netValue) || (Number(sale.total) - (Number(sale.total) * (Number(sale.channelCommission || 0) / 100)) - Number(sale.channelFixedFee || 0))).toFixed(2)),
                itemsCount: sale.items?.length || 0,
            })),
        };
    }

    async getInventoryReport(filters: any = {}) {
        const materials = await this.materialRepository.find({
            order: { name: 'ASC' },
        });

        const { startDate, endDate } = filters;
        let movements: MaterialMovement[] = [];

        if (startDate && endDate) {
            movements = await this.materialMovementRepository.find({
                where: {
                    createdAt: Between(startDate, endDate),
                },
                relations: ['material'],
                order: { createdAt: 'DESC' },
            });
        }

        // Calculate summary
        const totalMaterials = materials.length;
        const lowStockCount = materials.filter(
            m => Number(m.stockWeight) <= Number(m.minStockAlert)
        ).length;
        const totalStockValue = materials.reduce(
            (sum, m) => sum + (Number(m.stockWeight) * Number(m.pricePerGram)),
            0
        );

        return {
            summary: {
                totalMaterials,
                lowStockCount,
                totalStockValue: Math.round(totalStockValue * 100) / 100,
            },
            materials: materials.map(m => ({
                id: m.id,
                name: m.name,
                type: m.type,
                color: m.color,
                brand: m.brand,
                stockWeight: Number(m.stockWeight),
                minStockAlert: Number(m.minStockAlert),
                pricePerGram: Number(m.pricePerGram),
                status: Number(m.stockWeight) <= Number(m.minStockAlert) ? 'LOW' : 'OK',
            })),
            movements: movements.map(mov => ({
                id: mov.id,
                date: mov.createdAt,
                material: mov.material?.name || 'N/A',
                type: mov.type,
                amount: Number(mov.amount),
                reason: mov.reason,
            })),
        };
    }

    async getProductionReport(filters: any = {}) {
        const { startDate, endDate } = filters;

        const queryBuilder = this.printJobRepository
            .createQueryBuilder('job')
            .leftJoinAndSelect('job.printer', 'printer')
            .leftJoinAndSelect('job.material', 'material');

        if (startDate && endDate) {
            queryBuilder.andWhere('job.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }

        queryBuilder.orderBy('job.createdAt', 'DESC');

        const jobs = await queryBuilder.getMany();

        // Calculate summary
        const totalJobs = jobs.length;
        const completedJobs = jobs.filter(j => j.status === PrintStatus.COMPLETED).length;
        const failedJobs = jobs.filter(j => j.status === PrintStatus.FAILED).length;
        const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

        const statusBreakdown = jobs.reduce((acc: any, job) => {
            acc[job.status] = (acc[job.status] || 0) + 1;
            return acc;
        }, {});

        return {
            summary: {
                totalJobs,
                completedJobs,
                failedJobs,
                successRate: Math.round(successRate * 100) / 100,
                statusBreakdown,
            },
            jobs: jobs.map(job => ({
                id: job.id,
                date: job.createdAt,
                printer: job.printer?.name || 'N/A',
                status: job.status,
                estimatedTime: job.estimatedTime,
            })),
        };
    }

    generateCsv(data: any[], headers: string[]): string {
        const csvRows = [];

        // Add headers
        csvRows.push(headers.join(','));

        // Add data rows
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header.toLowerCase().replace(/ /g, '')];
                return `"${value || ''}"`;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }
}
