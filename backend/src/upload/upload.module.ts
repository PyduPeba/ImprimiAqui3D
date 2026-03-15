import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { GCodeParserService } from './gcode-parser.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const type = req.query.type === 'product' ? 'products' : 'stl';
          const path = `./uploads/${type}`;
          console.log('Multer: Destination path:', path);
          try {
            if (!fs.existsSync(path)) {
              console.log('Multer: Creating directory:', path);
              fs.mkdirSync(path, { recursive: true });
            }
            cb(null, path);
          } catch (err) {
            console.error('Multer: Destination error:', err);
            cb(err as Error, path);
          }
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        console.log('Multer: Filtering file:', file.originalname);
        const isImage = file.originalname.match(/\.(jpg|jpeg|png|webp)$/i);
        const is3D = file.originalname.match(/\.(stl|obj|3mf|gcode)$/i);

        if (!isImage && !is3D) {
          console.error('Multer: Unsupported format:', file.originalname);
          return cb(new Error('Formato de arquivo não suportado!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  ],
  providers: [UploadService, GCodeParserService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule { }
