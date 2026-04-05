// backend/src/gemini/gemini.module.ts
import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Module({
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule {}
