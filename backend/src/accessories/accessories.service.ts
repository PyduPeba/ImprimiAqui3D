import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Accessory } from './entities/accessory.entity';

@Injectable()
export class AccessoriesService {
    constructor(
        @InjectRepository(Accessory)
        private accessoryRepository: Repository<Accessory>,
    ) { }

    async findAll() {
        return this.accessoryRepository.find({
            order: { name: 'ASC' },
        });
    }

    async findByCategory(category: string) {
        return this.accessoryRepository.find({
            where: { category: category as any },
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string) {
        const accessory = await this.accessoryRepository.findOne({
            where: { id },
        });
        if (!accessory) throw new NotFoundException('Acessório não encontrado');
        return accessory;
    }

    async create(data: any) {
        const { id, ...rest } = data;
        const accessory = this.accessoryRepository.create(rest);
        return this.accessoryRepository.save(accessory);
    }

    async update(id: string, data: any) {
        const { id: _, ...rest } = data;
        await this.accessoryRepository.update(id, rest);
        return this.findOne(id);
    }

    async delete(id: string) {
        const accessory = await this.findOne(id);
        return this.accessoryRepository.remove(accessory);
    }

    async updateStock(id: string, quantity: number, manager?: any) {
        const repo = manager ? manager.getRepository(Accessory) : this.accessoryRepository;
        const accessory = await repo.findOne({ where: { id } });
        if (!accessory) throw new NotFoundException('Acessório não encontrado');

        accessory.stockQuantity += quantity;
        accessory.inStock = accessory.stockQuantity > 0;
        return repo.save(accessory);
    }

    async getTopUsed() {
        return this.accessoryRepository
            .createQueryBuilder('accessory')
            .leftJoin('sale_item_accessories', 'sia', 'sia.accessoryId = accessory.id')
            .select('accessory.id', 'id')
            .addSelect('accessory.name', 'name')
            .addSelect('accessory.unitPrice', 'unitPrice')
            .addSelect('accessory.inStock', 'inStock')
            .addSelect('accessory.stockQuantity', 'stockQuantity')
            .addSelect('COUNT(sia.id)', 'usage_count')
            .groupBy('accessory.id')
            .orderBy('usage_count', 'DESC')
            .limit(5)
            .getRawMany();
    }
}
