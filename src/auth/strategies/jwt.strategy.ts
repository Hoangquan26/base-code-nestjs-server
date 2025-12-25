import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_STRATEGY } from '../auth.constants';
import { AuthUser } from '../types/auth-user';
import { JwtPayload } from '../types/jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, AUTH_STRATEGY.JWT) {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('auth.jwt.accessSecret') ?? '',
        });
    }

    validate(payload: JwtPayload): AuthUser {
        return {
            id: payload.sub,
            email: payload.email ?? null,
            name: payload.name ?? null,
            roles: payload.roles ?? [],
        };
    }
}
