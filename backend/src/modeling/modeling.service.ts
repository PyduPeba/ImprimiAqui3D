import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelingRequest } from './entities/modeling-request.entity';
import { ModelingAttachment } from './entities/modeling-attachment.entity';
import { ModelingComment } from './entities/modeling-comment.entity';
import { ModelingLog } from './entities/modeling-log.entity';
import { ModelingStatus } from './enums/modeling.enums';
import { SalesService } from '../sales/sales.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class ModelingService {
    constructor(
        @InjectRepository(ModelingRequest)
        private requestRepository: Repository<ModelingRequest>,
        @InjectRepository(ModelingAttachment)
        private attachmentRepository: Repository<ModelingAttachment>,
        @InjectRepository(ModelingComment)
        private commentRepository: Repository<ModelingComment>,
        @InjectRepository(ModelingLog)
        private logRepository: Repository<ModelingLog>,
        //@Inject(forwardRef(() => SalesService))
        private salesService: SalesService,
        private notificationsService: NotificationsService,
    ) { }

    async findAll() {
        return this.requestRepository.find({
            relations: ['customer', 'assignedTo', 'attachments', 'comments', 'comments.user'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string) {
        const request = await this.requestRepository.findOne({
            where: { id },
            relations: ['customer', 'assignedTo', 'attachments', 'comments', 'comments.user'],
        });
        if (!request) throw new NotFoundException('Pedido de modelagem não encontrado');
        return request;
    }

    async getLogs(requestId: string) {
        return this.logRepository.find({
            where: { request: { id: requestId } },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    async create(data: any, userId: string) {
        const { id, ...rest } = data;

        // Sanitize empty strings
        if (rest.deadline === '') rest.deadline = null;
        if (rest.dimensions === '') rest.dimensions = null;

        const request = this.requestRepository.create({
            ...rest,
            assignedTo: { id: userId } as any,
        });
        const savedRequest = (await this.requestRepository.save(request)) as unknown as ModelingRequest;

        await this.logAction(savedRequest.id, userId, 'CREATE', null, 'Pedido criado');

        // Notify creator
        await this.notificationsService.create(
            userId,
            NotificationType.MODELING,
            'Novo Pedido de Modelagem',
            `O pedido "${savedRequest.title}" foi criado com sucesso.`
        );

        return savedRequest;
    }

    async update(id: string, data: any, userId: string) {
        const { id: _, ...rest } = data;

        // Sanitize empty strings
        if (rest.deadline === '') rest.deadline = null;
        if (rest.dimensions === '') rest.dimensions = null;

        const current = await this.findOne(id);

        // Only update if there are values to change
        if (Object.keys(rest).length > 0) {
            await this.requestRepository.update(id, rest);
        }

        await this.logAction(id, userId, 'UPDATE', JSON.stringify(current), JSON.stringify(rest));

        return this.findOne(id);
    }

    async updateStatus(id: string, status: ModelingStatus, userId: string) {
        const request = await this.findOne(id);
        const oldStatus = request.status;

        await this.requestRepository.update(id, { status });

        await this.logAction(id, userId, 'STATUS_CHANGE', oldStatus, status);

        // Notify assigned user
        if (request.assignedTo && request.assignedTo.id !== userId) {
            await this.notificationsService.create(
                request.assignedTo.id,
                NotificationType.MODELING,
                'Status de Modelagem Atualizado',
                `O status do pedido "${request.title}" foi alterado para ${status}.`
            );
        }

        return this.findOne(id);
    }

    async delete(id: string) {
        const request = await this.findOne(id);
        return this.requestRepository.remove(request);
    }

    async addComment(requestId: string, userId: string, message: string) {
        try {
            const comment = this.commentRepository.create({
                request: { id: requestId } as any,
                user: { id: userId } as any,
                message,
            });
            await this.commentRepository.save(comment);

            await this.logAction(requestId, userId, 'COMMENT', null, message);

            const request = await this.findOne(requestId);
            // Notify assigned user (if someone else commented)
            if (request.assignedTo && request.assignedTo.id !== userId) {
                await this.notificationsService.create(
                    request.assignedTo.id,
                    NotificationType.MODELING,
                    'Novo Comentário em Modelagem',
                    `Um novo comentário foi adicionado ao pedido "${request.title}".`
                );
            }

            return request;
        } catch (error) {
            console.error('Error in addComment:', error);
            throw error;
        }
    }

    async addAttachment(requestId: string, fileData: any, userId: string) {
        const attachment = this.attachmentRepository.create({
            request: { id: requestId } as any,
            filename: fileData.filename,
            url: fileData.url,
            type: fileData.type,
            fileSize: fileData.size,
            version: fileData.version || 1,
        });
        await this.attachmentRepository.save(attachment);

        await this.logAction(requestId, userId, 'UPLOAD', null, fileData.filename);

        return this.findOne(requestId);
    }

    async deleteAttachment(attachmentId: string) {
        const attachment = await this.attachmentRepository.findOne({
            where: { id: attachmentId },
        });
        if (!attachment) throw new NotFoundException('Anexo não encontrado');
        return this.attachmentRepository.remove(attachment);
    }

    async convertToSale(requestId: string, userId: string) {
        const request = await this.findOne(requestId);

        // Validate status
        if (request.status !== ModelingStatus.APPROVED) {
            throw new BadRequestException('Apenas solicitações aprovadas podem ser convertidas em vendas');
        }

        // Create sale data
        const saleData = {
            customer: request.customer,
            items: [
                {
                    name: request.title,
                    description: request.description,
                    quantity: 1,
                    unitPrice: 0, // User will set price in PDV
                    weight: 0,
                }
            ],
            subtotal: 0,
            discount: 0,
            total: 0,
        };

        // Create sale
        const sale = await this.salesService.createQuotation(saleData, userId);

        // Update modeling request status to ARCHIVED
        await this.updateStatus(requestId, ModelingStatus.ARCHIVED, userId);

        return sale;
    }

    private async logAction(requestId: string, userId: string, action: string, oldValue: string | null, newValue: string | null) {
        console.log('Logging action:', { requestId, userId, action });
        try {
            await this.logRepository.insert({
                request: { id: requestId } as any,
                user: { id: userId } as any,
                action,
                oldValue: oldValue || null,
                newValue: newValue || null
            } as any);
            console.log('Log inserted successfully');
        } catch (error) {
            console.error('Error logging action:', error);
            // Don't throw error to prevent blocking main action if logging fails
        }
    }
}
