import { Module } from '@nestjs/common';

import { HomeAssistantService } from './home-assistant.service';

@Module({
    providers: [HomeAssistantService],
    exports: [HomeAssistantService],
})
export class HomeAssistantModule {}
