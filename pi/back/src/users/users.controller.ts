import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
      gender?: 'male' | 'female';
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
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!page && !limit) {
      return this.usersService.findAll();
    }
    const parsedPage = Number(page ?? 1);
    const parsedLimit = Number(limit ?? 20);
    const result = await this.usersService.findAllPaginated(
      parsedPage,
      parsedLimit,
    );
    return { success: true, ...result };
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

  @Get('instructors')
  async getInstructors() {
    try {
      console.log('🔍 Controller: Getting instructors...');
      const instructors = await this.usersService.getInstructors();
      console.log(`🔍 Controller: Returning ${instructors.length} instructors`);
      return {
        success: true,
        data: instructors,
      };
    } catch (error) {
      console.error('Error getting instructors:', error);
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

  @Post('change-temporary-password')
  @HttpCode(HttpStatus.OK)
  async changeTemporaryPassword(
    @Body()
    body: {
      userId: string;
      newPassword: string;
    },
  ) {
    try {
      if (!body.userId || !body.newPassword) {
        throw new BadRequestException(
          'User ID and new password are required',
        );
      }

      return await this.usersService.changeTemporaryPassword(
        body.userId,
        body.newPassword,
      );
    } catch (error) {
      console.error('Change temporary password error:', error);
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
      gender?: 'male' | 'female';
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
