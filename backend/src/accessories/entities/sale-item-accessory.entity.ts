import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from 'typeorm';
import { SaleItem } from '../../sales/entities/sale-item.entity';
import { Accessory } from './accessory.entity';

@Entity('sale_item_accessories')
export class SaleItemAccessory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => SaleItem, 'accessories')
    saleItem: SaleItem;

    @ManyToOne(() => Accessory)
    accessory: Accessory;

    @Column({ type: 'integer', default: 1 })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;
}
