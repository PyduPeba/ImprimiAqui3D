import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
} from 'typeorm';
import { Material } from '../../inventory/entities/material.entity';
import { Category } from './category.entity';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @ManyToOne(() => Category, category => category.products, { nullable: true })
    category: Category;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    weightGrams: number;

    @Column({ type: 'int' })
    printTimeMinutes: number;

    @ManyToOne(() => Material, { nullable: true })
    defaultMaterial: Material;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    fixedPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    profitMargin: number;

    @Column({ nullable: true })
    imageUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
