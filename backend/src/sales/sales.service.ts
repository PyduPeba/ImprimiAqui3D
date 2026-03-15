import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Payment } from './entities/payment.entity';
import { SaleStatus, PaymentMethod, PaymentStatus } from './enums/sales.enums';
import { PricingService } from './pricing.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { InventoryService } from '../inventory/inventory.service';
import { AccessoriesService } from '../accessories/accessories.service';

import { SystemConfigService } from '../system-config/system-config.service';
import { Printer } from '../production/entities/printer.entity';
import { Material } from '../inventory/entities/material.entity';

@Injectable()
export class SalesService {
    constructor(
        @InjectRepository(Sale)
        private saleRepository: Repository<Sale>,
        @InjectRepository(SaleItem)
        private saleItemRepository: Repository<SaleItem>,
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(Printer)
        private printerRepository: Repository<Printer>,
        @InjectRepository(Material)
        private materialRepository: Repository<Material>,
        private pricingService: PricingService,
        private dataSource: DataSource,
        @InjectQueue('pdf-generation')
        private pdfQueue: Queue,
        private notificationsService: NotificationsService,
        private inventoryService: InventoryService,
        private systemConfigService: SystemConfigService,
        private accessoriesService: AccessoriesService,
    ) { }

    private calculateFinalPrice(amount: number, payment: any, settings: any): number {
        const finance = settings.finance || {};
        const { method, installments } = payment;

        if (method === PaymentMethod.PIX && finance.paymentMethods?.pix?.discount) {
            return amount * (1 - (finance.paymentMethods.pix.discount / 100));
        }

        if (method === PaymentMethod.CREDIT_CARD && finance.paymentMethods?.creditCard) {
            const cc = finance.paymentMethods.creditCard;
            const plan = cc.installments?.find(
                (i: any) => i.count === Number(installments)
            );

            if (plan && plan.rate) {
                if (cc.interestType === 'COMPOUND' && Number(installments) > 1) {
                    return amount * Math.pow(1 + (plan.rate / 100), Number(installments));
                }
                return amount * (1 + (plan.rate / 100));
            }
        }

        return amount;
    }

    private calculateFinancials(sale: Sale) {
        const total = Number(sale.total);
        const commission = total * (Number(sale.channelCommission || 0) / 100);
        const fixedFee = Number(sale.channelFixedFee || 0);
        sale.netValue = total - commission - fixedFee;

        let totalCost = 0;
        if (sale.items) {
            for (const item of sale.items) {
                // Material cost
                const materialCost = Number(item.weight || 0) * Number(item.material?.pricePerGram || 0.1);
                // Printer cost
                const printerCost = (Number(item.printTime || 0) / 60) * Number(item.printer?.hourlyRate || 5);
                // Accessories cost
                const accessoriesCost = (item.accessories || []).reduce((sum: number, acc: any) =>
                    sum + (Number(acc.accessory?.costPrice || 0) * Number(acc.quantity || 1)), 0);

                totalCost += (materialCost + printerCost) * (item.quantity || 1) + accessoriesCost;
            }
        }
        sale.totalCost = totalCost;
        sale.profit = sale.netValue - sale.totalCost;
    }

    async createQuotation(data: any, userId: string) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            console.log('Creating Quotation with data:', JSON.stringify(data, null, 2));
            // Fetch Store Settings
            const settings = await this.systemConfigService.getStoreConfig(data.storeId);
            const pricingDefaults = settings.pricing || {};

            const sale = this.saleRepository.create({
                code: `VAL-${Date.now()}`,
                customer: data.customerId ? { id: data.customerId } as any : null,
                storeId: data.storeId,
                status: data.isDirectSale ? SaleStatus.CONFIRMED : SaleStatus.QUOTE,
                createdBy: { id: userId } as any,
            });

            sale.salesChannel = data.salesChannel || 'LOJA_FISICA';
            if (sale.salesChannel !== 'LOJA_FISICA') {
                const mkt = settings.finance?.marketplace?.[sale.salesChannel];
                if (mkt) {
                    sale.channelCommission = Number(mkt.commission) || 0;
                    sale.channelFixedFee = Number(mkt.fixedFee) || 0;
                }
            }

            const savedSale = await queryRunner.manager.save(sale);

            let total = 0;

            // Process items sequentially to fetch related entities
            const items = [];
            for (const item of data.items) {
                // Fetch Material, Printer, and Product if IDs provided
                const material = item.materialId ? await this.materialRepository.findOne({ where: { id: item.materialId } }) : null;
                const printer = item.printerId ? await this.printerRepository.findOne({ where: { id: item.printerId } }) : null;
                const product = item.productId ? await this.dataSource.getRepository('Product').findOne({
                    where: { id: item.productId },
                    relations: ['category']
                }) as any : null;

                if (item.materialId && !material) console.warn(`Material not found: ${item.materialId}`);
                if (item.printerId && !printer) console.warn(`Printer not found: ${item.printerId}`);
                if (item.productId && !product) console.warn(`Product not found: ${item.productId}`);

                // Determine Pricing Factors with Fallbacks
                // Priority: Item Overrides (frontend) > Entity Properties > Store Defaults > Hard Fallbacks
                const pricePerGram = item.pricingFactors?.pricePerGram
                    ?? material?.pricePerGram
                    ?? pricingDefaults.defaultMaterialCost
                    ?? 0.1;

                const pricePerHour = item.pricingFactors?.pricePerHour
                    ?? printer?.hourlyRate
                    ?? pricingDefaults.defaultHourlyRate
                    ?? 5.0;

                const profitMargin = item.pricingFactors?.profitMargin
                    ?? product?.profitMargin // 1. Product Margin
                    ?? product?.category?.profitMargin // 2. Category Margin
                    ?? printer?.profitMargin // 3. Printer Margin (exists?)
                    ?? pricingDefaults.defaultMargin // 4. Store Default
                    ?? 1.3;

                const pricingFactors = { pricePerGram, pricePerHour, profitMargin };

                const itemPrice = this.pricingService.calculatePrice(
                    item.weight,
                    item.printTime,
                    pricingFactors,
                );
                // If product has fixed price, maybe use it? For now, keep calculated price or use item.unitPrice if provided from frontend for catalog?
                // Assuming calculator logic is primary.

                // Calculate accessories total
                const accessoriesTotal = (item.accessories || []).reduce((sum: number, acc: any) => sum + (Number(acc.unitPrice) * Number(acc.quantity || 1)), 0);
                const itemSubtotal = (itemPrice * (item.quantity || 1)) + accessoriesTotal;

                total += itemSubtotal;

                console.log(`[SalesService] Incoming item "${item.name || item.customName}" accessories:`, JSON.stringify(item.accessories?.map((a: any) => ({ id: a.id, accId: a.accessory?.id, accIdField: a.accessoryId }))));

                const newItemAccessories = (item.accessories || [])
                    .filter((acc: any) => acc.accessoryId || acc.accessory?.id || acc.id)
                    .map((acc: any) => {
                        const realAccId = acc.accessory?.id || acc.accessoryId || acc.id;
                        // Avoid non-UUID identifiers like 'top-1'
                        if (typeof realAccId === 'string' && realAccId.length < 20) {
                            console.warn(`[SalesService] Skipping invalid accessory ID: ${realAccId}`);
                            return null;
                        }

                        return {
                            accessory: { id: realAccId },
                            quantity: Number(acc.quantity) || 1,
                            unitPrice: Number(acc.unitPrice),
                            subtotal: (Number(acc.unitPrice) * (Number(acc.quantity) || 1))
                        };
                    })
                    .filter((a: any) => a !== null);

                const newItem = this.saleItemRepository.create({
                    sale: savedSale,
                    material: material || undefined,
                    materialId: material?.id,
                    printer: printer || undefined,
                    printerId: printer?.id,
                    product: product || undefined,
                    customName: item.name || item.customName,
                    fileName: item.fileName,
                    weight: item.weight,
                    printTime: item.printTime,
                    quantity: item.quantity || 1,
                    unitPrice: itemPrice,
                    subtotal: itemPrice * (item.quantity || 1),
                    accessories: newItemAccessories as any[]
                });

                console.log(`[SalesService] Created newItem: ${newItem.customName}, accessoriesCount=${newItem.accessories?.length || 0}`);
                items.push(newItem);
            }

            // Save items with their accessories (cascade: true)
            const savedItems = await queryRunner.manager.save(items);

            // Re-load items with accessories to be sure for stock deduction
            const fullItems = await queryRunner.manager.find(SaleItem, {
                where: { sale: { id: savedSale.id } },
                relations: ['accessories', 'accessories.accessory', 'material', 'printer']
            });

            let finalTotal = total;
            // Apply payment adjustments if direct sale
            if (data.isDirectSale && data.payment) {
                finalTotal = this.calculateFinalPrice(total, data.payment, settings);
            }

            // Apply discount if provided
            if (data.discount) {
                total = Math.max(0, total - Number(data.discount));
                // Recalculate final total with discount applied
                if (data.isDirectSale && data.payment) {
                    finalTotal = this.calculateFinalPrice(total, data.payment, settings);
                } else {
                    finalTotal = total;
                }
            }

            // Recalculate raw subtotal including accessories
            savedSale.subtotal = fullItems.reduce((sum: number, i: any) => {
                const accTotal = (i.accessories || []).reduce((accSum: number, a: any) => accSum + (Number(a.subtotal) || 0), 0);
                return sum + Number(i.subtotal) + accTotal;
            }, 0);
            savedSale.discount = Number(data.discount || 0);
            savedSale.total = finalTotal;
            savedSale.items = fullItems;

            this.calculateFinancials(savedSale);

            await queryRunner.manager.save(savedSale);

            console.log(`[SalesService] createQuotation: isDirectSale=${data.isDirectSale}, itemsCount=${items.length}, fullItemsCount=${fullItems.length}`);

            // Deduct stock if direct sale (CONFIRMED)
            if (data.isDirectSale) {
                for (const item of fullItems) {
                    console.log(`[SalesService] Processing item: ${item.customName || 'unnamed'}, accessoriesCount=${item.accessories?.length || 0}`);
                    // Deduct material stock
                    if (item.material && item.weight) {
                        await this.inventoryService.removeStock(
                            item.material.id as any,
                            item.weight,
                            `Venda Direta ${savedSale.code}`,
                            undefined,
                            queryRunner.manager
                        );
                    }

                    // Deduct accessories stock
                    if (item.accessories && item.accessories.length > 0) {
                        for (const itemAcc of item.accessories) {
                            console.log(`[SalesService] Deducting accessory: id=${itemAcc.accessory?.id}, name=${itemAcc.accessory?.name}, quantity=${itemAcc.quantity}`);
                            if (itemAcc.accessory) {
                                await this.accessoriesService.updateStock(
                                    itemAcc.accessory.id,
                                    -(itemAcc.quantity || 1),
                                    queryRunner.manager
                                );
                            }
                        }
                    }
                }
            }

            await queryRunner.commitTransaction();

            // Move side effects after transaction commit to avoid race conditions
            await this.pdfQueue.add('generate-quotation', { saleId: savedSale.id });

            // Notify user
            await this.notificationsService.create(
                userId,
                NotificationType.SALE,
                'Novo Orçamento Criado',
                `O orçamento ${savedSale.code} foi gerado com sucesso.`
            );

            return this.findOne(savedSale.id);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async findOne(id: string) {
        const sale = await this.saleRepository.findOne({
            where: { id },
            relations: ['items', 'items.material', 'items.printer', 'items.accessories', 'items.accessories.accessory', 'payments', 'createdBy', 'customer'],
        });

        if (!sale) throw new NotFoundException('Venda não encontrada');
        console.log(`[DEBUG] findOne(${id}) accessories sample:`,
            sale.items?.[0]?.accessories?.map(a => ({
                id: a.id,
                accId: a.accessory?.id,
                accName: a.accessory?.name,
                rawAcc: a.accessory
            }))
        );
        return sale;
    }

    async addPayment(saleId: string, method: PaymentMethod, amount: number) {
        const sale = await this.findOne(saleId);

        const payment = this.paymentRepository.create({
            sale,
            method,
            amount,
        });

        await this.paymentRepository.save(payment);

        // Update sale payment status if fully paid
        const totalPaid = (sale.payments || []).reduce((sum, p) => sum + Number(p.amount), 0) + Number(amount);

        if (totalPaid >= sale.total) {
            sale.status = SaleStatus.COMPLETED;
            await this.saleRepository.save(sale);
            await this.pdfQueue.add('generate-receipt', { saleId: sale.id });
        }

        return payment;
    }

    async findAll(filters: any = {}) {
        const {
            page = 1,
            limit = 10,
            status,
            customerId,
            startDate,
            endDate,
        } = filters;

        const queryBuilder = this.saleRepository
            .createQueryBuilder('sale')
            .leftJoinAndSelect('sale.customer', 'customer')
            .leftJoinAndSelect('sale.items', 'items')
            .leftJoinAndSelect('items.material', 'material')
            .leftJoinAndSelect('items.printer', 'printer')
            .leftJoinAndSelect('items.accessories', 'accessories')
            .leftJoinAndSelect('accessories.accessory', 'accessory')
            .leftJoinAndSelect('sale.payments', 'payments');

        // Apply filters
        if (status) {
            queryBuilder.andWhere('sale.status = :status', { status });
        }

        if (customerId) {
            queryBuilder.andWhere('sale.customerId = :customerId', { customerId });
        }

        if (startDate) {
            queryBuilder.andWhere('sale.createdAt >= :startDate', { startDate });
        }

        if (endDate) {
            queryBuilder.andWhere('sale.createdAt <= :endDate', { endDate });
        }

        // Pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        // Order by most recent
        queryBuilder.orderBy('sale.createdAt', 'DESC');

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
        };
    }

    async getRecentSales() {
        return this.saleRepository.find({
            relations: ['items', 'items.material', 'items.printer', 'items.accessories', 'payments', 'createdBy', 'customer'],
            order: { createdAt: 'DESC' },
            take: 20,
        });
    }

    async confirmSale(id: string, paymentData: any) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const sale = await queryRunner.manager.findOne(Sale, {
                where: { id },
                relations: ['items', 'items.material', 'items.printer', 'items.accessories', 'items.accessories.accessory']
            });

            if (!sale) throw new NotFoundException('Venda não encontrada');
            if (sale.status !== SaleStatus.QUOTE) {
                throw new BadRequestException('Apenas orçamentos podem ser confirmados');
            }

            // Fetch Store Settings
            const settings = await this.systemConfigService.getStoreConfig(sale.storeId);

            // Update marketplace channel if provided
            if (paymentData.salesChannel) {
                sale.salesChannel = paymentData.salesChannel;
                const mkt = settings.finance?.marketplace?.[sale.salesChannel];
                if (mkt) {
                    sale.channelCommission = Number(mkt.commission) || 0;
                    sale.channelFixedFee = Number(mkt.fixedFee) || 0;
                }
            }

            // Calculate final price with adjustments
            const finalTotal = this.calculateFinalPrice(sale.total, paymentData, settings);

            // Update sale total to match the final calculated price (with interest/discount)
            sale.total = finalTotal;
            sale.status = SaleStatus.CONFIRMED;

            this.calculateFinancials(sale);

            await queryRunner.manager.save(sale);

            // Create payment
            const payment = this.paymentRepository.create({
                sale,
                amount: finalTotal,
                method: paymentData.method,
                installments: paymentData.installments || 1,
                status: PaymentStatus.PAID,
            });
            await queryRunner.manager.save(payment);

            // Deduct stock
            for (const item of sale.items) {
                // Deduct material stock
                if (item.material && item.weight) {
                    await this.inventoryService.removeStock(
                        item.material.id,
                        item.weight,
                        `Venda Confirmada ${sale.code}`,
                        sale.id,
                        queryRunner.manager
                    );
                }

                // Deduct accessories stock
                if (item.accessories && item.accessories.length > 0) {
                    for (const itemAcc of item.accessories) {
                        if (itemAcc.accessory) {
                            await this.accessoriesService.updateStock(
                                itemAcc.accessory.id,
                                -(itemAcc.quantity || 1),
                                queryRunner.manager
                            );
                        }
                    }
                }
            }

            await queryRunner.commitTransaction();
            return this.findOne(id);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async cancelSale(id: string) {
        const sale = await this.findOne(id);
        if (sale.status === SaleStatus.CANCELLED) {
            throw new BadRequestException('Venda já cancelada');
        }

        const wasConfirmed = sale.status === SaleStatus.CONFIRMED || sale.status === SaleStatus.COMPLETED;

        sale.status = SaleStatus.CANCELLED;
        await this.saleRepository.save(sale);

        // Restore stock if it was a confirmed sale
        if (wasConfirmed) {
            for (const item of sale.items) {
                if (item.material && item.weight) {
                    await this.inventoryService.addStock(
                        item.material.id,
                        item.weight,
                        `Estorno Venda ${sale.code}`
                    );
                }
            }
        }

        return sale;
    }
}
