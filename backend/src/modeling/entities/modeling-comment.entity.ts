import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';
import { ModelingRequest } from './modeling-request.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('modeling_comments')
export class ModelingComment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ModelingRequest, request => request.comments)
    request: ModelingRequest;

    @ManyToOne(() => User)
    user: User;

    @Column({ type: 'text' })
    message: string;

    @CreateDateColumn()
    createdAt: Date;
}
