import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Server, Socket } from 'socket.io';
import { CommunicationService } from './communication.service';
import { MessageType } from './communication.models';

const getFrontendOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return [frontendUrl, 'http://localhost:3001', 'http://localhost:5173'];
};

@WebSocketGateway({
  cors: {
    origin: getFrontendOrigins(),
    credentials: true,
  },
})
export class CommunicationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly communicationService: CommunicationService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      (typeof client.handshake.query?.token === 'string'
        ? client.handshake.query.token
        : undefined);

    if (!token) {
      console.log('[socket] No token provided, disconnecting', client.id);
      client.disconnect();
      return;
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
      const payload = await this.jwtService.verifyAsync(token, { secret });
      const userId = payload?.sub || payload?.id;

      if (!userId) {
        console.log('[socket] No userId in payload, disconnecting', client.id);
        client.disconnect();
        return;
      }

      client.data.userId = String(userId);
      client.data.user = payload;
      
      client.join(`user:${userId}`);
      console.log(`[socket] User ${userId} connected and joined room user:${userId}`);
    } catch (err) {
      console.warn('[socket] Connection unauthorized:', err.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      client.leave(`user:${userId}`);
    }
  }

  // --- Messaging Logic ---

  emitNewMessage(message: { senderId: string; receiverId: string }, notification?: any) {
    if (!this.server) return;
    this.server.to(`user:${message.senderId}`).emit('message:new', message);
    this.server.to(`user:${message.receiverId}`).emit('message:new', message);
    if (notification) {
      this.server.to(`user:${message.receiverId}`).emit('notification:new', notification);
    }
  }

  emitMessageDeleted(payload: { messageId: string; senderId: string; receiverId: string }) {
    if (!this.server) return;
    this.server.to(`user:${payload.senderId}`).emit('message:delete', payload);
    this.server.to(`user:${payload.receiverId}`).emit('message:delete', payload);
  }

  emitMessageUpdated(payload: { message: any; senderId: string; receiverId: string }) {
    if (!this.server) return;
    this.server.to(`user:${payload.senderId}`).emit('message:update', payload.message);
    this.server.to(`user:${payload.receiverId}`).emit('message:update', payload.message);
  }

  emitConversationUpdate(payload: { userId: string; otherUserId: string }) {
    if (!this.server) return;
    this.server.to(`user:${payload.userId}`).emit('conversation:update', payload);
    this.server.to(`user:${payload.otherUserId}`).emit('conversation:update', payload);
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody()
    body: { receiverId: string; content: string; type?: MessageType },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data?.userId as string | undefined;
    if (!senderId) {
      return { ok: false, error: 'unauthorized' };
    }
    const { receiverId, content, type = MessageType.TEXT } = body || {};
    if (!receiverId || !content?.trim()) {
      return { ok: false, error: 'invalid_payload' };
    }

    const message = await this.communicationService.sendMessage(
      senderId,
      receiverId,
      content.trim(),
      type,
    );

    const notification = await this.communicationService.createMessageNotification(
      senderId,
      receiverId,
      message._id.toString(),
      message.content,
    );

    this.emitNewMessage(message, notification);

    return { ok: true, message };
  }

  // --- Online Exam Logic ---

  @SubscribeMessage('register')
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    // Already joined in handleConnection, but kept for client-side compatibility
    if (data.userId) {
      client.join(`user:${data.userId}`);
    }
    return { status: 'registered' };
  }

  @SubscribeMessage('sendExamInvite')
  handleSendExamInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { studentId: string; teacherId: string; roomId: string },
  ) {
    console.log(`[Exam] Sending invite from ${data.teacherId} to ${data.studentId}`);
    
    // Emit to all sockets in the student's room
    this.server.to(`user:${data.studentId}`).emit('examInviteReceived', {
      teacherId: data.teacherId,
      roomId: data.roomId,
    });
    
    return { status: 'invite_sent' };
  }

  @SubscribeMessage('acceptExamInvite')
  handleAcceptExamInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; studentId: string; teacherId: string },
  ) {
    console.log(`[Exam] Student ${data.studentId} accepted invite for room ${data.roomId}`);
    
    // Student joins the specific exam room
    client.join(data.roomId);
    
    // Notify the teacher (in their personal room) that the student accepted
    this.server.to(`user:${data.teacherId}`).emit('examInviteAccepted', {
      studentId: data.studentId,
      roomId: data.roomId,
    });
    
    return { status: 'joined' };
  }

  @SubscribeMessage('joinExamRoom')
  handleJoinExamRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.join(data.roomId);
    return { status: 'joined_room' };
  }

  @SubscribeMessage('examEvent')
  handleExamEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; type: string; payload: any },
  ) {
    // Broadcast event to others in the room
    client.to(data.roomId).emit('examEventReceived', data);
  }
}
