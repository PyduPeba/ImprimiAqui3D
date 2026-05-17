import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
} from 'typeorm';
import { Reseller } from './reseller.entity';
import { Product } from '../../catalog/entities/product.entity';

@Entity('reseller_inventory')
export class ResellerInventory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Reseller, (reseller) => reseller.inventory, { onDelete: 'CASCADE' })
    reseller: Reseller;

    @ManyToOne(() => Product, { eager: true })
    product: Product;

    @Column({ type: 'int', default: 0 })
    quantitySent: number; // quantidade enviada ao revendedor

    @Column({ type: 'int', default: 0 })
    quantitySold: number; // quantidade vendida pelo revendedor

    @Column({ type: 'int', default: 0 })
    quantityReturned: number; // quantidade devolvida

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number; // preço de venda acordado

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    commissionPercent: number; // % de comissão específico deste lote (override)

    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Campos computados (não persistidos)
    get quantityInPossession(): number {
        return this.quantitySent - this.quantitySold - this.quantityReturned;
    }

    get totalCommissionValue(): number {
        const commPct = this.commissionPercent ?? 0;
        return this.quantitySold * this.unitPrice * (commPct / 100);
    }
}
