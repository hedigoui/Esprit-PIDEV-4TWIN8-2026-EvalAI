import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OralPerformanceController } from './oral-performance.controller';
import { OralPerformanceService } from './oral-performance.service';
import { OralPerformance } from './oral-performance.entity';
import { InstructorRoster } from './instructor-roster.entity';
import { GridFSModule } from '../gridfs/gridfs.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([OralPerformance, InstructorRoster]), GridFSModule, UsersModule, EmailModule],
  controllers: [OralPerformanceController],
  providers: [OralPerformanceService],
  exports: [OralPerformanceService],
})
export class OralPerformanceModule {}
