import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
    async saveFile(file: Express.Multer.File) {
        return {
            originalname: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
        };
    }
}
