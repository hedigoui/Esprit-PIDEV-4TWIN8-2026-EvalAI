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
import { ConfigModule, ConfigService } from '@nestjs/config';

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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        console.log('[CommunicationModule] JWT Secret present:', !!secret);
        return {
          secret: secret || 'your-secret-key',
          signOptions: { expiresIn: '1d' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [CommunicationController],
  providers: [CommunicationService, CommunicationGateway, JwtAuthGuard],
  exports: [CommunicationService],
})
export class CommunicationModule {}
