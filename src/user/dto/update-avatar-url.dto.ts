import { IsIn, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateAvatarUrlDto {
    @IsString()
    @IsNotEmpty()
    @IsUrl(
        { require_protocol: true, protocols: ['http', 'https'] },
        { message: 'Avatar URL is invalid' },
    )
    avatarUrl: string;

    @IsString()
    @IsIn(['S3', 'SOCIAL'])
    source: 'S3' | 'SOCIAL';
}
