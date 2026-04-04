import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { Users } from '../users/users.models';
import { GoogleStrategy } from './google.strategy';
import { GithubStrategy } from './github.strategy';
import { OAuthService } from './oauth.service';
import { AuthController } from './auth.controller';
import { OauthConfiguredGuard } from './oauth-config.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users]),
    PassportModule.register({ session: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [OAuthService, GoogleStrategy, GithubStrategy, OauthConfiguredGuard],
  exports: [OAuthService],
})
export class AuthModule {}
