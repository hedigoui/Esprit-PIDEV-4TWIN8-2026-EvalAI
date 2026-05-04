// backend/src/assemblyai/assemblyai.module.ts
import { Module } from '@nestjs/common';
import { AssemblyAIService } from './assemblyai.service';
import { AssemblyAIController } from './assemblyai.controller';

@Module({
  controllers: [AssemblyAIController],
  providers: [AssemblyAIService],
  exports: [AssemblyAIService],
})
export class AssemblyAIModule {}
