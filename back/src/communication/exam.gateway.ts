import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ExamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map user ID to their active socket ID
  private userSockets = new Map<string, string>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove the socket from our mapping
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    this.userSockets.set(data.userId, client.id);
    console.log(`User ${data.userId} registered with socket ${client.id}`);
    return { status: 'registered' };
  }

  @SubscribeMessage('sendExamInvite')
  handleSendExamInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { studentId: string; teacherId: string; roomId: string },
  ) {
    const studentSocketId = this.userSockets.get(data.studentId);
    if (studentSocketId) {
      this.server.to(studentSocketId).emit('examInviteReceived', {
        teacherId: data.teacherId,
        roomId: data.roomId,
      });
      return { status: 'invite_sent' };
    } else {
      return { status: 'student_offline' };
    }
  }

  @SubscribeMessage('acceptExamInvite')
  handleAcceptExamInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; studentId: string; teacherId: string },
  ) {
    // Student joins the room
    client.join(data.roomId);
    
    // Teacher also needs to be in the room, so we notify them that the student accepted
    const teacherSocketId = this.userSockets.get(data.teacherId);
    if (teacherSocketId) {
      this.server.to(teacherSocketId).emit('examInviteAccepted', {
        studentId: data.studentId,
        roomId: data.roomId,
      });
    }
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
