import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { AuthService } from './auth/auth.service';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(private authService: AuthService) { }

  getHello(): string {
    return 'ImprimiAqui3D API is running!';
  }

  async onModuleInit() {
    await this.seedInitialAdmin();
  }

  private async seedInitialAdmin() {
    try {
      this.logger.log('Checking for initial admin user...');
      await this.authService.createInitialAdmin(
        'admin@imprimiaqui3d.com.br',
        'admin123',
      );
      this.logger.log('Seed check completed.');
    } catch (error) {
      this.logger.error('Error seeding initial admin:', error);
    }
  }
}
