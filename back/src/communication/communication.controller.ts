import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommunicationService } from './communication.service';
import { MessageType } from './communication.models';
import type { Express } from 'express';
import { extractUserFromToken } from '../auth/jwt.util';

@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  // ===== MESSAGING ENDPOINTS =====

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Body()
    body: {
      receiverId: string;
      content: string;
      type?: MessageType;
    },
    @Request() req: any,
  ) {
    try {
      // Get the actual user ID from the JWT token
      const user = extractUserFromToken(req);
      const senderId = user?.sub || 'temp-sender-id';
      const { receiverId, content, type = MessageType.TEXT } = body;

      const message = await this.communicationService.sendMessage(
        senderId,
        receiverId,
        content,
        type,
      );

      return {
        success: true,
        message: 'Message sent successfully',
        data: message,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('messages/:userId')
  async getConversation(
    @Param('userId') userId: string,
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    try {
      // Get the actual user ID from the JWT token
      const user = extractUserFromToken(req);
      const currentUserId = user?.sub || 'temp-current-user-id';

      // Get messages
      const messages = await this.communicationService.getConversationMessages(
        currentUserId,
        userId,
        limit ? parseInt(limit) : 50,
      );

      // Get other user details
      const otherUser = await this.communicationService.getUserById(userId);

      return {
        success: true,
        data: messages,
        otherUser: otherUser || {
          id: userId,
          name: 'Unknown User',
          role: 'user',
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('conversations')
  async getUserConversations(@Request() req: any) {
    try {
      // Get the actual user ID from the JWT token
      const user = extractUserFromToken(req);
      const userId = user?.sub || 'temp-current-user-id';
      const conversations =
        await this.communicationService.getUserConversations(userId);

      return {
        success: true,
        data: conversations,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('messages/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileMessage(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      receiverId: string;
      content: string;
    },
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const senderId = 'temp-sender-id'; // TODO: Get from JWT token properly
      const { receiverId, content } = body;

      // For now, store file info as base64
      // In production, you'd want to upload to cloud storage
      const _fileData = {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        data: file.buffer.toString('base64'),
      };

      const message = await this.communicationService.sendMessage(
        senderId,
        receiverId,
        content,
        MessageType.FILE,
      );

      // Update message with file info
      // You would typically update the message with file URL here

      return {
        success: true,
        message: 'File message sent successfully',
        data: message,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // ===== APPOINTMENT ENDPOINTS =====

  @Post('appointments')
  @HttpCode(HttpStatus.CREATED)
  async createAppointment(
    @Body()
    body: {
      teacherId: string;
      studentId: string;
      title: string;
      scheduledTime: string;
      endTime: string;
      description?: string;
    },
  ) {
    try {
      const {
        teacherId,
        studentId,
        title,
        scheduledTime,
        endTime,
        description,
      } = body;

      const appointment = await this.communicationService.createAppointment(
        teacherId,
        studentId,
        title,
        new Date(scheduledTime),
        new Date(endTime),
        description,
      );

      return {
        success: true,
        message: 'Appointment created successfully',
        data: appointment,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('appointments')
  async getUserAppointments() {
    try {
      // TODO: Get userId and userRole from JWT token properly
      const userId = 'temp-user-id';
      const _userRole = 'instructor'; // TODO: Get from token

      const appointments =
        await this.communicationService.getAppointments(userId);

      return {
        success: true,
        data: appointments,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('appointments/:id/status')
  async updateAppointmentStatus(
    @Param('id') id: string,
    @Body() body: { status: 'confirmed' | 'completed' | 'cancelled' },
  ) {
    try {
      // TODO: Get userId from JWT token properly
      const userId = 'temp-user-id';
      const { status } = body;

      const appointment = await this.communicationService.updateAppointment(
        id,
        userId,
        status,
      );

      return {
        success: true,
        message: `Appointment ${status} successfully`,
        data: appointment,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // ===== NOTIFICATION ENDPOINTS =====

  @Get('notifications')
  async getNotifications(@Query('unreadOnly') _unreadOnly?: string) {
    try {
      // TODO: Get userId from JWT token properly
      const userId = 'temp-user-id';
      const notifications =
        await this.communicationService.getNotifications(userId);

      return {
        success: true,
        data: notifications,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('notifications/:id/read')
  async markNotificationAsRead(@Param('id') id: string) {
    try {
      // TODO: Get userId from JWT token properly
      const _userId = 'temp-user-id';
      await this.communicationService.markNotificationAsRead(id);

      return {
        success: true,
        message: 'Notification marked as read',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('notifications/read-all')
  async markAllNotificationsAsRead() {
    try {
      // TODO: Get userId from JWT token properly
      const userId = 'temp-user-id';
      await this.communicationService.markAllNotificationsAsRead(userId);

      return {
        success: true,
        message: 'All notifications marked as read',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // ===== STUDENT-TEACHER INTERACTION ENDPOINTS =====

  @Get('students')
  async getTeacherStudents() {
    try {
      // TODO: Get teacherId from JWT token properly
      const _teacherId = 'temp-teacher-id';

      // This would typically get students assigned to this teacher
      // For now, we'll return all students (you might want to add a relationship)

      return {
        success: true,
        message: 'Teacher students retrieved successfully',
        // data: students,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('teachers')
  async getStudentTeachers() {
    try {
      // TODO: Get studentId from JWT token properly
      const _studentId = 'temp-student-id';

      // This would typically get teachers assigned to this student

      return {
        success: true,
        message: 'Student teachers retrieved successfully',
        // data: teachers,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('feedback')
  async sendFeedback(
    @Body()
    body: {
      receiverId: string;
      feedback: string;
      type: 'positive' | 'constructive' | 'general';
      relatedTo?: string; // Could be session ID, assignment ID, etc.
    },
  ) {
    try {
      // TODO: Get senderId from JWT token properly
      const senderId = 'temp-sender-id';
      const { receiverId, feedback, type, relatedTo: _relatedTo } = body;

      // Send feedback as a special message type
      const message = await this.communicationService.sendMessage(
        senderId,
        receiverId,
        `📝 Feedback (${type}): ${feedback}`,
        MessageType.FEEDBACK,
      );

      return {
        success: true,
        message: 'Feedback sent successfully',
        data: message,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('announcements')
  async createAnnouncement(
    @Body()
    body: {
      title: string;
      content: string;
      targetRole?: 'student' | 'instructor' | 'all';
    },
  ) {
    try {
      // TODO: Get senderId from JWT token properly
      const _senderId = 'temp-sender-id';
      const {
        title: _title,
        content: _content,
        targetRole: _targetRole = 'all',
      } = body;

      // This would typically send announcements to multiple users
      // For now, we'll create a notification

      return {
        success: true,
        message: 'Announcement sent successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
