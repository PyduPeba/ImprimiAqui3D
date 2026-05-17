import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { ResellerInventory } from './reseller-inventory.entity';

@Entity('resellers')
export class Reseller {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    document: string; // CPF ou CNPJ

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    defaultCommissionPercent: number; // % padrão de comissão deste revendedor

    @Column({ type: 'text', nullable: true })
    bankInfo: string; // dados bancários para repasse

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => ResellerInventory, (inv) => inv.reseller, { cascade: true })
    inventory: ResellerInventory[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
