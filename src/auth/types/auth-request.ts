import { Request } from 'express';
import { AuthUser } from './auth-user';

export type AuthRequest = Request & { user: AuthUser };
