import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Sale } from './sale.entity';
import { Product } from '../../catalog/entities/product.entity';
import { Printer } from '../../production/entities/printer.entity';
import { Material } from '../../inventory/entities/material.entity';
import { SaleItemAccessory } from '../../accessories/entities/sale-item-accessory.entity';
import { JoinColumn } from 'typeorm';

@Entity('sale_items')
export class SaleItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Sale, (sale) => sale.items)
    sale: Sale;

    @ManyToOne(() => Product, { nullable: true })
    product: Product;

    @ManyToOne(() => Printer, { nullable: true })
    @JoinColumn({ name: 'printerId' })
    printer: Printer;

    @Column({ nullable: true })
    printerId: string;

    @Column({ nullable: true })
    customName: string;

    @Column({ nullable: true })
    materialId: string;

    @ManyToOne(() => Material, { nullable: true })
    @JoinColumn({ name: 'materialId' })
    material: Material;

    @Column({ nullable: true })
    fileName: string;

    @Column({ nullable: true })
    fileType: string; // 'STL', 'GCODE', 'CATALOG'

    @Column({ nullable: true })
    stlFileUrl: string;

    @Column({ nullable: true })
    gcodeFileUrl: string;

    @Column({ nullable: true })
    fileId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    weight: number;

    @Column({ type: 'integer' })
    printTime: number; // in minutes

    @Column({ type: 'integer', default: 1 })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;

    @OneToMany(() => SaleItemAccessory, accessory => accessory.saleItem, { cascade: true })
    accessories: SaleItemAccessory[];

    @Column({ type: 'uuid', nullable: true })
    printJobId: string;
}
