import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import {
  Message,
  Conversation,
  Appointment,
  Notification,
} from './communication.models';
import { Users } from '../users/users.models';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      Conversation,
      Appointment,
      Notification,
      Users,
    ]),
  ],
  controllers: [CommunicationController],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
