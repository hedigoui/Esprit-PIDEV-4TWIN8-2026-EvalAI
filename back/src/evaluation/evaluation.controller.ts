// backend/src/evaluation/evaluation.controller.ts
import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';

@Controller('evaluations')
export class EvaluationController {
  constructor(private evaluationService: EvaluationService) {}

  @Post('performance/:performanceId')
  async evaluate(
    @Param('performanceId') performanceId: string,
    @Body('subject') subject: string,
    @Body('language') language: string = 'en', // Default to English
  ) {
    return this.evaluationService.evaluatePerformance(performanceId, subject, language);
  }

  @Get('performance/:performanceId')
  async getEvaluation(@Param('performanceId') performanceId: string) {
    return this.evaluationService.getEvaluation(performanceId);
  }

  @Get('student/:studentId')
  async getStudentEvaluations(
    @Param('studentId') studentId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!page && !limit) {
      return this.evaluationService.getAllEvaluationsForStudent(studentId);
    }
    const parsedPage = Number(page ?? 1);
    const parsedLimit = Number(limit ?? 20);
    return this.evaluationService.getEvaluationsForStudentPaginated(
      studentId,
      parsedPage,
      parsedLimit,
    );
  }
}
