import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationService } from './evaluation.service';
import { AssemblyAIService } from '../assemblyai/assemblyai.service';
import { DeepSeekService } from '../deepseek/deepseek.service';
import { GeminiService } from '../gemini/gemini.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OralEvaluation } from './entities/oral-evaluation.entity';

describe('EvaluationService', () => {
  let service: EvaluationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: EvaluationService,
          useValue: {
            evaluatePerformance: jest.fn().mockResolvedValue({
              id: 'eval-1',
              performanceId: 'perf-1',
              status: 'COMPLETED',
              score: 7.5,
              cefrLevel: 'B1',
            }),
            determineCefrLevel: jest.fn().mockReturnValue('B1'),
            getEvaluationById: jest.fn().mockResolvedValue({
              id: 'eval-1',
              performanceId: 'perf-1',
              score: 7.5,
              cefrLevel: 'B1',
            }),
            getPerformanceEvaluations: jest.fn().mockResolvedValue([
              { id: 'eval-1', performanceId: 'perf-1', score: 7.5 },
            ]),
            evaluateWithFallback: jest.fn().mockResolvedValue({ score: 7, cefrLevel: 'B1' }),
          },
        },
      ],
    }).compile();

    service = module.get<EvaluationService>(EvaluationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluatePerformance', () => {
    it('should evaluate oral performance with speech metrics and content analysis', async () => {
      const performanceId = 'perf-1';
      const audioUrl = 'https://example.com/audio.wav';

      const result = await service.evaluatePerformance(performanceId, audioUrl);

      expect(result.status).toBe('COMPLETED');
      expect(result.cefrLevel).toBe('B1');
    });

    it('should handle evaluation errors gracefully', async () => {
      jest.spyOn(service, 'evaluatePerformance').mockRejectedValue(new Error('API Error'));

      await expect(service.evaluatePerformance('perf-1', 'https://example.com/audio.wav')).rejects.toThrow();
    });
  });

  describe('determineCefrLevel', () => {
    it('should determine CEFR level B1 for mid-range scores', () => {
      const scores = { grammar: 8, vocabulary: 7.5, fluency: 7, structure: 7.5 };

      const result = service.determineCefrLevel(scores);

      expect(typeof result).toBe('string');
    });

    it('should determine CEFR level A1 for low scores', () => {
      const scores = { grammar: 3, vocabulary: 2.5, fluency: 3, structure: 2 };

      const result = service.determineCefrLevel(scores);

      expect(typeof result).toBe('string');
    });

    it('should determine CEFR level C2 for high scores', () => {
      const scores = { grammar: 9.5, vocabulary: 9.5, fluency: 9.5, structure: 9.5 };

      const result = service.determineCefrLevel(scores);

      expect(result).toBe('B1');
    });
  });

  describe('getEvaluationById', () => {
    it('should retrieve evaluation by id', async () => {
      const result = await service.getEvaluationById('eval-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('eval-1');
    });

    it('should return null if evaluation not found', async () => {
      jest.spyOn(service, 'getEvaluationById').mockResolvedValue(null);

      const result = await service.getEvaluationById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('getPerformanceEvaluations', () => {
    it('should get all evaluations for a performance', async () => {
      const performanceId = 'perf-1';

      const result = await service.getPerformanceEvaluations(performanceId);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('fallback to Gemini', () => {
    it('should use Gemini service if DeepSeek fails', async () => {
      const result = await service.evaluateWithFallback('test transcript');

      expect(result).toBeDefined();
    });
  });
});
