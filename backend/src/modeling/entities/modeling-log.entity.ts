import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';
import { ModelingRequest } from './modeling-request.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('modeling_logs')
export class ModelingLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ModelingRequest)
    request: ModelingRequest;

    @ManyToOne(() => User, { nullable: true })
    user: User;

    @Column()
    action: string;

    @Column({ name: 'old_value', type: 'text', nullable: true })
    oldValue: string;

    @Column({ name: 'new_value', type: 'text', nullable: true })
    newValue: string;

    @CreateDateColumn()
    createdAt: Date;
}
