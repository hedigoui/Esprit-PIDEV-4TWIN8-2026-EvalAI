import {
  Controller,
  Delete,
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
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommunicationService } from './communication.service';
import { CommunicationGateway } from './communication.gateway';
import { MessageType } from './communication.models';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/jwt-auth.guard';

type AuthedRequest = Request & { user: AuthUser };
type UploadedFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return 'Unexpected error';
};

@Controller('communication')
export class CommunicationController {
  constructor(
    private readonly communicationService: CommunicationService,
    private readonly communicationGateway: CommunicationGateway,
  ) {}

  // ===== MESSAGING ENDPOINTS =====

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Body()
    body: {
      receiverId: string;
      content: string;
      type?: MessageType;
    },
    @Req() req: AuthedRequest,
  ) {
    try {
      const senderId = req.user?.sub;
      if (!senderId) {
        throw new UnauthorizedException('Invalid token');
      }
      const { receiverId, content, type = MessageType.TEXT } = body;

      const message = await this.communicationService.sendMessage(
        senderId,
        receiverId,
        content,
        type,
      );

      const notification = await this.communicationService.createMessageNotification(
        senderId,
        receiverId,
        message._id.toString(),
        message.content,
      );

      return {
        success: true,
        message: 'Message sent successfully',
        data: message,
        notification,
      };
    } catch (error) {
        throw new BadRequestException(getErrorMessage(error));
    }
  }

  @Get('messages/:userId')
  @UseGuards(JwtAuthGuard)
  async getConversation(
    @Param('userId') userId: string,
    @Req() req: AuthedRequest,
  ) {
    try {
      const currentUserId = req.user?.sub;
      if (!currentUserId) {
        throw new UnauthorizedException('Invalid token');
      }

      const messages = await this.communicationService.getConversationMessages(
        currentUserId,
        userId,
        50,
      );

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
        throw new BadRequestException(getErrorMessage(error));
    }
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  async getUserConversations(@Req() req: AuthedRequest) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new UnauthorizedException('Invalid token');
      }
      const conversations =
        await this.communicationService.getUserConversations(userId);

      return {
        success: true,
        data: conversations,
      };
    } catch (error) {
        throw new BadRequestException(getErrorMessage(error));
    }
  }

  @Delete('conversations/:userId')
  @UseGuards(JwtAuthGuard)
  async deleteConversation(
    @Param('userId') otherUserId: string,
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    await this.communicationService.deleteConversation(userId, otherUserId);
    this.communicationGateway.emitConversationUpdate({
      userId,
      otherUserId,
    });

    return { success: true };
  }

  @Post('messages/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileMessage(
    @UploadedFile() file: UploadedFile,
    @Body()
    body: {
      receiverId: string;
      content: string;
      type?: MessageType;
      duration?: string;
    },
    @Req() req: AuthedRequest,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const senderId = req.user?.sub;
      if (!senderId) {
        throw new UnauthorizedException('Invalid token');
      }
      const { receiverId, content, type = MessageType.FILE, duration } = body;
      const durationSeconds = duration ? Number(duration) : undefined;
      if (durationSeconds !== undefined && Number.isNaN(durationSeconds)) {
        throw new BadRequestException('Invalid duration');
      }

      // For now, store file info as base64
      // In production, you'd want to upload to cloud storage
      const fileDataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      const message = await this.communicationService.sendFileMessage(
        senderId,
        receiverId,
        {
          content,
          type,
          fileName: file.originalname,
          fileUrl: fileDataUrl,
          fileSize: file.size,
          duration: durationSeconds,
        },
      );

      const notification = await this.communicationService.createMessageNotification(
        senderId,
        receiverId,
        message._id.toString(),
        message.content,
      );

      this.communicationGateway.emitNewMessage(message as any, notification);

      return {
        success: true,
        message: 'File message sent successfully',
        data: message,
        notification,
      };
    } catch (error) {
        throw new BadRequestException(getErrorMessage(error));
    }
  }

  @Delete('messages/:id')
  @UseGuards(JwtAuthGuard)
  async deleteMessage(
    @Param('id') id: string,
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    const deleted = await this.communicationService.deleteMessage(userId, id);
    this.communicationGateway.emitMessageDeleted({
      messageId: id,
      senderId: deleted.senderId,
      receiverId: deleted.receiverId,
    });

    return { success: true, data: deleted };
  }

  @Patch('messages/:id')
  @UseGuards(JwtAuthGuard)
  async updateMessage(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    const updated = await this.communicationService.updateMessage(
      userId,
      id,
      body.content,
    );

    this.communicationGateway.emitMessageUpdated({
      message: updated,
      senderId: updated.senderId,
      receiverId: updated.receiverId,
    });

    return { success: true, data: updated };
  }

  @Get('blocks')
  @UseGuards(JwtAuthGuard)
  async getBlocks(@Req() req: AuthedRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    const blocks = await this.communicationService.getBlocks(userId);
    return { success: true, data: blocks };
  }

  @Post('blocks')
  @UseGuards(JwtAuthGuard)
  async blockUser(
    @Body() body: { blockedId: string },
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    if (!body?.blockedId) {
      throw new BadRequestException('blockedId is required');
    }
    const block = await this.communicationService.blockUser(userId, body.blockedId);
    this.communicationGateway.emitConversationUpdate({ userId, otherUserId: body.blockedId });
    return { success: true, data: block };
  }

  @Delete('blocks/:blockedId')
  @UseGuards(JwtAuthGuard)
  async unblockUser(
    @Param('blockedId') blockedId: string,
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    await this.communicationService.unblockUser(userId, blockedId);
    this.communicationGateway.emitConversationUpdate({ userId, otherUserId: blockedId });
    return { success: true };
  }

  @Get('mutes')
  @UseGuards(JwtAuthGuard)
  async getMutes(@Req() req: AuthedRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    const mutes = await this.communicationService.getMutes(userId);
    return { success: true, data: mutes };
  }

  @Post('mutes')
  @UseGuards(JwtAuthGuard)
  async muteUser(
    @Body() body: { mutedUserId: string },
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    if (!body?.mutedUserId) {
      throw new BadRequestException('mutedUserId is required');
    }
    const mute = await this.communicationService.muteUser(userId, body.mutedUserId);
    this.communicationGateway.emitConversationUpdate({ userId, otherUserId: body.mutedUserId });
    return { success: true, data: mute };
  }

  @Delete('mutes/:mutedUserId')
  @UseGuards(JwtAuthGuard)
  async unmuteUser(
    @Param('mutedUserId') mutedUserId: string,
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    await this.communicationService.unmuteUser(userId, mutedUserId);
    this.communicationGateway.emitConversationUpdate({ userId, otherUserId: mutedUserId });
    return { success: true };
  }

  @Post('reports')
  @UseGuards(JwtAuthGuard)
  async reportUser(
    @Body() body: { reportedId: string; reason?: string; messageId?: string },
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    if (!body?.reportedId) {
      throw new BadRequestException('reportedId is required');
    }
    const report = await this.communicationService.createReport(
      userId,
      body.reportedId,
      body.reason,
      body.messageId,
    );
    return { success: true, data: report };
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
        throw new BadRequestException(getErrorMessage(error));
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
        throw new BadRequestException(getErrorMessage(error));
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
        throw new BadRequestException(getErrorMessage(error));
    }
  }

  // ===== NOTIFICATION ENDPOINTS =====

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  async getNotifications(@Req() req: AuthedRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    const notifications = await this.communicationService.getNotifications(
      userId,
    );
    return { success: true, data: notifications };
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  async markNotificationRead(@Param('id') id: string) {
    await this.communicationService.markNotificationAsRead(id);
    return { success: true };
  }

  @Patch('notifications/read-all')
  @UseGuards(JwtAuthGuard)
  async markAllNotificationsRead(@Req() req: AuthedRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    await this.communicationService.markAllNotificationsAsRead(userId);
    return { success: true };
  }

  // ===== INVITATION ENDPOINTS =====

  @Post('invitations')
  @UseGuards(JwtAuthGuard)
  async createInvitation(
    @Body() body: { studentId?: string; studentEmail?: string },
    @Req() req: AuthedRequest,
  ) {
    const teacherId = req.user?.sub;
    if (!teacherId) {
      throw new UnauthorizedException('Invalid token');
    }
    if (req.user?.role !== 'instructor') {
      throw new UnauthorizedException('Only instructors can invite students');
    }

    let studentId = body.studentId;
    if (!studentId && body.studentEmail) {
      const student = await this.communicationService.getUserByEmail(
        body.studentEmail,
      );
      if (!student || student.role !== 'student') {
        throw new BadRequestException('Student not found');
      }
      studentId = student.id;
    }

    if (!studentId) {
      throw new BadRequestException('Student ID or email is required');
    }

    const invitation = await this.communicationService.createInvitation(
      teacherId,
      studentId,
    );

    return { success: true, data: invitation };
  }

  @Get('invitations/received')
  @UseGuards(JwtAuthGuard)
  async getReceivedInvitations(@Req() req: AuthedRequest) {
    const studentId = req.user?.sub;
    if (!studentId) {
      throw new UnauthorizedException('Invalid token');
    }
    const invitations =
      await this.communicationService.getInvitationsForStudent(studentId);
    return { success: true, data: invitations };
  }

  @Get('invitations/sent')
  @UseGuards(JwtAuthGuard)
  async getSentInvitations(@Req() req: AuthedRequest) {
    const teacherId = req.user?.sub;
    if (!teacherId) {
      throw new UnauthorizedException('Invalid token');
    }
    const invitations =
      await this.communicationService.getInvitationsForTeacher(teacherId);
    return { success: true, data: invitations };
  }

  @Patch('invitations/:id/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvitation(
    @Param('id') id: string,
    @Req() req: AuthedRequest,
  ) {
    const studentId = req.user?.sub;
    if (!studentId) {
      throw new UnauthorizedException('Invalid token');
    }
    const invitation = await this.communicationService.acceptInvitation(
      id,
      studentId,
    );
    return { success: true, data: invitation };
  }

  @Patch('invitations/:id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectInvitation(
    @Param('id') id: string,
    @Req() req: AuthedRequest,
  ) {
    const studentId = req.user?.sub;
    if (!studentId) {
      throw new UnauthorizedException('Invalid token');
    }
    const invitation = await this.communicationService.rejectInvitation(
      id,
      studentId,
    );
    return { success: true, data: invitation };
  }

  @Get('students')
  @UseGuards(JwtAuthGuard)
  async getAssignedStudents(
    @Req() req: AuthedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const teacherId = req.user?.sub;
    if (!teacherId) {
      throw new UnauthorizedException('Invalid token');
    }
    if (req.user?.role !== 'instructor') {
      throw new UnauthorizedException('Only instructors can view assigned students');
    }
    if (page || limit) {
      const parsedPage = Number(page ?? 1);
      const parsedLimit = Number(limit ?? 20);
      const result = await this.communicationService.getAssignedStudentsPaginated(
        teacherId,
        parsedPage,
        parsedLimit,
      );
      return { success: true, ...result };
    }
    const students = await this.communicationService.getAssignedStudents(teacherId);
    return { success: true, data: students };
  }

  @Post('feedback')
  @UseGuards(JwtAuthGuard)
  async sendFeedback(
    @Body()
    body: {
      receiverId: string;
      feedback: string;
      type: 'positive' | 'constructive' | 'general';
      relatedTo?: string; // Could be session ID, assignment ID, etc.
    },
    @Req() req: AuthedRequest,
  ) {
    try {
      const senderId = req.user?.sub;
      if (!senderId) {
        throw new UnauthorizedException('Invalid token');
      }
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
      throw new BadRequestException(getErrorMessage(error));
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
      throw new BadRequestException(getErrorMessage(error));
    }
  }
}
