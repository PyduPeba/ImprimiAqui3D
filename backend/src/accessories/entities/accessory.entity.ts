import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { AccessoryCategory } from '../enums/accessory.enums';

@Entity('accessories')
export class Accessory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: AccessoryCategory,
        default: AccessoryCategory.OTHER,
    })
    category: AccessoryCategory;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    costPrice: number;

    @Column({ default: true })
    inStock: boolean;

    @Column({ type: 'integer', default: 0 })
    stockQuantity: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
