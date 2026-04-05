import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import {
  OAUTH_PROVIDER_KEY,
  type OauthProviderName,
} from './require-oauth.decorator';

/**
 * If OAuth client id is missing, redirect to the SPA with a clear error instead of
 * sending users to GitHub/Google with an empty client_id (their generic 404 page).
 */
@Injectable()
export class OauthConfiguredGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const provider = this.reflector.getAllAndOverride<OauthProviderName>(
      OAUTH_PROVIDER_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!provider) return true;

    const envKey =
      provider === 'google' ? 'GOOGLE_CLIENT_ID' : 'GITHUB_CLIENT_ID';
    const id = this.config.get<string>(envKey)?.trim();
    if (id) return true;

    const res = context.switchToHttp().getResponse<Response>();
    const frontend =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    res.redirect(
      302,
      `${frontend}/?error=oauth_not_configured&provider=${encodeURIComponent(provider)}`,
    );
    return false;
  }
}
