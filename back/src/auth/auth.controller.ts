import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { OAuthService } from './oauth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.oauthService.validateOAuthUser(req.user);
      const jwtResponse = await this.oauthService.generateJWT(user);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${jwtResponse.access_token}&user=${encodeURIComponent(JSON.stringify(jwtResponse.user))}`;

      return res.redirect(redirectUrl);
    } catch (_error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Initiates GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.oauthService.validateOAuthUser(req.user);
      const jwtResponse = await this.oauthService.generateJWT(user);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${jwtResponse.access_token}&user=${encodeURIComponent(JSON.stringify(jwtResponse.user))}`;

      return res.redirect(redirectUrl);
    } catch (_error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
}
