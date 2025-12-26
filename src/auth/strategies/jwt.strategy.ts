import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_STRATEGY } from '../auth.constants';
import type { AuthUser } from '../types/auth-user';
import { JwtPayload } from '../types/jwt-payload';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, AUTH_STRATEGY.JWT) {
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UserService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('auth.jwt.accessSecret') ?? '',
        });
    }

    async validate(payload: JwtPayload): Promise<AuthUser> {
        const user = await this.usersService.findById(payload.sub);
        if (!user) {
            return {
                id: payload.sub,
                email: payload.email ?? null,
                name: payload.name ?? null,
                roles: payload.roles ?? [],
                avatarUrl: payload.avatarUrl ?? null,
                avatarSource: payload.avatarSource ?? null,
            };
        }
        return {
            id: payload.sub,
            email: user.email ?? payload.email ?? null,
            name: user.name ?? payload.name ?? null,
            roles: payload.roles ?? [],
            avatarUrl: user.avatarUrl ?? payload.avatarUrl ?? null,
            avatarSource: user.avatarSource ?? payload.avatarSource ?? null,
        };
    }
}
