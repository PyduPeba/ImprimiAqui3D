import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('stores')
export class Store {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    document: string; // CNPJ

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'jsonb', nullable: true })
    settings: {
        branding: {
            storeName?: string;
            storeEmail?: string;
            storePhone?: string;
            logoUrl: string;
            faviconUrl: string;
            primaryColor: string;
            secondaryColor: string;
        };
        finance: {
            paymentMethods: {
                creditCard: {
                    rate: number;
                    interestType?: 'SIMPLE' | 'COMPOUND';
                    installments: { count: number; rate: number }[]
                };
                debitCard: { rate: number };
                pix: { rate: number; discount: number };
            };
            marketplace: {
                [channel: string]: { commission: number; fixedFee: number };
            };
        };
        pricing: {
            defaultHourlyRate: number;
            defaultMaterialCost: number;
            defaultMargin: number;
            minOrderValue: number;
        };
        reports: {
            termsAndConditions: string;
            footerText: string;
            showMargins: boolean;
        };
    };

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
