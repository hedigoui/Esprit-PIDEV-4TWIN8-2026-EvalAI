// src/oral-performance/oral-performance.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OralPerformanceService } from './oral-performance.service';
// import { CreateOralPerformanceDto } from './dto/oral-performance.dto';
// import { UpdateScoresDto } from './dto/oral-performance.dto';
// import { UpdateFeedbackDto } from './dto/oral-performance.dto';
import { CreateOralPerformanceDto } from './dto/oral-performance.dto'; // ✅ Correct path
import { UpdateScoresDto } from './dto/oral-performance.dto'; // ✅ Correct path
import { UpdateFeedbackDto } from './dto/oral-performance.dto';
import { PerformanceStatus } from './oral-performance.entity';
import type { Response } from 'express';

@Controller('oral-performances')
export class OralPerformanceController {
  constructor(
    private readonly oralPerformanceService: OralPerformanceService,
  ) {}

  // src/oral-performance/oral-performance.controller.ts
  @Post()
  async create(@Body() createDto: CreateOralPerformanceDto) {
    try {
      const instructorId = createDto.instructorId || 'unknown-instructor';
      const performance = await this.oralPerformanceService.create(
        createDto,
        instructorId,
      );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Oral performance created successfully',
        data: performance,
      };
    } catch (error) {
      console.error('CREATE ERROR:', error);
      throw error;
    }
  }

  @Get()
  async findAll() {
    const performances = await this.oralPerformanceService.findAll();
    return {
      statusCode: HttpStatus.OK,
      data: performances,
    };
  }

  @Get('student/:studentId')
  async findByStudent(@Param('studentId') studentId: string) {
    const performances =
      await this.oralPerformanceService.findByStudent(studentId);
    return {
      statusCode: HttpStatus.OK,
      data: performances,
    };
  }

  @Get('instructor/:instructorId')
  async findByInstructor(@Param('instructorId') instructorId: string) {
    const performances =
      await this.oralPerformanceService.findByInstructor(instructorId);
    return {
      statusCode: HttpStatus.OK,
      data: performances,
    };
  }

  @Get('statistics')
  async getStatistics(
    @Query('studentId') studentId?: string,
    @Query('instructorId') instructorId?: string,
  ) {
    const statistics = await this.oralPerformanceService.getStatistics(
      studentId,
      instructorId,
    );
    return {
      statusCode: HttpStatus.OK,
      data: statistics,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const performance = await this.oralPerformanceService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      data: performance,
    };
  }

  @Post(':id/audio')
  @UseInterceptors(FileInterceptor('audio'))
  async uploadAudio(
    @Param('id') id: string,
    @UploadedFile() file: any, // Use any temporarily
    @Query('duration') duration?: number,
  ) {
    const performance = await this.oralPerformanceService.addAudioFile(
      id,
      file,
      duration,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Audio file uploaded successfully',
      data: performance,
    };
  }

  @Get(':id/audio')
  async streamAudio(@Param('id') id: string, @Res() res: Response) {
    const stream = await this.oralPerformanceService.getAudioStream(id);

    res.set({
      'Content-Type': 'audio/webm',
      'Content-Disposition': 'inline',
    });

    stream.pipe(res);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: CreateOralPerformanceDto,
  ) {
    const performance = await this.oralPerformanceService.update(id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Oral performance updated successfully',
      data: performance,
    };
  }

  @Put(':id/scores')
  async updateScores(
    @Param('id') id: string,
    @Body() scoresDto: UpdateScoresDto,
  ) {
    const performance = await this.oralPerformanceService.updateScores(
      id,
      scoresDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Scores updated successfully',
      data: performance,
    };
  }

  @Put(':id/feedback')
  async updateFeedback(
    @Param('id') id: string,
    @Body() feedbackDto: UpdateFeedbackDto,
  ) {
    const performance = await this.oralPerformanceService.updateFeedback(
      id,
      feedbackDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Feedback updated successfully',
      data: performance,
    };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: PerformanceStatus,
  ) {
    const performance = await this.oralPerformanceService.updateStatus(
      id,
      status,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Status updated successfully',
      data: performance,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.oralPerformanceService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Oral performance deleted successfully',
    };
  }
}
