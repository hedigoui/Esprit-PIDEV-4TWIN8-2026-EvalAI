import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Reclamation } from './reclamations.models';
import { ReclamationsService } from './reclamations.service';
import { ReclamationsController } from './reclamations.controller';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OralPerformance } from '../oral-performance/oral-performance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reclamation, OralPerformance]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ReclamationsController],
  providers: [ReclamationsService, JwtAuthGuard, RolesGuard],
})
export class ReclamationsModule {}
