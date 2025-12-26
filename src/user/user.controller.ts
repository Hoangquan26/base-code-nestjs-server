import {
    Body,
    Controller,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/types/auth-request';
import { AvatarFilePipe } from 'src/common/pipe/upload/avatar-file.pipe';
import { UserService } from './user.service';
import { UpdateAvatarUrlDto } from './dto';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly configService: ConfigService,
    ) { }

    @Post('avatar/upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = join(process.cwd(), 'uploads', 'avatars');
                    fs.mkdirSync(uploadPath, { recursive: true });
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const ext = extname(file.originalname || '').toLowerCase();
                    cb(null, `${randomUUID()}${ext}`);
                },
            }),
        }),
    )
    async uploadAvatar(
        @UploadedFile(AvatarFilePipe) file: Express.Multer.File,
        @Req() req: AuthRequest,
    ) {
        const appUrl = (this.configService.get<string>('app.url') ?? '').replace(
            /\/+$/,
            '',
        );
        const avatarUrl = `${appUrl}/uploads/avatars/${file.filename}`;
        const user = await this.userService.updateAvatar({
            userId: req.user.id,
            avatarUrl,
            source: 'UPLOAD',
        });

        return { avatarUrl: user.avatarUrl, source: user.avatarSource };
    }

    @Post('avatar/url')
    @UseGuards(JwtAuthGuard)
    async updateAvatarUrl(
        @Body() dto: UpdateAvatarUrlDto,
        @Req() req: AuthRequest,
    ) {
        const user = await this.userService.updateAvatar({
            userId: req.user.id,
            avatarUrl: dto.avatarUrl,
            source: dto.source,
        });

        return { avatarUrl: user.avatarUrl, source: user.avatarSource };
    }
}
