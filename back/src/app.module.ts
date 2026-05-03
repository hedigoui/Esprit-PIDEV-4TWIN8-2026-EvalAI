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
import { JwtModule } from '@nestjs/jwt';
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
      host: process.env.MONGODB_HOST || 'mongodb',
      port: 27017,
      database: 'evalAI',
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
    JwtModule.register({
      secret: 'your-secret-key-change-this-in-production',
      signOptions: { expiresIn: '1d' },
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
