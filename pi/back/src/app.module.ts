import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CommunicationModule } from './communication/communication.module';
import { ReclamationsModule } from './reclamations/reclamations.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { OralPerformanceModule } from './oral-performance/oral-performance.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './users/users.models';
import { Reclamation } from './reclamations/reclamations.models';
import { OralPerformance } from './oral-performance/oral-performance.entity';
import { OralEvaluation } from './evaluation/entities/oral-evaluation.entity';
import {
  Message,
  Conversation,
  Appointment,
  Notification,
  Invitation,
  Block,
  Mute,
  Report,
} from './communication/communication.models';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: process.env.MONGODB_URI || 'mongodb://localhost:27017/evalAI',
      entities: [
        Users,
        Message,
        Conversation,
        Appointment,
        Notification,
        Invitation,
        Block,
        Mute,
        Report,
        Reclamation,
        OralPerformance,
        OralEvaluation,
      ],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    CommunicationModule,
    ReclamationsModule,
    EvaluationModule,
    OralPerformanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
