import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Material } from './entities/material.entity';
import { MaterialMovement, MovementType } from './entities/material-movement.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../auth/enums/user-role.enum';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(Material)
        private materialRepository: Repository<Material>,
        @InjectRepository(MaterialMovement)
        private movementRepository: Repository<MaterialMovement>,
        private dataSource: DataSource,
        private notificationsService: NotificationsService,
        private systemConfigService: SystemConfigService,
    ) { }

    async createMaterial(data: any, user: any) {
        const { id, ...rest } = data;
        const material = this.materialRepository.create(rest as object);
        const savedMaterial = await this.materialRepository.save(material);

        await this.systemConfigService.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'CREATE',
            entityType: 'Material',
            entityId: savedMaterial.id,
            newValue: savedMaterial
        });

        return savedMaterial;
    }

    async updateMaterial(id: string, data: any, user: any) {
        try {
            const { id: _, ...rest } = data;
            Logger.log(`[Inventory] Updating material ${id}. Image size: ${rest.imageUrl?.length || 0}`, 'InventoryService');
            
            const oldMaterial = await this.materialRepository.findOne({ where: { id } });
            if (!oldMaterial) {
                Logger.warn(`[Inventory] Material ${id} not found for update`, 'InventoryService');
                throw new NotFoundException('Material não encontrado');
            }

            Logger.log(`[Inventory] Applying update to repository for ${id}...`, 'InventoryService');
            await this.materialRepository.update(id, rest);
            
            Logger.log(`[Inventory] Reloading updated material ${id}...`, 'InventoryService');
            const updatedMaterial = await this.materialRepository.findOne({ where: { id } });

            Logger.log(`[Inventory] Logging action for ${id}...`, 'InventoryService');
            await this.systemConfigService.logAction({
                userId: user.id,
                storeId: user.storeId,
                action: 'UPDATE',
                entityType: 'Material',
                entityId: id,
                oldValue: oldMaterial,
                newValue: updatedMaterial
            });

            Logger.log(`[Inventory] Update successful for ${id}`, 'InventoryService');
            return updatedMaterial;
        } catch (error) {
            Logger.error(`[Inventory] Error in updateMaterial for ${id}: ${error.message}`, error.stack, 'InventoryService');
            throw new BadRequestException(`Erro no servidor: ${error.message}`);
        }
    }

    async addStock(materialId: string, amount: number, reason: string, user?: any) {
        const result = await this.updateStock(materialId, amount, MovementType.IN, reason);

        if (user) {
            await this.systemConfigService.logAction({
                userId: user.id,
                storeId: user.storeId,
                action: 'STOCK_IN',
                entityType: 'Material',
                entityId: materialId,
                newValue: { amount, reason }
            });
        }

        return result;
    }

    async removeStock(materialId: string, amount: number, reason: string, referenceId?: string, manager?: any, user?: any) {
        const result = await this.updateStock(materialId, amount, MovementType.OUT, reason, referenceId, manager);

        if (user) {
            await this.systemConfigService.logAction({
                userId: user.id,
                storeId: user.storeId,
                action: 'STOCK_OUT',
                entityType: 'Material',
                entityId: materialId,
                newValue: { amount, reason, referenceId }
            });
        }

        return result;
    }

    private async updateStock(
        materialId: string,
        amount: number,
        type: MovementType,
        reason: string,
        referenceId?: string,
        manager?: any,
    ) {
        if (manager) {
            return this.performUpdateStock(manager, materialId, amount, type, reason, referenceId);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const result = await this.performUpdateStock(queryRunner.manager, materialId, amount, type, reason, referenceId);
            await queryRunner.commitTransaction();
            return result;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    private async performUpdateStock(
        manager: any,
        materialId: string,
        amount: number,
        type: MovementType,
        reason: string,
        referenceId?: string,
    ) {
        const materialRepo = manager.getRepository(Material);
        const movementRepo = manager.getRepository(MaterialMovement);

        const material = await materialRepo.findOne({ where: { id: materialId } });
        if (!material) throw new NotFoundException('Material não encontrado');

        const movement = movementRepo.create({
            material,
            type,
            amount,
            reason,
            referenceId,
        });

        await manager.save(movement);

        if (type === MovementType.IN) {
            material.stockWeight = Number(material.stockWeight) + Number(amount);
        } else {
            material.stockWeight = Number(material.stockWeight) - Number(amount);
        }

        const updatedMaterial = await manager.save(material);

        // Check for low stock alert (async notification, don't block)
        this.checkLowStock(updatedMaterial, manager).catch(console.error);

        return updatedMaterial;
    }

    private async checkLowStock(updatedMaterial: Material, manager: any) {
        if (updatedMaterial.stockWeight <= updatedMaterial.minStockAlert) {
            const admins = await manager.find(User, {
                where: [
                    { role: UserRole.ADMIN },
                    { role: UserRole.MANAGER },
                ]
            });

            for (const admin of admins) {
                await this.notificationsService.create(
                    admin.id,
                    NotificationType.STOCK,
                    'Alerta de Estoque Baixo',
                    `O material "${updatedMaterial.name}" atingiu o nível crítico (${updatedMaterial.stockWeight}g).`
                );
            }
        }
    }

    async getInventory() {
        return this.materialRepository.find();
    }

    async getMovements(materialId?: string) {
        return this.movementRepository.find({
            where: materialId ? { material: { id: materialId } } : {},
            order: { createdAt: 'DESC' },
            relations: ['material']
        });
    }
}
