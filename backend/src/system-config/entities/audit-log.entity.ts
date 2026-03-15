import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User)
    user: User;

    @Column({ nullable: true })
    userId: string;

    @Column()
    action: string; // e.g., 'PRICE_CHANGE', 'MARGIN_CHANGE', 'SETTINGS_CHANGE'

    @Column()
    entityType: string; // e.g., 'Material', 'Product', 'Category', 'Store'

    @Column({ nullable: true })
    entityId: string;

    @Column({ type: 'jsonb', nullable: true })
    oldValue: any;

    @Column({ type: 'jsonb', nullable: true })
    newValue: any;

    @Column({ nullable: true })
    storeId: string;
}
