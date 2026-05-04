import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type AuthUser = {
  sub: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
};

type AuthedRequest = Request & { user?: AuthUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const raw = req.headers.authorization;

    if (!raw) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = raw.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthUser>(token);
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
