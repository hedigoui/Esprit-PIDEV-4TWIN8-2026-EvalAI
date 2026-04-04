// backend/src/evaluation/evaluation.controller.ts
import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';

@Controller('evaluations')
export class EvaluationController {
  constructor(private evaluationService: EvaluationService) {}

  @Post('performance/:performanceId')
  async evaluate(
    @Param('performanceId') performanceId: string,
    @Body('subject') subject: string,
  ) {
    return this.evaluationService.evaluatePerformance(performanceId, subject);
  }

  @Get('performance/:performanceId')
  async getEvaluation(@Param('performanceId') performanceId: string) {
    return this.evaluationService.getEvaluation(performanceId);
  }

  @Get('student/:studentId')
  async getStudentEvaluations(@Param('studentId') studentId: string) {
    return this.evaluationService.getAllEvaluationsForStudent(studentId);
  }
}
