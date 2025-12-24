import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type UserTokenType = 'EMAIL_VERIFY' | 'PASSWORD_RESET' | 'CHANGE_EMAIL' | 'MFA_CHALLENGE';

export type UserRecord = {
  id: string;
  email: string | null;
  passwordHash?: string | null;
  name?: string | null;
  roles?: string[];
  emailVerifiedAt?: Date | null;
  twoFactorSecretEncrypted?: string | null;
  twoFactorEnabled?: boolean;
};

type UserTokenRecord = {
  userId: string;
  type: UserTokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
};

type OAuthAccountRecord = {
  provider: string;
  providerAccountId: string;
  userId: string;
  accessToken?: string;
  refreshToken?: string;
};

@Injectable()
export class UserService {
  private readonly users = new Map<string, UserRecord>();
  private readonly usersByEmail = new Map<string, string>();
  private readonly tokens = new Map<string, UserTokenRecord>();
  private readonly oauthAccounts = new Map<string, OAuthAccountRecord>();

  async findByEmail(email: string): Promise<UserRecord | null> {
    const key = email.toLowerCase();
    const userId = this.usersByEmail.get(key);
    return userId ? this.users.get(userId) ?? null : null;
  }

  async findById(userId: string): Promise<UserRecord | null> {
    return this.users.get(userId) ?? null;
  }

  async createLocalUser(payload: {
    email: string;
    passwordHash: string;
    name?: string | null;
  }): Promise<UserRecord> {
    const id = randomUUID();
    const email = payload.email.toLowerCase();
    const user: UserRecord = {
      id,
      email,
      passwordHash: payload.passwordHash,
      name: payload.name ?? null,
      roles: [],
      emailVerifiedAt: null,
      twoFactorEnabled: false,
      twoFactorSecretEncrypted: null,
    };
    this.users.set(id, user);
    this.usersByEmail.set(email, id);
    return user;
  }

  async updatePassword(userId: string, passwordHash: string) {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }
    user.passwordHash = passwordHash;
    return user;
  }

  async verifyEmail(userId: string) {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }
    user.emailVerifiedAt = new Date();
    return user;
  }

  async createToken(record: UserTokenRecord) {
    const key = `${record.type}:${record.tokenHash}`;
    this.tokens.set(key, { ...record, usedAt: null });
    return record;
  }

  async consumeToken(type: UserTokenType, tokenHash: string, userId?: string) {
    const key = `${type}:${tokenHash}`;
    const token = this.tokens.get(key);
    if (!token) {
      return null;
    }
    if (userId && token.userId !== userId) {
      return null;
    }
    if (token.usedAt) {
      return null;
    }
    if (token.expiresAt.getTime() < Date.now()) {
      return null;
    }
    token.usedAt = new Date();
    return token;
  }

  async saveTwoFactorSecret(userId: string, secretEncrypted: string) {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }
    user.twoFactorSecretEncrypted = secretEncrypted;
    user.twoFactorEnabled = false;
    return user;
  }

  async enableTwoFactor(userId: string) {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }
    user.twoFactorEnabled = true;
    return user;
  }

  async disableTwoFactor(userId: string) {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }
    user.twoFactorEnabled = false;
    user.twoFactorSecretEncrypted = null;
    return user;
  }

  async upsertOAuthUser(payload: {
    provider: string;
    providerAccountId: string;
    email: string | null;
    name: string | null;
    accessToken?: string;
    refreshToken?: string;
  }): Promise<UserRecord> {
    const key = `${payload.provider}:${payload.providerAccountId}`;
    const existingAccount = this.oauthAccounts.get(key);
    if (existingAccount) {
      return this.users.get(existingAccount.userId) as UserRecord;
    }
    let user: UserRecord | null = null;
    if (payload.email) {
      user = await this.findByEmail(payload.email);
    }
    if (!user) {
      const id = randomUUID();
      user = {
        id,
        email: payload.email,
        passwordHash: null,
        name: payload.name,
        roles: [],
        emailVerifiedAt: payload.email ? new Date() : null,
        twoFactorEnabled: false,
        twoFactorSecretEncrypted: null,
      };
      this.users.set(id, user);
      if (payload.email) {
        this.usersByEmail.set(payload.email.toLowerCase(), id);
      }
    }
    this.oauthAccounts.set(key, {
      provider: payload.provider,
      providerAccountId: payload.providerAccountId,
      userId: user.id,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
    return user;
  }
}
