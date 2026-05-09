import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { OralEvaluation } from './entities/oral-evaluation.entity';
import { OralPerformance } from '../oral-performance/oral-performance.entity';
import { AssemblyAIModule } from '../assemblyai/assemblyai.module';
import { GridFSModule } from '../gridfs/gridfs.module';
import { DeepSeekModule } from '../deepseek/deepseek.module';
import { GeminiModule } from '../gemini/gemini.module';
import { EmailModule } from '../email/email.module';
import { Certificate } from './entities/certificate.entity';
import { CertificateService } from './certificate.service';
import { Users } from '../users/users.models';

@Module({
  imports: [
    TypeOrmModule.forFeature([OralEvaluation, OralPerformance, Certificate, Users]),
    AssemblyAIModule,
    GridFSModule,
    DeepSeekModule,
    GeminiModule,
    EmailModule,
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService, CertificateService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
