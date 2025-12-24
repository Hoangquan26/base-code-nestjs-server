import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { AUTH_STRATEGY } from '../auth.constants';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, AUTH_STRATEGY.FACEBOOK) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('oauth.facebook.clientId') || 'disabled',
      clientSecret: configService.get<string>('oauth.facebook.clientSecret') || 'disabled',
      callbackURL: configService.get<string>('oauth.facebook.callbackUrl') || '',
      profileFields: ['id', 'displayName', 'emails'],
      scope: ['email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    return this.authService.validateOAuthLogin('facebook', profile, accessToken, refreshToken);
  }
}
