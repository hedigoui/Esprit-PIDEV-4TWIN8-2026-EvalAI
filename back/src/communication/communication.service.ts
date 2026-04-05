import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import {
  Message,
  Conversation,
  Notification,
  Appointment,
  MessageType,
  MessageStatus,
} from './communication.models';
import { Users } from '../users/users.models';
import { ObjectId } from 'mongodb';

@Injectable()
export class CommunicationService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: MongoRepository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: MongoRepository<Conversation>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: MongoRepository<Appointment>,
    @InjectRepository(Notification)
    private readonly notificationRepository: MongoRepository<Notification>,
    @InjectRepository(Users)
    private readonly userRepository: MongoRepository<Users>,
  ) {}

  // ===== MESSAGING SYSTEM =====

  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
  ): Promise<Message> {
    try {
      // Find or create conversation
      let conversation = await this.findConversation(senderId, receiverId);

      if (!conversation) {
        conversation = await this.createConversation(senderId, receiverId);
      }

      // Create message
      const message = this.messageRepository.create({
        content,
        type,
        status: MessageStatus.SENT,
        senderId,
        receiverId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedMessage = await this.messageRepository.save(message);

      // Update conversation
      conversation.lastMessageContent = content;
      conversation.lastMessageTime = new Date();
      conversation.updatedAt = new Date();
      await this.conversationRepository.save(conversation);

      return savedMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new BadRequestException(error.message);
    }
  }

  async getConversationMessages(
    userId1: string,
    userId2: string,
    limit: number = 50,
  ): Promise<Message[]> {
    try {
      const [forward, backward] = await Promise.all([
        this.messageRepository.find({
          where: { senderId: userId1, receiverId: userId2 },
        }),
        this.messageRepository.find({
          where: { senderId: userId2, receiverId: userId1 },
        }),
      ]);
      const merged = [...forward, ...backward].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      return merged.slice(-limit);
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw new BadRequestException(error.message);
    }
  }

  async getUserConversations(userId: string): Promise<any[]> {
    try {
      const allActive = await this.conversationRepository.find({
        where: { isActive: true },
      });
      const conversations = allActive
        .filter(
          (c) =>
            Array.isArray(c.participantIds) && c.participantIds.includes(userId),
        )
        .sort(
          (a, b) =>
            new Date(b.lastMessageTime || b.updatedAt || 0).getTime() -
            new Date(a.lastMessageTime || a.updatedAt || 0).getTime(),
        );

      // Enrich conversations with user details
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
          // Get the other participant ID
          const otherParticipantId = conv.participantIds.find(
            (id) => id !== userId,
          );

          // Fetch other user details
          let otherParticipant: any = null;
          if (otherParticipantId) {
            try {
              const otherUser = await this.userRepository.findOne({
                where: { _id: new ObjectId(otherParticipantId) },
              });
              if (otherUser) {
                otherParticipant = {
                  id: otherParticipantId,
                  firstName: otherUser.firstName,
                  lastName: otherUser.lastName,
                  email: otherUser.email,
                  role: otherUser.role,
                  avatar: otherUser.avatar,
                  name:
                    `${otherUser.firstName} ${otherUser.lastName}`.trim() ||
                    otherUser.email,
                };
              }
            } catch (err) {
              // Could not fetch user details
            }
          }

          return {
            ...conv,
            otherParticipant: otherParticipant || {
              id: otherParticipantId,
              name: 'Unknown User',
              role: 'user',
            },
          };
        }),
      );

      return enrichedConversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw new BadRequestException(error.message);
    }
  }

  private async findConversation(
    userId1: string,
    userId2: string,
  ): Promise<Conversation | null> {
    try {
      const conversations = await this.conversationRepository.find({
        where: { isActive: true },
      });
      return (
        conversations.find(
          (conv) =>
            Array.isArray(conv.participantIds) &&
            conv.participantIds.includes(userId1) &&
            conv.participantIds.includes(userId2),
        ) || null
      );
    } catch (error) {
      console.error('Error finding conversation:', error);
      return null;
    }
  }

  private async createConversation(
    userId1: string,
    userId2: string,
  ): Promise<Conversation> {
    const conversation = this.conversationRepository.create({
      participantIds: [userId1, userId2],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.conversationRepository.save(conversation);
  }

  // ===== USER HELPER METHODS =====

  async getUserById(userId: string): Promise<any | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { _id: new ObjectId(userId) },
      });

      if (user) {
        return {
          id: userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      return null;
    }
  }

  // ===== NOTIFICATION SYSTEM =====

  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const notifications = await this.notificationRepository.find({
        where: { userId },
        order: { createdAt: -1 },
        take: 50,
      });

      return notifications;
    } catch (error) {
      console.error('❌ Error getting notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await this.notificationRepository.updateMany(
        { _id: new ObjectId(notificationId) },
        { status: 'read', updatedAt: new Date() },
      );
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await this.notificationRepository.updateMany(
        { userId, status: 'unread' },
        { status: 'read', updatedAt: new Date() },
      );
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  }

  private async createNotification(
    userId: string,
    title: string,
    message: string,
    relatedEntityId?: string,
    relatedEntityType?: 'message' | 'appointment' | 'feedback' | 'announcement',
  ): Promise<Notification | null> {
    try {
      const notification = {
        userId,
        title,
        message,
        relatedEntityId,
        relatedEntityType,
        status: 'unread' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return await this.notificationRepository.save(notification);
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      return null;
    }
  }

  // ===== APPOINTMENT SYSTEM =====

  async createAppointment(
    teacherId: string,
    studentId: string,
    title: string,
    scheduledTime: Date,
    endTime: Date,
    description?: string,
  ): Promise<Appointment> {
    try {
      const appointment = this.appointmentRepository.create({
        title,
        description,
        scheduledTime,
        endTime,
        teacherId,
        studentId,
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedAppointment =
        await this.appointmentRepository.save(appointment);

      console.log('✅ Appointment created successfully');
      return savedAppointment;
    } catch (error) {
      console.error('❌ Error creating appointment:', error);
      throw new BadRequestException(error.message);
    }
  }

  async getAppointments(userId: string): Promise<Appointment[]> {
    try {
      const appointments = await this.appointmentRepository.find({
        where: {
          $or: [{ teacherId: userId }, { studentId: userId }],
        },
        order: { scheduledTime: 1 },
      });

      return appointments;
    } catch (error) {
      console.error('❌ Error getting appointments:', error);
      throw error;
    }
  }

  async updateAppointment(
    appointmentId: string,
    userId: string,
    status: 'confirmed' | 'completed' | 'cancelled',
  ): Promise<Appointment> {
    try {
      const appointment = await this.appointmentRepository.findOneBy({
        _id: new ObjectId(appointmentId),
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      // Check if user has permission to update
      if (
        appointment.teacherId !== userId &&
        appointment.studentId !== userId
      ) {
        throw new BadRequestException(
          'Unauthorized to update this appointment',
        );
      }

      appointment.status = status;
      appointment.updatedAt = new Date();

      const updatedAppointment =
        await this.appointmentRepository.save(appointment);

      console.log(`✅ Appointment ${status} successfully`);
      return updatedAppointment;
    } catch (error) {
      console.error('❌ Error updating appointment:', error);
      throw new BadRequestException(error.message);
    }
  }

  async deleteAppointment(
    appointmentId: string,
    userId: string,
  ): Promise<void> {
    try {
      const appointment = await this.appointmentRepository.findOneBy({
        _id: new ObjectId(appointmentId),
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      // Check if user has permission to delete
      if (
        appointment.teacherId !== userId &&
        appointment.studentId !== userId
      ) {
        throw new BadRequestException(
          'Unauthorized to delete this appointment',
        );
      }

      await this.appointmentRepository.delete(appointmentId);

      console.log('✅ Appointment deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting appointment:', error);
      throw new BadRequestException(error.message);
    }
  }
}
