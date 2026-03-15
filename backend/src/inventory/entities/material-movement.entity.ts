import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';
import { Material } from './material.entity';

export enum MovementType {
    IN = 'IN',
    OUT = 'OUT',
    ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('material_movements')
export class MaterialMovement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Material, (material) => material.movements)
    material: Material;

    @Column({
        type: 'enum',
        enum: MovementType,
    })
    type: MovementType;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number; // grams

    @Column({ nullable: true })
    reason: string;

    @Column({ type: 'uuid', nullable: true })
    referenceId: string; // e.g., SaleItemId or PrintJobId

    @CreateDateColumn()
    createdAt: Date;
}
