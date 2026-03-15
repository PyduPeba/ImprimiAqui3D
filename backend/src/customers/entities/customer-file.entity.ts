import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customer_files')
export class CustomerFile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Customer, (customer) => customer.files)
    customer: Customer;

    @Column()
    originalName: string;

    @Column()
    fileName: string; // Internal name on disk

    @Column()
    filePath: string;

    @Column({ nullable: true })
    fileSize: number;

    @CreateDateColumn()
    createdAt: Date;
}
