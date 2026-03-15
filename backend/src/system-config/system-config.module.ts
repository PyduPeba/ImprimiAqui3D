import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigPublicController } from './system-config.public.controller';
import { SystemConfig } from './entities/system-config.entity';
import { Store } from './entities/store.entity';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfig, Store, AuditLog])],
  providers: [SystemConfigService],
  controllers: [SystemConfigController, SystemConfigPublicController],
  exports: [SystemConfigService],
})
export class SystemConfigModule { }
