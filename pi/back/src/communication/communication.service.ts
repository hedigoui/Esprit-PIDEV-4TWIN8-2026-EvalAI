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
  Invitation,
  Block,
  Mute,
  Report,
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
    @InjectRepository(Invitation)
    private readonly invitationRepository: MongoRepository<Invitation>,
    @InjectRepository(Block)
    private readonly blockRepository: MongoRepository<Block>,
    @InjectRepository(Mute)
    private readonly muteRepository: MongoRepository<Mute>,
    @InjectRepository(Report)
    private readonly reportRepository: MongoRepository<Report>,
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
      if (await this.isBlockedBetween(senderId, receiverId)) {
        throw new BadRequestException('Messaging is blocked between these users');
      }
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

  async sendFileMessage(
    senderId: string,
    receiverId: string,
    payload: {
      content?: string;
      type?: MessageType;
      fileName?: string;
      fileUrl?: string;
      fileSize?: number;
      duration?: number;
    },
  ): Promise<Message> {
    try {
      if (await this.isBlockedBetween(senderId, receiverId)) {
        throw new BadRequestException('Messaging is blocked between these users');
      }
      let conversation = await this.findConversation(senderId, receiverId);
      if (!conversation) {
        conversation = await this.createConversation(senderId, receiverId);
      }

      const normalizedContent =
        payload.content ||
        (payload.type === MessageType.VOICE_NOTE
          ? 'Voice message'
          : payload.fileName || 'File');

      const message = this.messageRepository.create({
        content: normalizedContent,
        type: payload.type || MessageType.FILE,
        status: MessageStatus.SENT,
        senderId,
        receiverId,
        fileName: payload.fileName,
        fileUrl: payload.fileUrl,
        fileSize: payload.fileSize,
        duration: payload.duration,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedMessage = await this.messageRepository.save(message);

      conversation.lastMessageContent = normalizedContent;
      conversation.lastMessageTime = new Date();
      conversation.updatedAt = new Date();
      await this.conversationRepository.save(conversation);

      return savedMessage;
    } catch (error) {
      console.error('Error sending file message:', error);
      throw new BadRequestException(error.message);
    }
  }

  private async getLatestMessageBetween(
    userId1: string,
    userId2: string,
  ): Promise<Message | null> {
    const [forward, backward] = await Promise.all([
      this.messageRepository.find({
        where: { senderId: userId1, receiverId: userId2 },
      }),
      this.messageRepository.find({
        where: { senderId: userId2, receiverId: userId1 },
      }),
    ]);
    const merged = [...forward, ...backward].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return merged.length ? merged[merged.length - 1] : null;
  }

  async deleteMessage(userId: string, messageId: string): Promise<Message> {
    try {
      if (!ObjectId.isValid(messageId)) {
        throw new BadRequestException('Invalid message ID');
      }

      const message = await this.messageRepository.findOneBy({
        _id: new ObjectId(messageId),
      });
      if (!message) {
        throw new NotFoundException('Message not found');
      }

      if (message.senderId !== userId) {
        throw new BadRequestException('You can only delete your own messages');
      }

      await this.messageRepository.delete({ _id: new ObjectId(messageId) });

      const conversation = await this.findConversation(
        message.senderId,
        message.receiverId,
      );
      if (conversation) {
        const latest = await this.getLatestMessageBetween(
          message.senderId,
          message.receiverId,
        );
        conversation.lastMessageContent = latest?.content || undefined;
        conversation.lastMessageTime = latest?.createdAt || undefined;
        conversation.updatedAt = new Date();
        await this.conversationRepository.save(conversation);
      }

      return message;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  async updateMessage(
    userId: string,
    messageId: string,
    content: string,
  ): Promise<Message> {
    try {
      if (!ObjectId.isValid(messageId)) {
        throw new BadRequestException('Invalid message ID');
      }
      if (!content?.trim()) {
        throw new BadRequestException('Message content is required');
      }

      const message = await this.messageRepository.findOneBy({
        _id: new ObjectId(messageId),
      });
      if (!message) {
        throw new NotFoundException('Message not found');
      }
      if (message.senderId !== userId) {
        throw new BadRequestException('You can only update your own messages');
      }

      message.content = content.trim();
      message.updatedAt = new Date();
      const updated = await this.messageRepository.save(message);

      const conversation = await this.findConversation(
        message.senderId,
        message.receiverId,
      );
      if (conversation) {
        const latest = await this.getLatestMessageBetween(
          message.senderId,
          message.receiverId,
        );
        conversation.lastMessageContent = latest?.content || undefined;
        conversation.lastMessageTime = latest?.createdAt || undefined;
        conversation.updatedAt = new Date();
        await this.conversationRepository.save(conversation);
      }

      return updated;
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

  async createMessageNotification(
    senderId: string,
    receiverId: string,
    messageId: string,
    content: string,
  ): Promise<Notification | null> {
    if (await this.isMuted(receiverId, senderId)) return null;
    const sender = await this.getUserById(senderId);
    const title = 'New message';
    const fromLabel = sender?.name || 'Someone';
    const text = `${fromLabel}: ${content}`;
    return this.createNotification(
      receiverId,
      title,
      text,
      messageId,
      'message',
    );
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
      const [blocksByUser, blocksOfUser, mutesByUser] = await Promise.all([
        this.blockRepository.find({ where: { blockerId: userId } }),
        this.blockRepository.find({ where: { blockedId: userId } }),
        this.muteRepository.find({ where: { userId } }),
      ]);
      const blockedIds = new Set(blocksByUser.map((b) => b.blockedId));
      const blockedByIds = new Set(blocksOfUser.map((b) => b.blockerId));
      const mutedIds = new Set(mutesByUser.map((m) => m.mutedUserId));

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
                  gender: otherUser.gender,
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
            isBlocked: otherParticipantId ? blockedIds.has(otherParticipantId) : false,
            isBlockedByOther: otherParticipantId ? blockedByIds.has(otherParticipantId) : false,
            isMuted: otherParticipantId ? mutedIds.has(otherParticipantId) : false,
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

  private async isBlockedBetween(userId1: string, userId2: string): Promise<boolean> {
    const [block1, block2] = await Promise.all([
      this.blockRepository.findOne({ where: { blockerId: userId1, blockedId: userId2 } }),
      this.blockRepository.findOne({ where: { blockerId: userId2, blockedId: userId1 } }),
    ]);
    return Boolean(block1 || block2);
  }

  private async isMuted(userId: string, mutedUserId: string): Promise<boolean> {
    const mute = await this.muteRepository.findOne({ where: { userId, mutedUserId } });
    return Boolean(mute);
  }

  async deleteConversation(userId: string, otherUserId: string): Promise<void> {
    const conversations = await this.conversationRepository.find();
    const conversation = conversations.find(
      (conv) =>
        Array.isArray(conv.participantIds) &&
        conv.participantIds.includes(userId) &&
        conv.participantIds.includes(otherUserId),
    );

    await this.messageRepository.deleteMany({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    });

    if (conversation?._id) {
      await this.conversationRepository.delete({ _id: conversation._id });
    }
  }

  async getBlocks(userId: string): Promise<Block[]> {
    return this.blockRepository.find({ where: { blockerId: userId } });
  }

  async blockUser(userId: string, blockedId: string): Promise<Block> {
    if (userId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }
    const existing = await this.blockRepository.findOne({
      where: { blockerId: userId, blockedId },
    });
    if (existing) return existing;
    const block = this.blockRepository.create({
      blockerId: userId,
      blockedId,
      createdAt: new Date(),
    });
    return this.blockRepository.save(block);
  }

  async unblockUser(userId: string, blockedId: string): Promise<void> {
    await this.blockRepository.deleteMany({ blockerId: userId, blockedId });
  }

  async getMutes(userId: string): Promise<Mute[]> {
    return this.muteRepository.find({ where: { userId } });
  }

  async muteUser(userId: string, mutedUserId: string): Promise<Mute> {
    if (userId === mutedUserId) {
      throw new BadRequestException('You cannot mute yourself');
    }
    const existing = await this.muteRepository.findOne({
      where: { userId, mutedUserId },
    });
    if (existing) return existing;
    const mute = this.muteRepository.create({
      userId,
      mutedUserId,
      createdAt: new Date(),
    });
    return this.muteRepository.save(mute);
  }

  async unmuteUser(userId: string, mutedUserId: string): Promise<void> {
    await this.muteRepository.deleteMany({ userId, mutedUserId });
  }

  async createReport(
    reporterId: string,
    reportedId: string,
    reason?: string,
    messageId?: string,
  ): Promise<Report> {
    if (reporterId === reportedId) {
      throw new BadRequestException('You cannot report yourself');
    }
    const report = this.reportRepository.create({
      reporterId,
      reportedId,
      reason,
      messageId,
      createdAt: new Date(),
    });
    return this.reportRepository.save(report);
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
          gender: user.gender,
          name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<any | null> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) return null;
      return {
        id: user._id?.toString?.() || user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        gender: user.gender,
        name: `${user.firstName} ${user.lastName}`.trim() || user.email,
      };
    } catch (error) {
      console.error('❌ Error fetching user by email:', error);
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
    relatedEntityType?: 'message' | 'appointment' | 'feedback' | 'announcement' | 'invitation',
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

  // ===== INVITATION SYSTEM =====

  async createInvitation(teacherId: string, studentId: string) {
    const existing = await this.invitationRepository.findOne({
      where: { teacherId, studentId, status: 'pending' },
    });
    if (existing) return existing;

    const invitation = this.invitationRepository.create({
      teacherId,
      studentId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.invitationRepository.save(invitation);
    await this.createNotification(
      studentId,
      'New instructor invitation',
      'An instructor invited you to join their students group.',
      saved._id.toString(),
      'invitation',
    );
    return saved;
  }

  async getInvitationsForStudent(studentId: string) {
    const invites = await this.invitationRepository.find({
      where: { studentId },
      order: { createdAt: -1 },
    });
    const teacherIds = invites.map((i) => i.teacherId).filter(Boolean);
    const teachers = await Promise.all(
      teacherIds.map((id) => this.getUserById(id)),
    );
    const teacherMap = new Map(
      teachers.filter(Boolean).map((t) => [t.id, t]),
    );
    return invites.map((i) => ({
      ...i,
      teacher: teacherMap.get(i.teacherId) || null,
    }));
  }

  async getInvitationsForTeacher(teacherId: string) {
    const invites = await this.invitationRepository.find({
      where: { teacherId },
      order: { createdAt: -1 },
    });
    const studentIds = invites.map((i) => i.studentId).filter(Boolean);
    const students = await Promise.all(
      studentIds.map((id) => this.getUserById(id)),
    );
    const studentMap = new Map(
      students.filter(Boolean).map((s) => [s.id, s]),
    );
    return invites.map((i) => ({
      ...i,
      student: studentMap.get(i.studentId) || null,
    }));
  }

  async acceptInvitation(invitationId: string, studentId: string) {
    const invitation = await this.invitationRepository.findOneBy({
      _id: new ObjectId(invitationId),
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.studentId !== studentId) {
      throw new BadRequestException('Unauthorized to accept this invitation');
    }
    invitation.status = 'accepted';
    invitation.updatedAt = new Date();
    const updated = await this.invitationRepository.save(invitation);

    await this.createNotification(
      invitation.teacherId,
      'Invitation accepted',
      'A student accepted your invitation.',
      invitation._id.toString(),
      'invitation',
    );
    return updated;
  }

  async rejectInvitation(invitationId: string, studentId: string) {
    const invitation = await this.invitationRepository.findOneBy({
      _id: new ObjectId(invitationId),
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.studentId !== studentId) {
      throw new BadRequestException('Unauthorized to reject this invitation');
    }
    invitation.status = 'rejected';
    invitation.updatedAt = new Date();
    const updated = await this.invitationRepository.save(invitation);

    await this.createNotification(
      invitation.teacherId,
      'Invitation declined',
      'A student declined your invitation.',
      invitation._id.toString(),
      'invitation',
    );
    return updated;
  }

  async getAssignedStudents(teacherId: string) {
    const invitations = await this.invitationRepository.find({
      where: { teacherId, status: 'accepted' },
    });
    const ids = invitations.map((i) => i.studentId).filter(Boolean);
    if (!ids.length) return [];
    const objectIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));
    if (!objectIds.length) return [];

    return this.userRepository.find({
      where: { _id: { $in: objectIds } },
    });
  }

  async getAssignedStudentsPaginated(
    teacherId: string,
    page: number,
    limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const [invitations, total] = await Promise.all([
      this.invitationRepository.find({
        where: { teacherId, status: 'accepted' },
        order: { createdAt: 'DESC' },
        skip,
        take: safeLimit,
      }),
      this.invitationRepository.count({
        where: { teacherId, status: 'accepted' },
      }),
    ]);

    const ids = invitations.map((i) => i.studentId).filter(Boolean);
    const objectIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));
    const students = objectIds.length
      ? await this.userRepository.find({ where: { _id: { $in: objectIds } } })
      : [];

    const studentMap = new Map(
      students.map((s) => [s._id?.toString?.() || s._id, s]),
    );
    const ordered = ids
      .map((id) => studentMap.get(id))
      .filter(Boolean);

    return { data: ordered, total, page: safePage, limit: safeLimit };
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
