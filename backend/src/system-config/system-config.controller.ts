import { Controller, Get, Body, Patch, UseGuards, Request, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SystemConfigService } from './system-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('system-config')
@UseGuards(JwtAuthGuard)
export class SystemConfigController {
    constructor(private readonly configService: SystemConfigService) { }

    @Get('store')
    async getStoreSettings(@Request() req: any) {
        const storeId = req.user.storeId;
        return this.configService.getStoreConfig(storeId);
    }

    @Patch('store')
    async updateStoreSettings(@Request() req: any, @Body() settings: any) {
        const storeId = req.user.storeId;
        return this.configService.updateStoreConfig(storeId, settings, req.user);
    }

    @Post('upload-logo')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = './uploads/config';
                const fs = require('fs');
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
                cb(null, uniqueName);
            },
        }),
    }))
    async uploadLogo(@UploadedFile() file: Express.Multer.File) {
        return {
            url: `/uploads/config/${file.filename}`,
        };
    }
}
