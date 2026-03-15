import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ModelingService } from './modeling.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModelingStatus, AttachmentType } from './enums/modeling.enums';

@Controller('modeling')
@UseGuards(JwtAuthGuard)
export class ModelingController {
    constructor(private readonly modelingService: ModelingService) { }

    @Get()
    findAll() {
        return this.modelingService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.modelingService.findOne(id);
    }

    @Post()
    create(@Body() data: any, @Request() req: any) {
        return this.modelingService.create(data, req.user.id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.modelingService.update(id, data, req.user.id);
    }

    @Put(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: ModelingStatus, @Request() req: any) {
        return this.modelingService.updateStatus(id, status, req.user.id);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.modelingService.delete(id);
    }

    @Post(':id/comments')
    addComment(
        @Param('id') id: string,
        @Body('message') message: string,
        @Request() req: any,
    ) {
        return this.modelingService.addComment(id, req.user.id, message);
    }

    @Post(':id/attachments')
    addAttachment(@Param('id') id: string, @Body() fileData: any, @Request() req: any) {
        // Ensure version is parsed if sent
        return this.modelingService.addAttachment(id, fileData, req.user.id);
    }

    @Delete('attachments/:id')
    deleteAttachment(@Param('id') id: string) {
        return this.modelingService.deleteAttachment(id);
    }

    @Post(':id/upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const requestId = req.params.id;
                const uploadPath = `./uploads/modeling/${requestId}`;
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
    async uploadFile(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any,
    ) {
        const fileData = {
            filename: file.originalname,
            url: `/uploads/modeling/${id}/${file.filename}`,
            type: AttachmentType.REFERENCE,
            size: file.size,
        };
        return this.modelingService.addAttachment(id, fileData, req.user.id);
    }

    @Post(':id/convert-to-sale')
    convertToSale(@Param('id') id: string, @Request() req: any) {
        return this.modelingService.convertToSale(id, req.user.id);
    }
}
