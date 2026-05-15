import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { OAuthService } from './oauth.service';
import { OauthConfiguredGuard } from './oauth-config.guard';
import { RequireOauthProvider } from './require-oauth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get('google')
  @RequireOauthProvider('google')
  @UseGuards(OauthConfiguredGuard, AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.oauthService.validateOAuthUser(req.user);
      const jwtResponse = await this.oauthService.generateJWT(user);

      // Redirect to frontend with token - only send minimal user data
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const minimalUser = {
        id: jwtResponse.user.id,
        role: jwtResponse.user.role,
        isActive: jwtResponse.user.isActive,
      };
      const redirectUrl = `${frontendUrl}/auth/callback?token=${jwtResponse.access_token}&user=${encodeURIComponent(JSON.stringify(minimalUser))}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      let code = 'oauth_failed';
      if (error instanceof Error) {
        if (error.message === 'OAUTH_INACTIVE') code = 'deactivated';
        else if (error.message === 'OAUTH_NO_EMAIL') code = 'oauth_email';
      }
      return res.redirect(`${frontendUrl}/?error=${code}`);
    }
  }

  @Get('github')
  @RequireOauthProvider('github')
  @UseGuards(OauthConfiguredGuard, AuthGuard('github'))
  async githubAuth() {
    // Initiates GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.oauthService.validateOAuthUser(req.user);
      const jwtResponse = await this.oauthService.generateJWT(user);

      // Redirect to frontend with token - only send minimal user data
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const minimalUser = {
        id: jwtResponse.user.id,
        role: jwtResponse.user.role,
        isActive: jwtResponse.user.isActive,
      };
      const redirectUrl = `${frontendUrl}/auth/callback?token=${jwtResponse.access_token}&user=${encodeURIComponent(JSON.stringify(minimalUser))}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      let code = 'oauth_failed';
      if (error instanceof Error) {
        if (error.message === 'OAUTH_INACTIVE') code = 'deactivated';
        else if (error.message === 'OAUTH_NO_EMAIL') code = 'oauth_email';
      }
      return res.redirect(`${frontendUrl}/?error=${code}`);
    }
  }
}
