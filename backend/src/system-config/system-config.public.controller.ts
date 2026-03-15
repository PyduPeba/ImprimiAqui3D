import { Controller, Get } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';

@Controller('system-config/public')
export class SystemConfigPublicController {
    constructor(private readonly configService: SystemConfigService) { }

    @Get('branding')
    async getPublicBranding() {
        return this.configService.getPublicConfig();
    }
}
