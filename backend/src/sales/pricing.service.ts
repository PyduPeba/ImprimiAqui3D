import { Injectable } from '@nestjs/common';

export interface PricingFactors {
    pricePerGram: number;
    pricePerHour: number;
    profitMargin: number; // multiplier, e.g., 1.2 for 20%
}

@Injectable()
export class PricingService {
    /**
     * Calculates the price of a 3D print based on weight, time, and store factors.
     * Formula: price = ((weight_g * price_per_g) + (time_h * price_per_h)) * margin
     */
    calculatePrice(
        weightGrams: number,
        timeMinutes: number,
        factors: PricingFactors,
    ): number {
        const timeHours = timeMinutes / 60;
        const materialCost = weightGrams * factors.pricePerGram;
        const laborCost = timeHours * factors.pricePerHour;

        const basePrice = materialCost + laborCost;
        const finalPrice = basePrice * factors.profitMargin;

        return Number(finalPrice.toFixed(2));
    }
}
