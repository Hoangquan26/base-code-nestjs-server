import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AUTH_STRATEGY } from '../auth.constants';

@Injectable()
export class FacebookAuthGuard extends AuthGuard(AUTH_STRATEGY.FACEBOOK) {}
