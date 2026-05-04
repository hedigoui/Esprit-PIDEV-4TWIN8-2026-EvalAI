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
  ) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      (typeof client.handshake.query?.token === 'string'
        ? client.handshake.query.token
        : undefined);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });
      const userId = payload?.sub;
      if (!userId) {
        client.disconnect();
        return;
      }
      client.data.userId = userId;
      client.join(`user:${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      client.leave(`user:${userId}`);
    }
  }

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
}
