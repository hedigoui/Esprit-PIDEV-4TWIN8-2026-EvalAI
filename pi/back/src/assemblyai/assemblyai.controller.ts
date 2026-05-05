import { Controller, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssemblyAIService } from './assemblyai.service';

@Controller('assemblyai')
export class AssemblyAIController {
  constructor(private readonly assemblyAIService: AssemblyAIService) {}

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribeAudio(@UploadedFile() file: any) {
    if (!file) {
      throw new HttpException('No audio file provided', HttpStatus.BAD_REQUEST);
    }
    
    try {
      // The language defaults to 'en', but we can extract it from body if needed
      // Currently defaulting to 'en' for dictation
      const text = await this.assemblyAIService.transcribeAudio(file.buffer, 'en');
      return { text };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
