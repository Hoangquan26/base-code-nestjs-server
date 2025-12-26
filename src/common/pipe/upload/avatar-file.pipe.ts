import { Injectable, type PipeTransform } from '@nestjs/common';
import { FileUploadPipe } from './file-upload.pipe';

@Injectable()
export class AvatarFilePipe implements PipeTransform {
    private readonly pipe: FileUploadPipe;

    constructor() {
        this.pipe = new FileUploadPipe({
            maxSizeBytes: 2 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            fileIsRequired: true,
        });
    }

    transform(value: any) {
        return this.pipe.transform(value);
    }
}
