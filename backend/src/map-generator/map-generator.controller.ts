import { Controller, Post, Body, Res } from '@nestjs/common';
import { MapGeneratorService } from './map-generator.service';
import type { Response } from 'express';

@Controller('map-generator')
export class MapGeneratorController {
    constructor(private readonly mapGeneratorService: MapGeneratorService) { }

    @Post('svg')
    async generateSvg(@Body() data: any) {
        // osmData can be provided by the client (to bypass Docker network restrictions)
        return this.mapGeneratorService.generateSvg(data.bounds, data.options, data.osmData);
    }

    @Post('stl')
    async generateStl(@Body() data: any, @Res() res: Response) {
        const buffer = await this.mapGeneratorService.generateStl(data.bounds, data.options);
        res.set({
            'Content-Type': 'application/sla',
            'Content-Disposition': 'attachment; filename=memory-map.stl',
            'Content-Length': buffer.length,
        });
        res.send(buffer);
    }
}
