import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private customerRepository: Repository<Customer>,
    ) { }

    async findAll() {
        return this.customerRepository.find({ order: { name: 'ASC' } });
    }

    async findOne(id: string) {
        const customer = await this.customerRepository.findOne({ where: { id } });
        if (!customer) throw new NotFoundException('Cliente não encontrado');
        return customer;
    }

    async create(data: any) {
        const { id, ...rest } = data;
        const customer = this.customerRepository.create(rest as object);
        return this.customerRepository.save(customer);
    }

    async update(id: string, data: any) {
        const { id: _, ...rest } = data;
        await this.customerRepository.update(id, rest);
        return this.findOne(id);
    }

    async delete(id: string) {
        const customer = await this.findOne(id);
        return this.customerRepository.remove(customer);
    }
}
