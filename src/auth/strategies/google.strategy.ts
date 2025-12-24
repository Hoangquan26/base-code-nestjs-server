import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AUTH_STRATEGY } from '../auth.constants';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, AUTH_STRATEGY.GOOGLE) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('oauth.google.clientId') || 'disabled',
      clientSecret: configService.get<string>('oauth.google.clientSecret') || 'disabled',
      callbackURL: configService.get<string>('oauth.google.callbackUrl') || '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    return this.authService.validateOAuthLogin('google', profile, accessToken, refreshToken);
  }
}
