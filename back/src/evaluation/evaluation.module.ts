// backend/src/evaluation/evaluation.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { OralEvaluation } from './entities/oral-evaluation.entity';
import { OralPerformance } from '../oral-performance/oral-performance.entity';
import { AssemblyAIModule } from '../assemblyai/assemblyai.module';
import { GridFSModule } from '../gridfs/gridfs.module';
import { DeepSeekModule } from '../deepseek/deepseek.module'; // Import DeepSeekModule

@Module({
  imports: [
    TypeOrmModule.forFeature([OralEvaluation, OralPerformance]),
    AssemblyAIModule,
    GridFSModule,
    DeepSeekModule, // Add DeepSeekModule here
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}