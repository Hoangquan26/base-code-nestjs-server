import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { compare, hash } from 'bcryptjs';
import { UserService, UserRecord, UserTokenType } from '../user/user.service';
import {
    encryptSecret,
    decryptSecret,
    hashToken,
    randomOtp,
    randomToken,
} from './utils/auth-crypto';
import { RegisterDto } from './dto';
import { AuthUser } from './types/auth-user';
import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UserService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) { }

    async registerLocal(dto: RegisterDto): Promise<AuthUser> {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new ConflictException('Email already registered');
        }
        const rounds = this.configService.get<number>('auth.bcryptRounds') ?? 12;
        const passwordHash = await hash(dto.password, rounds);
        const user = await this.usersService.createLocalUser({
            email: dto.email,
            passwordHash,
            name: dto.name ?? null,
        });
        return this.sanitizeUser(user);
    }

    async validateLocalUser(email: string, password: string): Promise<AuthUser | null> {
        const user = await this.usersService.findByEmail(email);
        if (!user?.passwordHash) {
            return null;
        }
        const isValid = await this.verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return null;
        }
        return this.sanitizeUser(user);
    }

    async loginUser(user: AuthUser) {
        return this.issueTokens(user);
    }

    async refreshTokens(refreshToken: string) {
        const refreshSecret = this.configService.get<string>('auth.jwt.refreshSecret') ?? '';
        let payload: JwtPayload;
        try {
            payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
                secret: refreshSecret,
            });
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
        const user = await this.usersService.findById(payload.sub);
        if (!user) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        return this.issueTokens(this.sanitizeUser(user));
    }

    async requestPasswordReset(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return { message: 'If the account exists, a reset token has been created.' };
        }
        const ttlMinutes =
            this.configService.get<number>('auth.tokens.passwordResetTtlMin') ?? 15;
        const token = randomToken(32);
        await this.createUserToken(user.id, 'PASSWORD_RESET', token, ttlMinutes);
        if (this.isProduction()) {
            return { message: 'If the account exists, a reset token has been created.' };
        }
        return { message: 'Password reset token created.', token };
    }

    async resetPassword(token: string, newPassword: string) {
        const tokenRecord = await this.consumeToken('PASSWORD_RESET', token);
        if (!tokenRecord) {
            throw new BadRequestException('Invalid or expired token');
        }
        const rounds = this.configService.get<number>('auth.bcryptRounds') ?? 12;
        const passwordHash = await hash(newPassword, rounds);
        await this.usersService.updatePassword(tokenRecord.userId, passwordHash);
        return { message: 'Password updated' };
    }

    async requestEmailOtp(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return { message: 'If the account exists, an OTP has been created.' };
        }
        const ttlMinutes =
            this.configService.get<number>('auth.tokens.emailVerifyTtlMin') ?? 30;
        const otp = randomOtp(6);
        await this.createUserToken(user.id, 'EMAIL_VERIFY', otp, ttlMinutes);
        if (this.isProduction()) {
            return { message: 'If the account exists, an OTP has been created.' };
        }
        return { message: 'OTP created.', otp };
    }

    async verifyEmailOtp(email: string, code: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const tokenRecord = await this.consumeToken('EMAIL_VERIFY', code, user.id);
        if (!tokenRecord) {
            throw new BadRequestException('Invalid or expired OTP');
        }
        await this.usersService.verifyEmail(user.id);
        return { message: 'Email verified' };
    }

    async setupTwoFactor(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const issuer = this.configService.get<string>('twoFactor.issuer') ?? 'Vincenza';
        const period = this.configService.get<number>('twoFactor.period') ?? 30;
        const digits = this.configService.get<number>('twoFactor.digits') ?? 6;
        authenticator.options = { step: period, digits };
        const secret = authenticator.generateSecret();
        const label = user.email ?? user.id;
        const otpauthUrl = authenticator.keyuri(label, issuer, secret);
        const encryptionKey =
            this.configService.get<string>('twoFactor.encryptionKey') ?? '';
        const secretEncrypted = encryptSecret(secret, encryptionKey);
        await this.usersService.saveTwoFactorSecret(user.id, secretEncrypted);
        return { otpauthUrl, secret };
    }

    async verifyTwoFactor(userId: string, code: string) {
        const user = await this.usersService.findById(userId);
        if (!user?.twoFactorSecretEncrypted) {
            throw new NotFoundException('Two-factor not configured');
        }
        const isValid = this.verifyTwoFactorCode(code, user.twoFactorSecretEncrypted);
        if (!isValid) {
            throw new BadRequestException('Invalid OTP');
        }
        await this.usersService.enableTwoFactor(userId);
        return { message: 'Two-factor enabled' };
    }

    async disableTwoFactor(userId: string, code: string) {
        const user = await this.usersService.findById(userId);
        if (!user?.twoFactorSecretEncrypted) {
            throw new NotFoundException('Two-factor not configured');
        }
        const isValid = this.verifyTwoFactorCode(code, user.twoFactorSecretEncrypted);
        if (!isValid) {
            throw new BadRequestException('Invalid OTP');
        }
        await this.usersService.disableTwoFactor(userId);
        return { message: 'Two-factor disabled' };
    }

    async validateOAuthLogin(
        provider: 'google' | 'facebook',
        profile: { id: string; emails?: { value: string }[]; displayName?: string },
        accessToken?: string,
        refreshToken?: string,
    ): Promise<AuthUser> {
        const email = profile.emails?.[0]?.value ?? null;
        const user = await this.usersService.upsertOAuthUser({
            provider,
            providerAccountId: profile.id,
            email,
            name: profile.displayName ?? null,
            accessToken,
            refreshToken,
        });
        return this.sanitizeUser(user);
    }

    private verifyTwoFactorCode(code: string, secretEncrypted: string) {
        const period = this.configService.get<number>('twoFactor.period') ?? 30;
        const digits = this.configService.get<number>('twoFactor.digits') ?? 6;
        authenticator.options = { step: period, digits };
        const encryptionKey =
            this.configService.get<string>('twoFactor.encryptionKey') ?? '';
        const secret = decryptSecret(secretEncrypted, encryptionKey);
        return authenticator.check(code, secret);
    }

    private async createUserToken(
        userId: string,
        type: UserTokenType,
        token: string,
        ttlMinutes: number,
    ) {
        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
        await this.usersService.createToken({
            userId,
            type,
            tokenHash,
            expiresAt,
        });
    }

    private async consumeToken(type: UserTokenType, token: string, userId?: string) {
        const tokenHash = hashToken(token);
        return this.usersService.consumeToken(type, tokenHash, userId);
    }

    private isProduction() {
        return (this.configService.get<string>('app.env') ?? 'development') === 'production';
    }

    private async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
        if (!password || !passwordHash) {
            return false;
        }
        return compare(password, passwordHash);
    }

    private async issueTokens(user: AuthUser) {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email ?? null,
            name: user.name ?? null,
            roles: user.roles ?? [],
        };
        const accessSecret = this.configService.get<string>('auth.jwt.accessSecret') ?? '';
        const accessExpiresIn =
            this.configService.get<JwtSignOptions['expiresIn']>('auth.jwt.accessExpiresIn') ??
            '15m';
        const refreshSecret = this.configService.get<string>('auth.jwt.refreshSecret') ?? '';
        const refreshExpiresIn =
            this.configService.get<JwtSignOptions['expiresIn']>('auth.jwt.refreshExpiresIn') ??
            '30d';
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: accessSecret,
                expiresIn: accessExpiresIn,
            }),
            this.jwtService.signAsync(
                { sub: user.id },
                {
                    secret: refreshSecret,
                    expiresIn: refreshExpiresIn,
                },
            ),
        ]);
        return {
            user,
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: accessExpiresIn,
        };
    }

    private sanitizeUser(user: UserRecord): AuthUser {
        return {
            id: user.id,
            email: user.email,
            name: user.name ?? null,
            roles: user.roles,
        };
    }
}
