import { Injectable } from '@nestjs/common';
import { User, UserTokenType } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }

    // =========================
    // User
    // =========================

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
    }

    async findById(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
        });
    }

    async createLocalUser(payload: {
        email: string;
        passwordHash: string;
        name?: string | null;
    }) {
        return this.prisma.user.create({
            data: {
                email: payload.email.toLowerCase(),
                passwordHash: payload.passwordHash,
                name: payload.name ?? null,
                emailVerifiedAt: null,
                status: 'ACTIVE',
            },
        });
    }

    async updatePassword(userId: string, passwordHash: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    }

    async verifyEmail(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { emailVerifiedAt: new Date() },
        });
    }

    // =========================
    // UserToken
    // =========================

    async createToken(payload: {
        userId: string;
        type: UserTokenType;
        tokenHash: string;
        expiresAt: Date;
    }) {
        return this.prisma.userToken.create({
            data: {
                userId: payload.userId,
                type: payload.type,
                tokenHash: payload.tokenHash,
                expiresAt: payload.expiresAt,
            },
        });
    }

    async consumeToken(
        type: UserTokenType,
        tokenHash: string,
        userId?: string,
    ) {
        const token = await this.prisma.userToken.findFirst({
            where: {
                type,
                tokenHash,
                usedAt: null,
                expiresAt: { gt: new Date() },
                ...(userId ? { userId } : {}),
            },
        });

        if (!token) {
            return null;
        }

        return this.prisma.userToken.update({
            where: { id: token.id },
            data: { usedAt: new Date() },
        });
    }

    // =========================
    // Two Factor
    // =========================

    async saveTwoFactorSecret(userId: string, secretEncrypted: string) {
        return this.prisma.userTwoFactor.upsert({
            where: { userId },
            update: {
                secretEncrypted,
                enabledAt: null,
                verifiedAt: null,
            },
            create: {
                userId,
                secretEncrypted,
            },
        });
    }

    async enableTwoFactor(userId: string) {
        return this.prisma.userTwoFactor.update({
            where: { userId },
            data: {
                enabledAt: new Date(),
            },
        });
    }

    async disableTwoFactor(userId: string) {
        await this.prisma.userTwoFactor.delete({
            where: { userId },
        });
        return true;
    }

    // =========================
    // OAuth
    // =========================

    async upsertOAuthUser(payload: {
        provider: string;
        providerAccountId: string;
        email: string | null;
        name: string | null;
        accessToken?: string;
        refreshToken?: string;
    }) {
        const existingAccount =
            await this.prisma.userOAuthAccount.findUnique({
                where: {
                    provider_providerAccountId: {
                        provider: payload.provider,
                        providerAccountId: payload.providerAccountId,
                    },
                },
                include: { user: true },
            });

        if (existingAccount) {
            return existingAccount.user;
        }

        let user : null | User = null;

        if (payload.email) {
            user = await this.prisma.user.findUnique({
                where: { email: payload.email.toLowerCase() },
            });
        }

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: payload.email?.toLowerCase() ?? null,
                    name: payload.name,
                    emailVerifiedAt: payload.email ? new Date() : null,
                },
            });
        }
        if (user) {
            await this.prisma.userOAuthAccount.create({
                data: {
                    userId: user.id,
                    provider: payload.provider,
                    providerAccountId: payload.providerAccountId,
                    accessToken: payload.accessToken,
                    refreshToken: payload.refreshToken,
                },
            });
        }

        return user;
    }
}
