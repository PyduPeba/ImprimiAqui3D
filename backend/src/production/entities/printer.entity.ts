import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { PrinterStatus, UsageLevel } from '../enums/production.enums';

@Entity('printers')
export class Printer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    model: string;

    @Column({
        type: 'enum',
        enum: PrinterStatus,
        default: PrinterStatus.IDLE,
    })
    status: PrinterStatus;

    @Column({ nullable: true })
    ipAddress: string;

    @Column({ nullable: true })
    brand: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    acquisitionValue: number;

    @Column({ type: 'int', default: 12 })
    returnPeriodMonths: number;

    @Column({ type: 'decimal', precision: 4, scale: 1, default: 12.0 })
    workHoursPerDay: number;

    @Column({ type: 'int', default: 22 })
    workDaysPerMonth: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.35 })
    powerConsumptionKw: number;

    @Column({
        type: 'enum',
        enum: UsageLevel,
        default: UsageLevel.MEDIO,
    })
    usageLevel: UsageLevel;

    @Column({ type: 'decimal', precision: 4, scale: 2, default: 0.05 })
    failureRate: number;

    @Column({ type: 'decimal', precision: 4, scale: 2, default: 1.30 })
    profitMargin: number; // Ex: 1.30 = 30% de lucro

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 5.00 })
    hourlyRate: number; // Custo por hora de impressão

    @Column({ type: 'integer', default: 0 })
    totalPrintTimeMinutes: number;

    @Column({ type: 'integer', default: 0 })
    lastMaintenanceTimeMinutes: number;

    @Column({ type: 'integer', default: 30000 })
    maintenanceIntervalMinutes: number; // Default 500 hours

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
