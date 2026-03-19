import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
} from 'typeorm';
import { PrintStatus } from '../enums/production.enums';
import { Printer } from './printer.entity';
import { SaleItem } from '../../sales/entities/sale-item.entity';

@Entity('print_jobs')
export class PrintJob {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    saleItemId: string;

    @Column({ type: 'boolean', default: false })
    isExternal: boolean;

    @Column({ type: 'string', nullable: true })
    externalFileName: string;

    @ManyToOne(() => Printer, { nullable: true })
    printer: Printer;

    @Column({
        type: 'enum',
        enum: PrintStatus,
        default: PrintStatus.WAITING,
    })
    status: PrintStatus;

    @Column({ type: 'integer' })
    priority: number; // 1 (high) to 5 (low)

    @Column({ type: 'timestamp', nullable: true })
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date;

    @Column({ type: 'integer', default: 0 })
    estimatedTime: number; // minutes

    @Column({ type: 'integer', default: 0 })
    actualTime: number; // minutes

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    actualCost: number; // BRL

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
