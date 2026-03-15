export enum SaleStatus {
    QUOTE = 'QUOTE',           // Orçamento
    CONFIRMED = 'CONFIRMED',   // Venda confirmada
    IN_PRODUCTION = 'IN_PRODUCTION',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
}

export enum PaymentMethod {
    CASH = 'CASH',
    CREDIT_CARD = 'CREDIT_CARD',
    DEBIT_CARD = 'DEBIT_CARD',
    PIX = 'PIX',
    BANK_TRANSFER = 'BANK_TRANSFER',
    SHOPEE = 'SHOPEE',
}
