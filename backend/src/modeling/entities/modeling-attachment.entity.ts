import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';
import { ModelingRequest } from './modeling-request.entity';
import { ModelingComment } from './modeling-comment.entity';
import { AttachmentType } from '../enums/modeling.enums';

@Entity('modeling_attachments')
export class ModelingAttachment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ModelingRequest, request => request.attachments)
    request: ModelingRequest;

    @Column()
    filename: string;

    @Column()
    url: string;

    @Column({
        type: 'enum',
        enum: AttachmentType,
        default: AttachmentType.REFERENCE,
    })
    type: AttachmentType;

    @Column({ default: 1 })
    version: number;

    @ManyToOne(() => ModelingComment, { nullable: true })
    comment: ModelingComment;

    @Column({ type: 'bigint', nullable: true })
    fileSize: number;

    @CreateDateColumn()
    uploadedAt: Date;
}
