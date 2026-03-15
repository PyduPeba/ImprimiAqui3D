import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';
import { Printer } from './printer.entity';

@Entity('maintenance_logs')
export class MaintenanceLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Printer)
    printer: Printer;

    @Column()
    printerId: string;

    @CreateDateColumn()
    date: Date;

    @Column('text')
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    cost: number;

    @Column({ nullable: true })
    performedBy: string;

    @Column({ type: 'integer', nullable: true })
    printerUsageAtTime: number; // Snapshot of totalPrintTimeMinutes
}
