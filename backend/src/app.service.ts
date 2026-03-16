import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { SystemConfigService } from './system-config/system-config.service';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private authService: AuthService,
    private configService: SystemConfigService
  ) { }

  getHello(): string {
    return 'ImprimiAqui3D API is running!';
  }

  async onModuleInit() {
    await this.seedInitialAdmin();
  }

  private async seedInitialAdmin() {
    try {
      this.logger.log('Checking for initial store and admin user...');

      let stores = await this.configService.findAllStores();
      let defaultStore;
      if (stores.length === 0) {
        this.logger.log('Creating default store...');
        defaultStore = await this.configService.createStore({
            name: 'Minha Loja 3D',
            email: 'contato@minhaloja.com'
        });
      } else {
        defaultStore = stores[0];
      }

      await this.authService.createInitialAdmin(
        'admin@imprimiaqui3d.com.br',
        'admin123',
      );

      await this.authService.updateUserStore('admin@imprimiaqui3d.com.br', defaultStore.id);

      this.logger.log('Seed check completed.');
    } catch (error) {
      this.logger.error('Error seeding initial admin:', error);
    }
  }
}
