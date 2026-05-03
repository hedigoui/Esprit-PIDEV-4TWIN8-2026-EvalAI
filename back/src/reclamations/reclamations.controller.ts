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
    @Body()
    body: {
      title: string;
      description: string;
      category?: string;
      studentName?: string;
      targetInstructorId?: string;
    },
  ) {
    const studentId = req.user?.sub;
    const studentName = body.studentName || req.user?.email || 'Unknown';
    if (!studentId) throw new BadRequestException('Invalid token payload');
    return await this.reclamationsService.create(
      studentId,
      { ...body, studentName },
      UserRole.STUDENT,
    );
  }

  /** Instructors submit support tickets to admins only (not tied to a student). */
  @Post('to-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  async createInstructorToAdmin(
    @Req() req: Request & { user?: AuthUser },
    @Body()
    body: {
      title: string;
      description: string;
      category?: string;
      reporterName?: string;
    },
  ) {
    const instructorId = req.user?.sub;
    if (!instructorId) throw new BadRequestException('Invalid token payload');
    const u = req.user;
    const reporterName = (
      body.reporterName?.trim() ||
      `${u?.firstName || ''} ${u?.lastName || ''}`.trim() ||
      u?.email ||
      'Instructor'
    ).trim();
    return await this.reclamationsService.createInstructorToAdmin(
      instructorId,
      reporterName,
      body,
    );
  }

  /** Admin-only: file a reclamation on behalf of a student (legacy / internal). */
  @Post('teacher/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createByTeacher(
    @Req() req: Request & { user?: AuthUser },
    @Param('studentId') studentId: string,
    @Body() body: { title: string; description: string; category?: string; studentName: string },
  ) {
    if (!body.studentName) throw new BadRequestException('Student name is required');
    const teacherId = req.user?.sub;
    if (!teacherId) throw new BadRequestException('Invalid token payload');
    return await this.reclamationsService.create(
      studentId,
      body,
      UserRole.INSTRUCTOR,
      teacherId,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async findMine(@Req() req: Request & { user?: AuthUser }) {
    const studentId = req.user?.sub;
    if (!studentId) throw new BadRequestException('Invalid token payload');
    return await this.reclamationsService.findMine(studentId);
  }

  @Get('instructor/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  async findInstructorInbox(@Req() req: Request & { user?: AuthUser }) {
    const instructorId = req.user?.sub;
    if (!instructorId) throw new BadRequestException('Invalid token payload');
    return await this.reclamationsService.findInstructorInbox(instructorId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@Query('status') status?: string) {
    const parsed = status ? this.parseStatus(status) : undefined;
    return await this.reclamationsService.findAll(parsed);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Req() req: Request & { user?: AuthUser },
    @Param('id') id: string,
  ) {
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
  @Roles(UserRole.ADMIN)
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


  // Dead code pour créer un Code Smell

}
function unusedFunction() {
  let x = 0;
  for(let i = 0; i < 10; i++) {
    x += i;
  }
  return x;
}