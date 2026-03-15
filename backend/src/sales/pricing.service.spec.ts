import { Test, TestingModule } from '@nestjs/testing';
import { PricingService, PricingFactors } from './pricing.service';

describe('PricingService', () => {
    let service: PricingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PricingService],
        }).compile();

        service = module.get<PricingService>(PricingService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('calculatePrice', () => {
        const factors: PricingFactors = {
            pricePerGram: 0.15, // 15 cents per gram
            pricePerHour: 10.0, // 10 dollars per hour
            profitMargin: 1.5,   // 50% margin
        };

        it('should calculate price correctly for a standard job', () => {
            // 100g * 0.15 = 15
            // 120min (2h) * 10 = 20
            // (15 + 20) * 1.5 = 35 * 1.5 = 52.5
            const price = service.calculatePrice(100, 120, factors);
            expect(price).toBe(52.5);
        });

        it('should handle zero values', () => {
            const price = service.calculatePrice(0, 0, factors);
            expect(price).toBe(0);
        });

        it('should round to 2 decimal places', () => {
            const specificFactors: PricingFactors = {
                pricePerGram: 0.123,
                pricePerHour: 5.55,
                profitMargin: 1.11,
            };
            // 10g * 0.123 = 1.23
            // 45min (0.75h) * 5.55 = 4.1625
            // (1.23 + 4.1625) * 1.11 = 5.3925 * 1.11 = 5.985675
            // rounded = 5.99
            const price = service.calculatePrice(10, 45, specificFactors);
            expect(price).toBe(5.99);
        });

        it('should work with 1.0 margin (no profit)', () => {
            const noProfitFactors = { ...factors, profitMargin: 1.0 };
            const price = service.calculatePrice(100, 60, noProfitFactors);
            // 100 * 0.15 = 15
            // 1h * 10 = 10
            // 25 * 1.0 = 25
            expect(price).toBe(25);
        });
    });
});
