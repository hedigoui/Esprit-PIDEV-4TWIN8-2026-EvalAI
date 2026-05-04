import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || '',
      callbackURL:
        configService.get<string>('GITHUB_CALLBACK_URL') ||
        'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any) => void,
  ): Promise<any> {
    const { username, emails, photos, id } = profile;
    const primary =
      emails?.find((e: { primary?: boolean; value?: string }) => e.primary)?.value ||
      emails?.[0]?.value;
    const email =
      primary ||
      (username && id != null
        ? `${id}+${username}@users.noreply.github.com`
        : null);
    if (!email) {
      return done(
        new Error('GitHub did not return an email; try making your email public or use Google.'),
        false,
      );
    }
    const nameParts = profile.displayName?.split(/\s+/) ?? [];
    const user = {
      email,
      username,
      firstName: nameParts[0] || username || 'User',
      lastName:
        nameParts.slice(1).join(' ') || profile.name?.familyName || '',
      picture: photos?.[0]?.value,
      accessToken,
      provider: 'github',
    };
    done(null, user);
  }
}
