import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
} from 'typeorm';

@Entity('system_configs')
export class SystemConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    key: string;

    @Column({ type: 'text', nullable: true })
    value: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @UpdateDateColumn()
    updatedAt: Date;
}
