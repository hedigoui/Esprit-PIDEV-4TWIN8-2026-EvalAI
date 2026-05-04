import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any) => void,
  ): Promise<any> {
    const { name, emails, photos, displayName } = profile;
    const email = emails?.[0]?.value;
    if (!email) {
      return done(new Error('Google did not return an email for this account'), false);
    }
    const display = typeof displayName === 'string' ? displayName.trim() : '';
    const parts = display ? display.split(/\s+/) : [];
    const firstName =
      name?.givenName ||
      (parts.length ? parts[0] : '') ||
      email.split('@')[0] ||
      'User';
    const lastName =
      name?.familyName || (parts.length > 1 ? parts.slice(1).join(' ') : '') || '';
    const user = {
      email,
      firstName,
      lastName,
      picture: photos?.[0]?.value,
      accessToken,
      provider: 'google',
    };
    done(null, user);
  }
}
