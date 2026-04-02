import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OralPerformance,
  ProficiencyLevel,
  PerformanceStatus,
} from '../oral-performance/oral-performance.entity';
import {
  OralEvaluation,
  EvaluationStatus,
} from './entities/oral-evaluation.entity';
import { AssemblyAIService } from '../assemblyai/assemblyai.service';
import { GridFSService } from '../gridfs/gridfs.service';
import { DeepSeekService } from '../deepseek/deepseek.service';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    @InjectRepository(OralPerformance)
    private performanceRepo: Repository<OralPerformance>,
    @InjectRepository(OralEvaluation)
    private evaluationRepo: Repository<OralEvaluation>,
    private assemblyAIService: AssemblyAIService,
    private gridFSService: GridFSService,
    private deepseekService: DeepSeekService,
  ) {}

  async evaluatePerformance(performanceId: string, subject: string) {
    this.logger.log('========== STARTING EVALUATION ==========');
    this.logger.log(`Performance ID: ${performanceId}`);
    this.logger.log(`Subject: ${subject}`);

    try {
      // Find performance by string comparison (works with MongoDB)
      const allPerformances = await this.performanceRepo.find();
      const performance = allPerformances.find(
        (p) => p._id.toString() === performanceId,
      );

      if (!performance) {
        this.logger.error(`Performance not found with ID: ${performanceId}`);
        throw new NotFoundException(
          `Performance with ID ${performanceId} not found`,
        );
      }

      this.logger.log(`✅ Performance found: ${performance._id}`);

      if (!performance.audioFile?.fileId) {
        throw new Error('No audio file found for this performance');
      }

      // Check if evaluation already exists
      let evaluation = await this.evaluationRepo.findOne({
        where: { performanceId },
      });

      if (evaluation) {
        this.logger.log(`Existing evaluation found`);
        return evaluation;
      }

      // Create new evaluation record
      evaluation = this.evaluationRepo.create({
        performanceId,
        subject,
        status: EvaluationStatus.PROCESSING,
        language: 'en',
      });
      await this.evaluationRepo.save(evaluation);

      const startTime = Date.now();

      try {
        // Step 1: Get audio from GridFS
        this.logger.log(
          `Fetching audio from GridFS: ${performance.audioFile.fileId}`,
        );
        const audioBuffer = await this.gridFSService.getFileAsBuffer(
          performance.audioFile.fileId,
        );

        // Step 2: Evaluate with AssemblyAI (speech metrics)
        this.logger.log('Calling AssemblyAI for speech analysis...');
        const assemblyResult =
          await this.assemblyAIService.evaluateAudio(audioBuffer);

        // Update evaluation with speech metrics
        evaluation.transcript = assemblyResult.transcript;
        evaluation.speechMetrics = assemblyResult.metrics;
        evaluation.assemblyAIRaw = assemblyResult.rawData;

        // Step 3: Evaluate content with DeepSeek (if transcript exists)
        if (
          assemblyResult.transcript &&
          assemblyResult.transcript.trim().length > 0
        ) {
          this.logger.log('Calling DeepSeek for content evaluation...');

          try {
            const contentResult =
              await this.deepseekService.evaluateContent(
                assemblyResult.transcript,
                subject,
                'en', // Default to English, can be detected later
              );

            // Add content results to evaluation
            evaluation.contentScores = contentResult.scores;
            evaluation.contentAnalysis = contentResult.analysis;
            evaluation.detailedContentFeedback =
              contentResult.detailedFeedback;

            this.logger.log('✅ Content evaluation completed');
          } catch (deepseekError) {
            this.logger.error(
              `DeepSeek evaluation failed: ${deepseekError.message}`,
            );
            // Continue without content evaluation - don't fail the whole process
          }
        } else {
          this.logger.log(
            '⚠️ No transcript available for content evaluation',
          );
        }

        // Step 4: Finalize evaluation
        evaluation.status = EvaluationStatus.COMPLETED;
        evaluation.evaluatedAt = new Date();
        evaluation.processingTime = Date.now() - startTime;

        await this.evaluationRepo.save(evaluation);

        // Step 5: Update original performance with all scores
        await this.updatePerformanceScores(performance, evaluation);

        this.logger.log(
          `✅ Evaluation completed successfully in ${evaluation.processingTime}ms`,
        );
        return evaluation;
      } catch (error) {
        this.logger.error(
          `Evaluation processing failed: ${error.message}`,
        );
        this.logger.error(error.stack);

        if (evaluation) {
          evaluation.status = EvaluationStatus.FAILED;
          evaluation.errorMessage = error.message;
          evaluation.processingTime = Date.now() - startTime;
          await this.evaluationRepo.save(evaluation);
        }
        throw error;
      }
    } catch (error) {
      this.logger.error(`❌ evaluatePerformance error: ${error.message}`);
      throw error;
    }
  }

  private async updatePerformanceScores(
    performance: OralPerformance,
    evaluation: OralEvaluation,
  ) {
    // Update scores in the original performance entity
    performance.scores = {
      ...performance.scores,
      pronunciation: evaluation.speechMetrics?.pronunciation || 0,
      fluency: evaluation.speechMetrics?.fluency || 0,
      vocabulary: evaluation.contentScores?.vocabulary || 0,
      grammar: evaluation.contentScores?.grammar || 0,
      contentOrganization: evaluation.contentScores?.contentStructure || 0,
    };

    // Calculate total score including all metrics
    const scores = [
      evaluation.speechMetrics?.fluency || 0,
      evaluation.speechMetrics?.pronunciation || 0,
      evaluation.speechMetrics?.confidence || 0,
      evaluation.contentScores?.contentStructure || 0,
      evaluation.contentScores?.coherence || 0,
      evaluation.contentScores?.topicRelevance || 0,
      evaluation.contentScores?.grammar || 0,
      evaluation.contentScores?.vocabulary || 0,
    ].filter((score) => score > 0);

    if (scores.length > 0) {
      performance.totalScore = Math.round(
        scores.reduce((a, b) => a + b, 0) / scores.length,
      );
    }

    // Determine overall proficiency using the enum
    if (performance.totalScore) {
      if (performance.totalScore >= 85) {
        performance.overallProficiency = ProficiencyLevel.PROFICIENT;
      } else if (performance.totalScore >= 70) {
        performance.overallProficiency = ProficiencyLevel.ADVANCED;
      } else if (performance.totalScore >= 55) {
        performance.overallProficiency = ProficiencyLevel.INTERMEDIATE;
      } else {
        performance.overallProficiency = ProficiencyLevel.BEGINNER;
      }
    }

    // Update status using the enum
    if (
      performance.status === PerformanceStatus.PENDING ||
      performance.status === PerformanceStatus.IN_PROGRESS
    ) {
      performance.status = PerformanceStatus.GRADED;
    }

    performance.completedDate = new Date();

    await this.performanceRepo.save(performance);
    this.logger.log(
      `Updated performance ${performance._id} with scores`,
    );
  }

  async getEvaluation(performanceId: string) {
    this.logger.log(`Fetching evaluation for performance: ${performanceId}`);
    const evaluation = await this.evaluationRepo.findOne({
      where: { performanceId },
    });

    if (!evaluation) {
      this.logger.log(
        `No evaluation found for performance: ${performanceId}`,
      );
      return null;
    }

    return evaluation;
  }

  async getEvaluationStatus(performanceId: string) {
    const evaluation = await this.getEvaluation(performanceId);

    if (!evaluation) {
      return { exists: false, status: 'pending' };
    }

    return {
      exists: true,
      status: evaluation.status,
      processingTime: evaluation.processingTime,
      evaluatedAt: evaluation.evaluatedAt,
    };
  }

  async getAllEvaluationsForStudent(studentId: string) {
    this.logger.log(`Fetching all evaluations for student: ${studentId}`);

    // First get all performances for this student
    const performances = await this.performanceRepo.find({
      where: { studentId: studentId as any },
    });

    if (performances.length === 0) {
      return [];
    }

    const performanceIds = performances.map((p) => p._id.toString());

    // Get evaluations for these performances
    const evaluations = await this.evaluationRepo.find();

    // Combine performance and evaluation data
    return performances.map((performance) => {
      const evaluation = evaluations.find(
        (e) => e.performanceId === performance._id.toString(),
      );
      return {
        performance: {
          id: performance._id,
          title: performance.title,
          createdAt: performance.createdAt,
          status: performance.status,
          audioFile: performance.audioFile,
        },
        evaluation: evaluation
          ? {
              id: evaluation._id,
              status: evaluation.status,
              speechMetrics: evaluation.speechMetrics,
              contentScores: evaluation.contentScores,
              overallScore: evaluation.contentScores
                ? Math.round(
                    (
                      (evaluation.speechMetrics?.fluency || 0) +
                      (evaluation.speechMetrics?.pronunciation || 0) +
                      (evaluation.contentScores?.contentStructure || 0) +
                      (evaluation.contentScores?.grammar || 0) +
                      (evaluation.contentScores?.vocabulary || 0)
                    ) / 5,
                  )
                : null,
              evaluatedAt: evaluation.evaluatedAt,
            }
          : null,
      };
    });
  }

  async deleteEvaluation(performanceId: string) {
    this.logger.log(`Deleting evaluation for performance: ${performanceId}`);

    const evaluation = await this.evaluationRepo.findOne({
      where: { performanceId },
    });

    if (evaluation) {
      await this.evaluationRepo.remove(evaluation);
      this.logger.log(`Evaluation deleted`);
      return { success: true };
    }

    return { success: false, message: 'Evaluation not found' };
  }
}
