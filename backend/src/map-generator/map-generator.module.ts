import { Module } from '@nestjs/common';
import { MapGeneratorController } from './map-generator.controller';
import { MapGeneratorService } from './map-generator.service';

@Module({
    controllers: [MapGeneratorController],
    providers: [MapGeneratorService],
    exports: [MapGeneratorService],
})
export class MapGeneratorModule { }
