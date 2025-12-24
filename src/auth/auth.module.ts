import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [
        PassportModule.register({ session: false }),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const accessExpiresIn =
                    configService.get<JwtSignOptions['expiresIn']>('auth.jwt.accessExpiresIn') ??
                    '15m';
                return {
                    secret: configService.get<string>('auth.jwt.accessSecret') ?? '',
                    signOptions: {
                        expiresIn: accessExpiresIn,
                    },
                    global: true,
                };
            },
        }),
        UserModule,
    ],
    providers: [
        AuthService,
        LocalAuthGuard,
        GoogleAuthGuard,
        FacebookAuthGuard,
        JwtAuthGuard,
        LocalStrategy,
        GoogleStrategy,
        FacebookStrategy,
        JwtStrategy,
    ],
    controllers: [AuthController],
    exports: [AuthService, JwtModule, PassportModule, JwtAuthGuard],
})
export class AuthModule { }
