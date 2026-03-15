import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { Store } from './entities/store.entity';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class SystemConfigService {
    constructor(
        @InjectRepository(SystemConfig)
        private configRepository: Repository<SystemConfig>,
        @InjectRepository(Store)
        private storeRepository: Repository<Store>,
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) { }

    async logAction(data: {
        userId: string;
        storeId: string;
        action: string;
        entityType: string;
        entityId?: string;
        oldValue?: any;
        newValue?: any;
    }) {
        try {
            const cleanData = this.sanitizeForLog(data);
            const log = this.auditLogRepository.create(cleanData);
            return await this.auditLogRepository.save(log);
        } catch (error) {
            Logger.error(`[SystemConfig] Failed to save audit log: ${error.message}`, 'SystemConfigService');
            return null;
        }
    }

    private sanitizeForLog(obj: any): any {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(v => this.sanitizeForLog(v));
        
        const result = { ...obj };
        for (const key in result) {
            if (key === 'oldValue' || key === 'newValue') {
                result[key] = this.sanitizeForLog(result[key]);
                continue;
            }
            const val = result[key];
            if (typeof val === 'string' && val.length > 3000) {
                result[key] = val.substring(0, 100) + '... (truncated due to length)';
            } else if (typeof val === 'object') {
                result[key] = this.sanitizeForLog(val);
            }
        }
        return result;
    }

    async getStoreConfig(storeId: string) {
        const store = await this.storeRepository.findOne({ where: { id: storeId } });
        if (!store) throw new NotFoundException('Loja não encontrada');

        // Inject store info into branding settings for the frontend
        const settings = store.settings || {} as any;
        if (!settings.branding) settings.branding = {} as any;

        // Always override with official entity data
        (settings.branding as any).storeName = store.name;
        (settings.branding as any).storeEmail = store.email;
        (settings.branding as any).storePhone = store.phone;

        Logger.log(`[SystemConfig] getStoreConfig: Branding info = { name: ${store.name}, email: ${store.email}, phone: ${store.phone} }`, 'SystemConfigService');

        return settings;
    }

    async updateStoreConfig(storeId: string, settings: any, user: any) {
        const store = await this.storeRepository.findOne({ where: { id: storeId } });
        if (!store) throw new NotFoundException('Loja não encontrada');

        const oldSettings = JSON.parse(JSON.stringify(store.settings || {}));

        // Sync entity columns if present in branding updates
        if (settings.branding) {
            if (settings.branding.storeName) {
                store.name = settings.branding.storeName;
                // We keep it in the JSON for the immediate merge, but it will be overridden on next load
            }
            if (settings.branding.storeEmail) {
                store.email = settings.branding.storeEmail;
            }
            if (settings.branding.storePhone) {
                store.phone = settings.branding.storePhone;
            }
        }

        // Deep merge logic for settings (specifically for branding)
        const newBranding = {
            ...(store.settings?.branding || {}),
            ...(settings.branding || {})
        };

        store.settings = {
            ...store.settings,
            ...settings,
            branding: newBranding
        };

        const savedStore = await this.storeRepository.save(store);

        await this.logAction({
            userId: user.id,
            storeId: user.storeId,
            action: 'SETTINGS_UPDATE',
            entityType: 'Store',
            entityId: storeId,
            oldValue: oldSettings,
            newValue: settings
        });

        return savedStore;
    }

    async getPublicConfig() {
        // For now, return the first active store's branding
        const store = await this.storeRepository.findOne({
            where: { isActive: true },
            order: { createdAt: 'ASC' }
        });

        if (!store) return null;

        return {
            name: store.name,
            branding: store.settings?.branding || {}
        };
    }

    async getGlobalConfig(key: string) {
        const config = await this.configRepository.findOne({ where: { key } });
        return config ? config.value : null;
    }

    async setGlobalConfig(key: string, value: string, description?: string) {
        let config = await this.configRepository.findOne({ where: { key } });
        if (config) {
            config.value = value;
            if (description) config.description = description;
        } else {
            config = this.configRepository.create({ key, value, description });
        }
        return this.configRepository.save(config);
    }

    async findAllStores() {
        return this.storeRepository.find();
    }

    async createStore(data: any) {
        const store = this.storeRepository.create(data);
        return this.storeRepository.save(store);
    }
}
