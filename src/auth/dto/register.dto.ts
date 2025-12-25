import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail({}, { message: 'Mật khẩu phải chứa ít nhất 8 ký tự' })
    email: string;

    @IsString()
    @MinLength(8, { message: 'Mật khẩu phải chứa ít nhất 8 ký tự' })
    password: string;

    @IsOptional()
    @IsString()
    name?: string;
}
