import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AUTH_STRATEGY } from '../auth.constants';

@Injectable()
export class GoogleAuthGuard extends AuthGuard(AUTH_STRATEGY.GOOGLE) {}
