import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Reclamation } from './reclamations.models';
import { ReclamationsService } from './reclamations.service';
import { ReclamationsController } from './reclamations.controller';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OralPerformance } from '../oral-performance/oral-performance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reclamation, OralPerformance]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [ReclamationsController],
  providers: [ReclamationsService, JwtAuthGuard, RolesGuard],
})
export class ReclamationsModule {}
