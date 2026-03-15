import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { MaterialMovement } from './material-movement.entity';

@Entity('materials')
export class Material {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    type: string; // PLA, ABS, etc.

    @Column({ nullable: true })
    color: string;

    @Column({ nullable: true })
    brand: string;

    @Column({ type: 'text', nullable: true })
    imageUrl: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    stockWeight: number; // in grams

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    minStockAlert: number; // in grams

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    pricePerGram: number;

    @OneToMany(() => MaterialMovement, (movement) => movement.material)
    movements: MaterialMovement[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
