import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ReclamationsService } from './reclamations.service';
import { ReclamationStatus } from './reclamations.models';
import { UserRole } from '../users/users.models';
import type { Request } from 'express';
import type { AuthUser } from '../auth/jwt-auth.guard';

@Controller('reclamations')
export class ReclamationsController {
  constructor(private readonly reclamationsService: ReclamationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async create(
    @Req() req: Request & { user?: AuthUser },
    @Body() body: { title: string; description: string; category?: string },
  ) {
    const studentId = req.user?.sub;
    if (!studentId) throw new BadRequestException('Invalid token payload');
    return await this.reclamationsService.create(studentId, body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async findMine(@Req() req: Request & { user?: AuthUser }) {
    const studentId = req.user?.sub;
    if (!studentId) throw new BadRequestException('Invalid token payload');
    return await this.reclamationsService.findMine(studentId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  async findAll(@Query('status') status?: string) {
    const parsed = status ? this.parseStatus(status) : undefined;
    return await this.reclamationsService.findAll(parsed);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Req() req: Request & { user?: AuthUser }, @Param('id') id: string) {
    const requesterId = req.user?.sub;
    const requesterRole = req.user?.role as UserRole | undefined;

    if (!requesterId || !requesterRole) {
      throw new BadRequestException('Invalid token payload');
    }

    return await this.reclamationsService.findOneForUser({
      reclamationId: id,
      requesterId,
      requesterRole,
    });
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  async updateStatus(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
    @Body() body: { status: string; responseMessage?: string },
  ) {
    const handlerId = req.user?.sub;
    if (!handlerId) throw new BadRequestException('Invalid token payload');

    const status = this.parseStatus(body?.status);
    return await this.reclamationsService.updateStatus({
      reclamationId: id,
      handlerId,
      input: {
        status,
        responseMessage: body?.responseMessage,
      },
    });
  }

  private parseStatus(value?: string): ReclamationStatus {
    const v = (value || '').trim() as ReclamationStatus;
    const allowed = Object.values(ReclamationStatus);
    if (!allowed.includes(v)) {
      throw new BadRequestException(
        `Invalid status. Allowed: ${allowed.join(', ')}`,
      );
    }
    return v;
  }
}
