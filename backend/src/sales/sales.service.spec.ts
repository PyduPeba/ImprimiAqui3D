import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Payment } from './entities/payment.entity';
import { PricingService } from './pricing.service';
import { DataSource } from 'typeorm';
import { getQueueToken } from '@nestjs/bull';
import { NotificationsService } from '../notifications/notifications.service';
import { SaleStatus, PaymentMethod } from './enums/sales.enums';
import { NotFoundException } from '@nestjs/common';

describe('SalesService', () => {
    let service: SalesService;
    let saleRepositoryMock: any;
    let paymentRepositoryMock: any;
    let pdfQueueMock: any;

    beforeEach(async () => {
        saleRepositoryMock = {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
        };

        paymentRepositoryMock = {
            create: jest.fn(),
            save: jest.fn(),
        };

        pdfQueueMock = {
            add: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SalesService,
                { provide: getRepositoryToken(Sale), useValue: saleRepositoryMock },
                { provide: getRepositoryToken(SaleItem), useValue: {} },
                { provide: getRepositoryToken(Payment), useValue: paymentRepositoryMock },
                { provide: PricingService, useValue: {} },
                { provide: DataSource, useValue: {} },
                { provide: getQueueToken('pdf-generation'), useValue: pdfQueueMock },
                { provide: NotificationsService, useValue: {} },
            ],
        }).compile();

        service = module.get<SalesService>(SalesService);
    });

    describe('findOne', () => {
        it('should return a sale if found', async () => {
            const mockSale = { id: '1', code: 'VAL-123' };
            saleRepositoryMock.findOne.mockResolvedValue(mockSale);

            const result = await service.findOne('1');
            expect(result).toEqual(mockSale);
        });

        it('should throw NotFoundException if sale not found', async () => {
            saleRepositoryMock.findOne.mockResolvedValue(null);
            await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('addPayment', () => {
        it('should add a payment and NOT complete sale if partially paid', async () => {
            const mockSale = {
                id: '1',
                total: 100,
                status: SaleStatus.QUOTE,
                payments: []
            };
            saleRepositoryMock.findOne.mockResolvedValue(mockSale);
            paymentRepositoryMock.create.mockReturnValue({ amount: 40 });

            await service.addPayment('1', PaymentMethod.CASH, 40);

            expect(paymentRepositoryMock.save).toHaveBeenCalled();
            expect(saleRepositoryMock.save).not.toHaveBeenCalled(); // Sale not completed yet
            expect(pdfQueueMock.add).not.toHaveBeenCalledWith('generate-receipt', expect.any(Object));
        });

        it('should add a payment and complete sale if fully paid', async () => {
            const mockSale = {
                id: '1',
                total: 100,
                status: SaleStatus.QUOTE,
                payments: [{ amount: 60 }]
            };
            saleRepositoryMock.findOne.mockResolvedValue(mockSale);
            paymentRepositoryMock.create.mockReturnValue({ amount: 40 });

            await service.addPayment('1', PaymentMethod.CREDIT_CARD, 40);

            expect(paymentRepositoryMock.save).toHaveBeenCalled();
            expect(mockSale.status).toBe(SaleStatus.COMPLETED);
            expect(saleRepositoryMock.save).toHaveBeenCalledWith(mockSale);
            expect(pdfQueueMock.add).toHaveBeenCalledWith('generate-receipt', { saleId: '1' });
        });
    });
});
