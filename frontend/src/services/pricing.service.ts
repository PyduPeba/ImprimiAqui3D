export const pricingService = {
    calculatePrice(weight: number, timeInMinutes: number, material: any, factors: any) {
        const timeHours = timeInMinutes / 60;

        // 1. Material Cost
        const materialCost = weight * (material.pricePerGram || 0.1);

        // 2. Machine/Labor Cost
        const laborCost = timeHours * (factors.pricePerHour || 5);

        // 3. Energy Cost (Approx 0.3kW/h * Price per kWh)
        const energyCost = timeHours * 0.3 * (factors.energyPrice || 0.80);

        // 4. Maintenance / Depreciation
        const maintenanceCost = timeHours * (factors.maintenanceRate || 0.5);

        const totalCost = materialCost + laborCost + energyCost + maintenanceCost;

        // 5. Profit Margin
        const priceWithMargin = totalCost * (factors.profitMargin || 2.0);

        // 6. Risk Factor (Failure rate)
        const finalPrice = priceWithMargin * (1 + (factors.riskFactor || 0.15));

        return Number(finalPrice.toFixed(2));
    }
};
