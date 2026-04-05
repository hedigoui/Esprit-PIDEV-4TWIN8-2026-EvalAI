import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OralPerformanceController } from './oral-performance.controller';
import { OralPerformanceService } from './oral-performance.service';
import { OralPerformance } from './oral-performance.entity';
import { GridFSModule } from '../gridfs/gridfs.module';

@Module({
  imports: [TypeOrmModule.forFeature([OralPerformance]), GridFSModule],
  controllers: [OralPerformanceController],
  providers: [OralPerformanceService],
  exports: [OralPerformanceService],
})
export class OralPerformanceModule {}
