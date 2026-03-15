import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
} from 'typeorm';
import { SaleStatus } from '../enums/sales.enums';
import { SaleItem } from './sale-item.entity';
import { Payment } from './payment.entity';
import { User } from '../../auth/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { JoinColumn } from 'typeorm';

@Entity('sales')
export class Sale {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Column({ type: 'uuid', nullable: true, insert: false, update: false })
    customerId: string;

    @ManyToOne(() => Customer, { nullable: true })
    @JoinColumn({ name: 'customerId' })
    customer: Customer;

    @Column({ type: 'uuid', nullable: true })
    storeId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    subtotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    total: number;

    @Column({
        type: 'enum',
        enum: SaleStatus,
        default: SaleStatus.QUOTE,
    })
    status: SaleStatus;

    @Column({ default: 'LOJA_FISICA' })
    salesChannel: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    channelCommission: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    channelFixedFee: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    netValue: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalCost: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    profit: number;

    @ManyToOne(() => User)
    createdBy: User;

    @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
    items: SaleItem[];

    @OneToMany(() => Payment, (payment) => payment.sale, { cascade: true })
    payments: Payment[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
