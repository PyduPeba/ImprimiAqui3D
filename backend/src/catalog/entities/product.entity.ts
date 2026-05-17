import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Material } from '../../inventory/entities/material.entity';
import { Category } from './category.entity';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true, unique: true })
    sku: string; // Código único de produto

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

    // --- Preços ---
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    fixedPrice: number; // mantido por compatibilidade legada

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    productionCost: number; // custo de produção (calculado ou manual)

    @Column({ type: 'boolean', default: false })
    productionCostManualOverride: boolean; // se true, não recalcula automaticamente

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    salePrice: number; // preço de venda sugerido

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    profitMargin: number; // markup (ex: 2.5 = 250%)

    // --- Comissão de Revendedor ---
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
    commissionPercent: number; // % padrão de comissão para revendedores

    // --- Estoque Próprio ---
    @Column({ type: 'int', default: 0 })
    stockQuantity: number; // quantidade disponível em estoque próprio

    @Column({ type: 'int', nullable: true })
    minStockAlert: number; // alerta de estoque baixo

    // --- Imagem ---
    @Column({ nullable: true })
    imageUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
