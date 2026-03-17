import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SalesModule } from './sales/sales.module';
import { ProductionModule } from './production/production.module';
import { InventoryModule } from './inventory/inventory.module';
import { CustomersModule } from './customers/customers.module';
import { ReportsModule } from './reports/reports.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { WorkersModule } from './workers/workers.module';
import { UploadModule } from './upload/upload.module';
import { CatalogModule } from './catalog/catalog.module';
import { ModelingModule } from './modeling/modeling.module';
import { AccessoriesModule } from './accessories/accessories.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MapGeneratorModule } from './map-generator/map-generator.module';
import { UsersModule } from './users/users.module';
import { HomeAssistantService } from './home-assistant/home-assistant.service';
import { HomeAssistantModule } from './home-assistant/home-assistant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true), // Usar true em dev, false em prod
        logging: configService.get<boolean>('DB_LOGGING', false),
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    AuthModule,
    SalesModule,
    ProductionModule,
    InventoryModule,
    CustomersModule,
    ReportsModule,
    SystemConfigModule,
    WorkersModule,
    UploadModule,
    CatalogModule,
    ModelingModule,
    AccessoriesModule,
    DashboardModule,
    NotificationsModule,
    MapGeneratorModule,
    UsersModule,
    HomeAssistantModule,
  ],
  controllers: [AppController],
  providers: [AppService, HomeAssistantService],
})
export class AppModule { }
