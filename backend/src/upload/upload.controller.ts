import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    UseGuards,
    Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as express from 'express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { GCodeParserService } from './gcode-parser.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(
        private readonly uploadService: UploadService,
        private readonly gcodeParser: GCodeParserService,
    ) { }

    @Post('stl')
    @UseInterceptors(FileInterceptor('file'))
    async uploadStl(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Arquivo não enviado');
        }

        const result = await this.uploadService.saveFile(file);

        let metadata = null;
        if (file.originalname.toLowerCase().endsWith('.gcode')) {
            metadata = await this.gcodeParser.parseFile(file.path);
        }

        return {
            ...result,
            metadata,
        };
    }

    /**
     * Image upload for product catalog.
     * Uses its own inline memoryStorage config so it is completely
     * independent of any global MulterModule/bodyParser configuration.
     */
    @Post('image')
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any
    ) {
        console.log('UploadController [image]: Received request');
        console.log('UploadController [image]: Content-Type:', req.headers['content-type']);
        console.log('UploadController [image]: All Headers:', JSON.stringify(req.headers, null, 2));

        if (!file) {
            console.error('UploadController [image]: No file in request');
            // Check if there is anything in req.body
            console.log('UploadController [image]: req.body:', JSON.stringify(req.body, null, 2));
            throw new BadRequestException('Imagem não enviada');
        }

        console.log('UploadController [image]: File received:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        });

        // Validate file type
        const validExtensions = /\.(jpg|jpeg|png|webp)$/i;
        if (!validExtensions.test(file.originalname)) {
            throw new BadRequestException('Formato inválido. Use: jpg, jpeg, png ou webp');
        }

        // Ensure the destination directory exists
        const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
        if (!fs.existsSync(uploadsDir)) {
            console.log('UploadController [image]: Creating directory:', uploadsDir);
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate a unique filename and write the buffer to disk
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath = path.join(uploadsDir, uniqueName);

        fs.writeFileSync(filePath, file.buffer);
        console.log('UploadController [image]: Saved to:', filePath);

        const relativeUrl = `/uploads/products/${uniqueName}`;

        return {
            filename: uniqueName,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            url: relativeUrl,
        };
    }
}
