import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { In } from 'typeorm';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
    ) { }

    async create(userId: string, type: NotificationType, title: string, message: string) {
        const notification = this.notificationRepository.create({
            user: { id: userId } as any,
            type,
            title,
            message,
        });
        return this.notificationRepository.save(notification);
    }

    async findByUser(userId: string) {
        return this.notificationRepository.find({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
            take: 50, // Limit to last 50 notifications
        });
    }

    async getUnreadCount(userId: string) {
        return this.notificationRepository.count({
            where: {
                user: { id: userId },
                read: false,
            },
        });
    }

    async markAsRead(id: string) {
        await this.notificationRepository.update(id, { read: true });
        return this.notificationRepository.findOne({ where: { id } });
    }

    async markAllAsRead(userId: string) {
        const userRelation = this.notificationRepository.metadata.relations.find((r: any) => r.propertyName === 'user');
        const userColumn = userRelation?.joinColumns[0].databaseName || 'userId';

        await this.notificationRepository
            .createQueryBuilder()
            .update(Notification)
            .set({ read: true })
            .where(`${userColumn} = :userId`, { userId })
            .andWhere("read = :read", { read: false })
            .execute();

        return { success: true };
    }

    async findProductionAlerts(limit = 10) {
        return this.notificationRepository.find({
            where: { type: NotificationType.PRODUCTION },
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['user'],
        });
    }
}
