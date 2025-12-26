import {
    HttpStatus,
    Injectable,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    type FileValidator,
    type PipeTransform,
} from '@nestjs/common';
import { AppException } from 'src/common/error/app.exception';
import { ErrorCode } from 'src/common/error/error-code.enum';

export type FileUploadPipeOptions = {
    maxSizeBytes?: number;
    allowedMimeTypes?: string[];
    allowedFileType?: RegExp;
    fileIsRequired?: boolean;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildMimeRegex = (mimeTypes: string[]) =>
    new RegExp(`^(${mimeTypes.map(escapeRegex).join('|')})$`, 'i');

@Injectable()
export class FileUploadPipe implements PipeTransform {
    private readonly pipe: ParseFilePipe;

    constructor(options: FileUploadPipeOptions = {}) {
        const maxSize = options.maxSizeBytes ?? 20 * 1024 * 1024;
        const validators: FileValidator[] = [new MaxFileSizeValidator({ maxSize })];

        if (options.allowedFileType) {
            validators.push(new FileTypeValidator({ fileType: options.allowedFileType }));
        } else if (options.allowedMimeTypes?.length) {
            validators.push(
                new FileTypeValidator({
                    fileType: buildMimeRegex(options.allowedMimeTypes),
                }),
            );
        }

        this.pipe = new ParseFilePipe({
            validators,
            fileIsRequired: options.fileIsRequired ?? true,
            exceptionFactory: (error) =>
                new AppException(ErrorCode.VALIDATION_ERROR, String(error), HttpStatus.BAD_REQUEST),
        });
    }

    transform(value: any) {
        return this.pipe.transform(value);
    }
}
