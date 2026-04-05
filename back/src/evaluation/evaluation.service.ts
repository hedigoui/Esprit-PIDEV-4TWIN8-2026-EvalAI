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
import { GeminiService } from '../gemini/gemini.service';
import { deriveCefrLevel } from './cefr-calibration.util';

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
    private geminiService: GeminiService,
  ) {}

  async evaluatePerformance(
    performanceId: string,
    subject: string,
    language: string = 'en',
  ) {
    this.logger.log('========== STARTING EVALUATION ==========');
    this.logger.log(`Performance ID: ${performanceId}`);
    this.logger.log(`Subject: ${subject}`);
    this.logger.log(`Language: ${language}`);

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
        language,
        status: EvaluationStatus.PROCESSING,
      });
      await this.evaluationRepo.save(evaluation);

      const startTime = Date.now();

      try {
        // Step 1: Get audio from GridFS
        this.logger.log(
          `Fetching audio from GridFS: ${performance.audioFile.fileId}`,
        );
        let audioBuffer: Buffer;
        try {
          audioBuffer = await this.gridFSService.getFileAsBuffer(
            performance.audioFile.fileId,
          );
          this.logger.log(`✅ Audio retrieved from GridFS (${audioBuffer.length} bytes)`);
        } catch (gridfsError) {
          this.logger.error(`❌ GridFS retrieval failed: ${gridfsError.message}`);
          throw new Error(`Failed to retrieve audio file: ${gridfsError.message}`);
        }

        // Step 2: Evaluate with AssemblyAI (speech metrics)
        this.logger.log('Calling AssemblyAI for speech analysis...');
        let assemblyResult;
        try {
          assemblyResult =
            await this.assemblyAIService.evaluateAudio(audioBuffer);
          this.logger.log('✅ AssemblyAI response received');
          this.logger.log(`   Transcript length: ${assemblyResult.transcript?.length || 0} characters`);
        } catch (assemblyError) {
          this.logger.error(`❌ AssemblyAI evaluation failed: ${assemblyError.message}`);
          throw new Error(`AssemblyAI evaluation failed: ${assemblyError.message}`);
        }

        // Update evaluation with speech metrics
        evaluation.transcript = assemblyResult.transcript;
        evaluation.speechMetrics = assemblyResult.metrics;
        evaluation.assemblyAIRaw = assemblyResult.rawData;

        // Step 2.5: Validate transcript quality before proceeding
        const wordCount = assemblyResult.transcript?.trim().split(/\s+/).length || 0;
        this.logger.log(`📏 Transcript validation: ${wordCount} words`);

        if (wordCount < 5) {
          this.logger.warn(
            `⚠️ WARNING: Response is too short (${wordCount} words). Evaluation may not be reliable.`,
          );
          evaluation.lowConfidenceFlag = true;
          evaluation.lowConfidenceReason = `Transcript too short: only ${wordCount} words. Minimum recommended: 10+ words.`;
        } else if (wordCount < 10) {
          this.logger.warn(
            `⚠️ Response is quite short (${wordCount} words). Quality may be affected.`,
          );
          evaluation.lowConfidenceFlag = true;
          evaluation.lowConfidenceReason = `Short response: ${wordCount} words. Better evaluation with 20+ words.`;
        }

        // Step 3: Evaluate content with DeepSeek (if transcript exists)
        if (
          assemblyResult.transcript &&
          assemblyResult.transcript.trim().length > 0
        ) {
          this.logger.log('📝 Calling DeepSeek for content evaluation...');
          this.logger.log(`   Transcript length: ${assemblyResult.transcript.length} characters`);
          this.logger.log(`   Subject: ${subject}`);

          try {
            const outcome = await this.deepseekService.evaluateContent(
              assemblyResult.transcript,
              subject,
              (language as 'en' | 'fr') || 'en',
              'encouraging',
              assemblyResult.metrics,
            );

            this.logger.log('✅ DeepSeek response received');
            this.logger.log(`   LLM Succeeded: ${outcome.llmSucceeded}`);

            let contentResult = outcome.data;
            this.logger.log('📊 DeepSeek Content Scores:');
            if (contentResult.scores) {
              this.logger.log(`   - Grammar: ${contentResult.scores.grammar}`);
              this.logger.log(`   - Vocabulary: ${contentResult.scores.vocabulary}`);
              this.logger.log(`   - Content Structure: ${contentResult.scores.contentStructure}`);
              this.logger.log(`   - Coherence: ${contentResult.scores.coherence}`);
              this.logger.log(`   - Topic Relevance: ${contentResult.scores.topicRelevance}`);
            }

            // STRICT EVALUATION: Apply penalties for poor alignment with topic
            const topicRelevance = contentResult.scores?.topicRelevance || 50;
            if (topicRelevance < 70) {
              this.logger.warn(`🚨 STRICT MODE: Topic relevance insufficient (${topicRelevance}/100) - response does NOT adequately address "${subject}"`);
              this.logger.warn(`   Transcript: "${assemblyResult.transcript}"`);
              
              // Severely penalize weak topic alignment (including moderately off-topic)
              contentResult.scores = {
                ...contentResult.scores,
                grammar: Math.min(contentResult.scores.grammar, 25),
                vocabulary: Math.min(contentResult.scores.vocabulary, 20),
                contentStructure: Math.min(contentResult.scores.contentStructure, 15),
                coherence: Math.min(contentResult.scores.coherence, 20),
                topicRelevance: Math.max(15, topicRelevance * 0.25), // Force very low: 65% → ~16%
              };
              this.logger.warn(`   PENALIZED SCORES: Structure=${contentResult.scores.contentStructure}, Topic=${Math.round(contentResult.scores.topicRelevance)}, Vocab=${contentResult.scores.vocabulary}`);
              evaluation.lowConfidenceFlag = true;
              evaluation.lowConfidenceReason = `Response inadequately addresses topic "${subject}". Repeated phrase without substantive self-presentation content.`;
            }
            
            // Gemini fallback disabled - using only DeepSeek for content evaluation
            // if (!outcome.llmSucceeded && this.geminiService.isAvailable()) {
            //   this.logger.warn(
            //     'DeepSeek did not yield validated LLM narrative; trying Gemini backup...',
            //   );
            //   const gemini = await this.geminiService.tryEvaluateBackup(
            //     assemblyResult.transcript,
            //     subject,
            //     'en',
            //     assemblyResult.metrics,
            //   );
            //   if (gemini) {
            //     contentResult = gemini;
            //     this.logger.log('✅ Content narrative from Gemini backup');
            //   } else {
            //     this.logger.warn(
            //       'Gemini backup unavailable or rejected output; using transcript-grounded heuristic narrative',
            //     );
            //   }
            // } else if (!outcome.llmSucceeded) {
            //   this.logger.warn(
            //     'Using transcript-grounded heuristic narrative (no LLM validation passed)',
            //   );
            // }
            if (!outcome.llmSucceeded) {
              this.logger.warn(
                '⚠️ DeepSeek evaluation completed but validation may have issues',
              );
            }

            evaluation.contentScores = contentResult.scores;
            let calibratedCefr = deriveCefrLevel(
              contentResult.scores,
              assemblyResult.metrics,
            );
            
            // Cap CEFR level based on response length (can't assess high proficiency with very short responses)
            const cefrHierarchy = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            const cefrIndex = cefrHierarchy.indexOf(calibratedCefr);
            
            // STRICT: Cap CEFR based on word count AND topic relevance
            const avgScore = ((contentResult.scores?.contentStructure || 0) +
                            (contentResult.scores?.coherence || 0) +
                            (contentResult.scores?.topicRelevance || 0) +
                            (contentResult.scores?.grammar || 0) +
                            (contentResult.scores?.vocabulary || 0)) / 5;
            
            this.logger.log(`📏 Strict CEFR Evaluation: wordCount=${wordCount}, avgScore=${Math.round(avgScore)}, topicRelevance=${contentResult.scores?.topicRelevance || 0}`);
            
            if (wordCount < 10 || avgScore < 40) {
              // Very short response or very poor quality: A1 only
              calibratedCefr = 'A1';
              this.logger.warn(
                `🚨 STRICT: CEFR capped to A1. Reasons: wordCount=${wordCount}, avgScore=${Math.round(avgScore)}`,
              );
            } else if (wordCount < 20 && avgScore < 50) {
              // Short + mediocre: A2
              calibratedCefr = 'A2';
              this.logger.warn(`⚠️ STRICT: CEFR capped to A2 (short & weak)`);
            } else if (wordCount < 20 && cefrIndex > 1) {
              // Short response: cap at A2
              calibratedCefr = 'A2';
              this.logger.warn(
                `⚠️ STRICT: CEFR capped to A2 due to short response (${wordCount} words)`,
              );
            } else if (wordCount < 30 && cefrIndex > 2) {
              // Medium-short response: cap at B1
              calibratedCefr = 'B1';
              this.logger.warn(
                `⚠️ STRICT: CEFR capped to B1 due to medium-short response (${wordCount} words)`,
              );
            } else if (wordCount < 100 && cefrIndex > 3) {
              // Medium response (under 100 words) cannot justify C1/C2: cap at B2
              calibratedCefr = 'B2';
              this.logger.warn(
                `⚠️ STRICT: CEFR capped to B2. Responses under 100 words cannot demonstrate C1/C2 proficiency (actual: ${wordCount} words)`,
              );
            } else if (avgScore < 50 && cefrIndex > 1) {
              // Poor quality overall: cap at A2
              calibratedCefr = 'A2';
              this.logger.warn(`⚠️ STRICT: CEFR capped to A2 due to poor average score (${Math.round(avgScore)}/100)`);
            }
            
            this.logger.log('📈 Content Analysis:');
            this.logger.log(`   - CEFR Level: ${calibratedCefr} (word count: ${wordCount})`);
            if (contentResult.analysis) {
              this.logger.log(`   - Strengths: ${contentResult.analysis.strengths?.join(', ') || 'N/A'}`);
              this.logger.log(`   - Areas for Improvement: ${contentResult.analysis.improvements?.join(', ') || 'N/A'}`);
            }
            
            evaluation.contentAnalysis = {
              ...contentResult.analysis,
              cefrLevel: calibratedCefr,
            };
            evaluation.detailedContentFeedback =
              contentResult.detailedFeedback;

            this.logger.log('💬 Detailed Feedback from DeepSeek:');
            if (contentResult.detailedFeedback) {
              this.logger.log(`   ${contentResult.detailedFeedback}`);
            }

            this.logger.log(
              `✅ Content evaluation completed (CEFR ${calibratedCefr} from scores + speech metrics)`,
            );
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
        this.logger.error(`Full error details:`, error);
        this.logger.error(`Error stack:`, error.stack);

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
      this.logger.error(`Performance ID: ${performanceId}`);
      this.logger.error(`Error details:`, JSON.stringify({
        message: error.message,
        stack: error.stack,
        name: error.name,
      }, null, 2));
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
          totalScore: performance.totalScore,
          overallProficiency: performance.overallProficiency,
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
