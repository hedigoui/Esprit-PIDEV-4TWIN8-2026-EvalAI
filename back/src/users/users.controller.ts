import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UserRole } from './users.models';
import type { Express } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(
    @Body()
    body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      isActive: boolean;
    },
  ) {
    try {
      // Validate required fields
      if (
        !body.email ||
        !body.password ||
        !body.firstName ||
        !body.lastName ||
        !body.role
      ) {
        throw new BadRequestException('Missing required fields');
      }

      return await this.usersService.create(body);
    } catch (error) {
      console.error('Controller error:', error);
      throw error; // NestJS will handle the error response
    }
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('students')
  async getStudents() {
    try {
      console.log('🔍 Controller: Getting students...');
      const students = await this.usersService.getStudents();
      console.log(`🔍 Controller: Returning ${students.length} students`);
      return {
        success: true,
        data: students,
      };
    } catch (error) {
      console.error('Error getting students:', error);
      throw error;
    }
  }

  // Specific routes must come BEFORE parameterized routes
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(
    @Body()
    body: {
      email: string;
      password: string;
    },
  ) {
    try {
      if (!body.email || !body.password) {
        throw new BadRequestException('Email and password are required');
      }

      return await this.usersService.signin(body.email, body.password);
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body()
    body: {
      email: string;
    },
  ) {
    try {
      if (!body.email) {
        throw new BadRequestException('Email is required');
      }

      return await this.usersService.forgotPassword(body.email);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body()
    body: {
      userId: string;
      currentPassword: string;
      newPassword: string;
    },
  ) {
    try {
      if (!body.userId || !body.currentPassword || !body.newPassword) {
        throw new BadRequestException(
          'User ID, current password, and new password are required',
        );
      }

      return await this.usersService.changePassword(
        body.userId,
        body.currentPassword,
        body.newPassword,
      );
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  @Get('profile/:id')
  getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @Patch('profile/:id')
  updateProfile(
    @Param('id') id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      bio?: string;
      avatar?: string;
    },
  ) {
    return this.usersService.updateProfile(id, body);
  }

  @Post('profile/:id/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(id, file);
  }

  // Parameterized routes come AFTER specific routes
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
