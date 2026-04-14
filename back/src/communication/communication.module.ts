import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { CommunicationGateway } from './communication.gateway';
import {
  Message,
  Conversation,
  Appointment,
  Notification,
  Invitation,
  Block,
  Mute,
  Report,
} from './communication.models';
import { Users } from '../users/users.models';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      Conversation,
      Appointment,
      Notification,
      Invitation,
      Block,
      Mute,
      Report,
      Users,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [CommunicationController],
  providers: [CommunicationService, CommunicationGateway, JwtAuthGuard],
  exports: [CommunicationService],
})
export class CommunicationModule {}
