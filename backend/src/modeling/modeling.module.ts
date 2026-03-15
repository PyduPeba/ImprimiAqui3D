import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelingService } from './modeling.service';
import { ModelingController } from './modeling.controller';
import { ModelingRequest } from './entities/modeling-request.entity';
import { ModelingAttachment } from './entities/modeling-attachment.entity';
import { ModelingComment } from './entities/modeling-comment.entity';
import { ModelingLog } from './entities/modeling-log.entity';
import { SalesModule } from '../sales/sales.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ModelingRequest,
            ModelingAttachment,
            ModelingComment,
            ModelingLog,
        ]),
        forwardRef(() => SalesModule),
        NotificationsModule,
    ],
    providers: [ModelingService],
    controllers: [ModelingController],
    exports: [ModelingService],
})
export class ModelingModule { }
