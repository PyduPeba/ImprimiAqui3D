import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PrintJob } from './entities/print-job.entity';
import { Printer } from './entities/printer.entity';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { PrintStatus, PrinterStatus } from './enums/production.enums';
import { ProductionGateway } from './production.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../auth/enums/user-role.enum';
import { HomeAssistantService } from '../home-assistant/home-assistant.service';

@Injectable()
export class ProductionService {
    private readonly logger = new Logger(ProductionService.name);

    constructor(
        @InjectRepository(PrintJob)
        private printJobRepository: Repository<PrintJob>,
        @InjectRepository(Printer)
        private printerRepository: Repository<Printer>,
        @InjectRepository(MaintenanceLog)
        private maintenanceLogRepository: Repository<MaintenanceLog>,
        private productionGateway: ProductionGateway,
        private notificationsService: NotificationsService,
        private homeAssistantService: HomeAssistantService,
    ) { }

    async syncWithHA() {
        const telemetry = await this.homeAssistantService.getPrinters();
        if (!telemetry || telemetry.length === 0) return;

        const printers = await this.printerRepository.find();

        for (const haPrinter of telemetry) {
            // Match printer
            const dbPrinter = printers.find(p => {
                if (p.haEntityId && (p.haEntityId === haPrinter.id || p.haEntityId.includes(haPrinter.id))) return true;
                if (p.name.toLowerCase() === haPrinter.name.toLowerCase()) return true;
                
                const dbNameLower = p.name.toLowerCase();
                const haNameLower = haPrinter.name.toLowerCase();
                const haIdLower = haPrinter.id.toLowerCase();
                
                if (haIdLower.includes(dbNameLower) || dbNameLower.includes(haIdLower)) return true;
                if (haNameLower.includes(dbNameLower) || dbNameLower.includes(haNameLower)) return true;
                
                return false;
            });

            if (!dbPrinter) continue;

            // Find current job for this printer — REAL TIME CHECK to avoid duplicates
            const job = await this.printJobRepository.findOne({
                where: [
                    { printer: { id: dbPrinter.id }, status: PrintStatus.PRINTING },
                    { printer: { id: dbPrinter.id }, status: PrintStatus.WAITING },
                    { printer: { id: dbPrinter.id }, status: PrintStatus.PAUSED }
                ],
                relations: ['printer']
            });

            if (haPrinter.status === 'printing') {
                if (job && job.status !== PrintStatus.PRINTING) {
                    await this.updateJobStatus(job.id, PrintStatus.PRINTING);
                } else if (!job) {
                    // Start recording only if it's a valid file name (not empty or unknown)
                    const fileName = haPrinter.file?.trim();
                    if (!fileName || fileName === '—' || fileName === 'unknown') continue;

                    // Double check if we recently completed this EXACT file to avoid bounce spikes
                    const recentCompleted = await this.printJobRepository.findOne({
                        where: { 
                            printer: { id: dbPrinter.id }, 
                            externalFileName: fileName,
                            status: PrintStatus.COMPLETED
                        },
                        order: { completedAt: 'DESC' }
                    });

                    if (recentCompleted && (Date.now() - new Date(recentCompleted.completedAt).getTime() < 30000)) {
                        // Avoid duplicates if completed in the last 30s (anti-bounce)
                        continue;
                    }

                    // === AUTOMATIC RECORDING OF EXTERNAL PRINTS ===
                    this.logger.log(`External print detected on ${dbPrinter.name}: "${fileName}"`);
                    
                    const externalJob = this.printJobRepository.create({
                        printer: dbPrinter,
                        status: PrintStatus.PRINTING,
                        startedAt: new Date(),
                        isExternal: true,
                        externalFileName: fileName,
                        priority: 5
                    });
                    
                    await this.printJobRepository.save(externalJob);
                }
            } else if (haPrinter.status === 'paused') {
                if (job && job.status === PrintStatus.PRINTING) {
                    await this.updateJobStatus(job.id, PrintStatus.PAUSED);
                }
            } else if (haPrinter.status === 'idle') {
                if (job && job.status === PrintStatus.PRINTING) {
                    // === PASSO 3: Real Cost Calculation ===
                    const costPerMinute = dbPrinter.hourlyRate ? Number(dbPrinter.hourlyRate) / 60 : 0;
                    const durationMinutes = job.startedAt
                        ? Math.round((Date.now() - new Date(job.startedAt).getTime()) / 60000)
                        : (job.estimatedTime || 0);
                    const actualCost = parseFloat((costPerMinute * durationMinutes).toFixed(2));

                    job.actualCost = actualCost;
                    await this.printJobRepository.save(job);
                    await this.updateJobStatus(job.id, PrintStatus.COMPLETED);
                    this.logger.log(`Job ${job.id} concluded — duration: ${durationMinutes}min, cost: R$${actualCost}`);
                }

                // === PASSO 4: Smart Queue — auto-assign next WAITING job ===
                const nextJob = await this.printJobRepository.findOne({
                    where: { status: PrintStatus.WAITING, printer: { id: dbPrinter.id } },
                    order: { priority: 'ASC', createdAt: 'ASC' },
                    relations: ['printer'],
                });

                if (nextJob) {
                    // Printer is free and there's a waiting job for it — surface via socket
                    this.productionGateway.server?.emit('queue:ready-to-print', {
                        printerName: dbPrinter.name,
                        jobId: nextJob.id,
                        message: `${dbPrinter.name} está livre! Pronta para o próximo trabalho.`,
                    });
                }
            }
        }
    }

    async sendPrinterCommand(printerId: string, command: 'pause' | 'resume' | 'abort') {
        const printer = await this.printerRepository.findOne({ where: { id: printerId } });
        if (!printer) throw new NotFoundException('Impressora não encontrada');

        // Use explicit haEntityId if provided, otherwise derive from name
        const baseEntityId = printer.haEntityId || printer.name.toLowerCase().replace(/\s+/g, '_');
        await this.homeAssistantService.sendCommand(baseEntityId, command);
        this.logger.log(`Remote command "${command}" sent to printer "${printer.name}" (entity: ${baseEntityId})`);
        return { success: true, printer: printer.name, command };
    }

    async createJob(saleItemId: string, estimatedTime: number) {
        const job = this.printJobRepository.create({
            saleItemId,
            estimatedTime,
            priority: 3,
            status: PrintStatus.WAITING,
        });
        return this.printJobRepository.save(job);
    }

    async assignPrinter(jobId: string, printerId: string) {
        const job = await this.printJobRepository.findOne({ where: { id: jobId } });
        if (!job) throw new NotFoundException('Trabalho de impressão não encontrado');

        const printer = await this.printerRepository.findOne({ where: { id: printerId } });
        if (!printer) throw new NotFoundException('Impressora não encontrada');

        job.printer = printer;
        return this.printJobRepository.save(job);
    }

    async updateJobStatus(jobId: string, status: PrintStatus) {
        const job = await this.printJobRepository.findOne({
            where: { id: jobId },
            relations: ['printer']
        });
        if (!job) throw new NotFoundException('Trabalho de impressão não encontrado');

        const oldStatus = job.status;
        job.status = status;

        if (status === PrintStatus.PRINTING) {
            job.startedAt = new Date();
        } else if (status === PrintStatus.COMPLETED || status === PrintStatus.FAILED) {
            const now = new Date();
            job.completedAt = now;

            // Calculate actual time in minutes if we have a startedAt date
            if (job.startedAt) {
                const diffMs = now.getTime() - job.startedAt.getTime();
                job.actualTime = Math.round(diffMs / (1000 * 60));
            }

            // Usage Tracking: If it shifted to COMPLETED, increment printer usage
            if (status === PrintStatus.COMPLETED && job.printer) {
                const printer = await this.printerRepository.findOne({ where: { id: job.printer.id } });
                if (printer) {
                    const timeSpent = job.actualTime > 0 ? job.actualTime : job.estimatedTime;
                    printer.totalPrintTimeMinutes = Number(printer.totalPrintTimeMinutes) + Number(timeSpent);
                    printer.lastMaintenanceTimeMinutes = Number(printer.lastMaintenanceTimeMinutes) + Number(timeSpent);

                    await this.printerRepository.save(printer);

                    // Maintenance Alert
                    if (printer.lastMaintenanceTimeMinutes >= printer.maintenanceIntervalMinutes) {
                        await this.sendMaintenanceAlert(printer);
                    }
                }
            }
        }

        const savedJob = await this.printJobRepository.save(job);
        this.productionGateway.notifyStatusChange(jobId, status);

        // Notify admins about completion or failure
        if (status === PrintStatus.COMPLETED || status === PrintStatus.FAILED) {
            const admins = await this.printJobRepository.manager.find(User, {
                where: [
                    { role: UserRole.ADMIN },
                    { role: UserRole.MANAGER },
                ]
            });

            const printerName = job.printer?.name || 'Impressora desconhecida';
            const title = status === PrintStatus.COMPLETED ? 'Impressão Concluída' : '⚠️ Falha na Impressão';
            const message = status === PrintStatus.COMPLETED
                ? `O trabalho na ${printerName} foi concluído com sucesso.`
                : `Ocorreu uma falha no trabalho de impressão na ${printerName}.`;

            for (const admin of admins) {
                await this.notificationsService.create(
                    admin.id,
                    NotificationType.PRODUCTION,
                    title,
                    message
                );
            }
        }

        return savedJob;
    }

    private async sendMaintenanceAlert(printer: Printer) {
        const admins = await this.printerRepository.manager.find(User, {
            where: [
                { role: UserRole.ADMIN },
                { role: UserRole.MANAGER },
            ]
        });

        const usageHours = (printer.lastMaintenanceTimeMinutes / 60).toFixed(0);

        for (const admin of admins) {
            await this.notificationsService.create(
                admin.id,
                NotificationType.PRODUCTION,
                '🛠️ Manutenção Recomendada',
                `A impressora "${printer.name}" atingiu ${usageHours}h de uso desde a última revisão. Recomenda-se realizar manutenção preventiva.`
            );
        }
    }

    async getQueue() {
        return this.printJobRepository.find({
            relations: ['printer'],
            order: { priority: 'ASC', createdAt: 'ASC' },
        });
    }

    // Printer Management
    async findAllPrinters() {
        return this.printerRepository.find();
    }

    async findPrinterById(id: string) {
        const printer = await this.printerRepository.findOne({ where: { id } });
        if (!printer) throw new NotFoundException('Impressora não encontrada');
        return printer;
    }

    async createPrinter(data: any) {
        const { id, ...rest } = data;

        // Coerção de campos numéricos
        if (rest.buildVolumeX !== undefined) rest.buildVolumeX = Number(rest.buildVolumeX);
        if (rest.buildVolumeY !== undefined) rest.buildVolumeY = Number(rest.buildVolumeY);
        if (rest.buildVolumeZ !== undefined) rest.buildVolumeZ = Number(rest.buildVolumeZ);
        if (rest.purchasePrice !== undefined && rest.purchasePrice !== null && rest.purchasePrice !== '') {
            rest.purchasePrice = Number(rest.purchasePrice);
        } else {
            delete rest.purchasePrice;
        }

        const printer = this.printerRepository.create(rest as object);
        return this.printerRepository.save(printer);
    }

    async updatePrinter(id: string, data: any) {
        const { id: _, ...rest } = data;

        // Coerção de campos numéricos
        if (rest.buildVolumeX !== undefined) rest.buildVolumeX = Number(rest.buildVolumeX);
        if (rest.buildVolumeY !== undefined) rest.buildVolumeY = Number(rest.buildVolumeY);
        if (rest.buildVolumeZ !== undefined) rest.buildVolumeZ = Number(rest.buildVolumeZ);
        if (rest.purchasePrice !== undefined && rest.purchasePrice !== null && rest.purchasePrice !== '') {
            rest.purchasePrice = Number(rest.purchasePrice);
        } else {
            delete rest.purchasePrice;
        }

        await this.printerRepository.update(id, rest);
        return this.findPrinterById(id);
    }

    async deletePrinter(id: string) {
        const printer = await this.findPrinterById(id);
        return this.printerRepository.remove(printer);
    }

    // Maintenance Logs
    async findAllMaintenanceLogs() {
        return this.maintenanceLogRepository.find({
            relations: ['printer'],
            order: { date: 'DESC' }
        });
    }

    async findMaintenanceLogsByPrinter(printerId: string) {
        return this.maintenanceLogRepository.find({
            where: { printerId },
            order: { date: 'DESC' }
        });
    }

    async createMaintenanceLog(data: any) {
        const printer = await this.findPrinterById(data.printerId);

        const log = this.maintenanceLogRepository.create({
            ...data,
            printerUsageAtTime: printer.totalPrintTimeMinutes
        });

        const savedLog = await this.maintenanceLogRepository.save(log);

        // Reset the printer's maintenance timer
        printer.lastMaintenanceTimeMinutes = 0;
        await this.printerRepository.save(printer);

        return savedLog;
    }

    async clearCompletedJobs() {
        await this.printJobRepository.delete({
            status: In([PrintStatus.COMPLETED, PrintStatus.FAILED])
        });
        return { success: true };
    }
}
