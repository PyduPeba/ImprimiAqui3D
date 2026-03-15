import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Sale } from '../sales/entities/sale.entity';
import { PrintJob } from '../production/entities/print-job.entity';
import { Material } from '../inventory/entities/material.entity';
import { MaterialMovement } from '../inventory/entities/material-movement.entity';
import { SaleStatus } from '../sales/enums/sales.enums';

describe('ReportsService', () => {
    let service: ReportsService;
    let saleRepositoryMock: any;
    let printJobRepositoryMock: any;

    beforeEach(async () => {
        saleRepositoryMock = {
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn(),
            })),
        };

        printJobRepositoryMock = {
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn(),
            })),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReportsService,
                { provide: getRepositoryToken(Sale), useValue: saleRepositoryMock },
                { provide: getRepositoryToken(PrintJob), useValue: printJobRepositoryMock },
                { provide: getRepositoryToken(Material), useValue: { find: jest.fn() } },
                { provide: getRepositoryToken(MaterialMovement), useValue: { find: jest.fn() } },
            ],
        }).compile();

        service = module.get<ReportsService>(ReportsService);
    });

    describe('getDashboardStats', () => {
        it('should calculate revenue and sales count correctly', async () => {
            const startDate = new Date('2026-01-01');
            const endDate = new Date('2026-01-31');

            saleRepositoryMock.find.mockResolvedValue([
                { total: 100 },
                { total: 250.75 },
            ]);

            printJobRepositoryMock.find.mockResolvedValue([]);

            const stats = await service.getDashboardStats(startDate, endDate);

            expect(stats.revenue).toBe(350.75);
            expect(stats.salesCount).toBe(2);
        });

        it('should calculate failure rate correctly', async () => {
            saleRepositoryMock.find.mockResolvedValue([]);
            printJobRepositoryMock.find.mockResolvedValue([
                { status: 'COMPLETED' },
                { status: 'FAILED' },
                { status: 'COMPLETED' },
                { status: 'COMPLETED' },
            ]);

            const stats = await service.getDashboardStats(new Date(), new Date());
            expect(stats.failureRate).toBe(25); // 1 out of 4
        });
    });

    describe('getSalesReport', () => {
        it('should group sales by status and calculate totals', async () => {
            const mockSales = [
                { id: '1', total: 100, status: SaleStatus.COMPLETED, items: [] },
                { id: '2', total: 50, status: SaleStatus.QUOTE, items: [] },
                { id: '3', total: 150, status: SaleStatus.COMPLETED, items: [] },
            ];

            const queryBuilder: any = {
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockSales),
            };

            saleRepositoryMock.createQueryBuilder.mockReturnValue(queryBuilder);

            const report = await service.getSalesReport();

            expect(report.summary.totalRevenue).toBe(300);
            expect(report.summary.totalSales).toBe(3);
            expect(report.summary.averageTicket).toBe(100);
            expect(report.summary.statusBreakdown[SaleStatus.COMPLETED]).toBe(2);
            expect(report.summary.statusBreakdown[SaleStatus.QUOTE]).toBe(1);
        });
    });
});
