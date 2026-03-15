import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../auth/entities/user.entity';
import { ModelingAttachment } from './modeling-attachment.entity';
import { ModelingComment } from './modeling-comment.entity';
import { ModelingStatus, ModelingPriority, ModelingType, ModelingPurpose, DetailLevel } from '../enums/modeling.enums';

@Entity('modeling_requests')
export class ModelingRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Customer, { nullable: true })
    customer: Customer;

    @ManyToOne(() => User)
    assignedTo: User;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({
        type: 'enum',
        enum: ModelingStatus,
        default: ModelingStatus.BRIEFING,
    })
    status: ModelingStatus;

    @Column({
        type: 'enum',
        enum: ModelingPriority,
        default: ModelingPriority.MEDIUM,
    })
    priority: ModelingPriority;

    @Column({
        type: 'enum',
        enum: ModelingType,
        nullable: true,
    })
    modelingType: ModelingType;

    @Column({
        type: 'enum',
        enum: ModelingPurpose,
        nullable: true,
    })
    modelingPurpose: ModelingPurpose;

    @Column({
        type: 'enum',
        enum: DetailLevel,
        nullable: true,
    })
    detailLevel: DetailLevel;

    @Column({ nullable: true })
    dimensions: string;

    @Column({ type: 'timestamp', nullable: true })
    deadline: Date;

    @Column({ nullable: true })
    finalFileUrl: string;

    @OneToMany(() => ModelingAttachment, attachment => attachment.request, { cascade: true })
    attachments: ModelingAttachment[];

    @OneToMany(() => ModelingComment, comment => comment.request, { cascade: true })
    comments: ModelingComment[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
