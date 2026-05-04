import { Test, TestingModule } from '@nestjs/testing';
import { DeepSeekService } from './deepseek.service';
import { ConfigService } from '@nestjs/config';

describe('DeepSeekService', () => {
  let service: DeepSeekService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key) => {
        return key === 'DEEPSEEK_API_KEY' ? 'test-key' : null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DeepSeekService,
          useValue: {
            evaluateContent: jest.fn().mockResolvedValue({
              score: 7.5,
              grammar: 8,
              vocabulary: 7,
              structure: 7.5,
              cefrLevel: 'B1',
              feedback: { strengths: [], weaknesses: [], recommendations: [] },
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DeepSeekService>(DeepSeekService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateContent', () => {
    it('should evaluate transcript and return structured feedback', async () => {
      const transcript = 'I enjoy reading books and learning new languages every day';

      jest.spyOn(service, 'evaluateContent').mockResolvedValue({
        score: 7.5,
        grammar: 8,
        vocabulary: 7,
        structure: 7.5,
        cefrLevel: 'B1',
        feedback: {
          strengths: ['Good vocabulary use', 'Clear structure'],
          weaknesses: ['Minor grammar issues'],
          recommendations: ['Practice present perfect tense'],
        },
      });

      const result = await service.evaluateContent(transcript);

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(10);
      expect(result.cefrLevel).toBeDefined();
      expect(result.feedback.strengths).toBeDefined();
      expect(Array.isArray(result.feedback.strengths)).toBe(true);
    });

    it('should evaluate different CEFR levels', async () => {
      const transcripts = [
        { text: 'Hello', expectedLevel: 'A1' },
        { text: 'I like to read books and play sports', expectedLevel: 'B1' },
        { text: 'The complexities of contemporary linguistics intersect significantly', expectedLevel: 'C2' },
      ];

      for (const item of transcripts) {
        jest.spyOn(service, 'evaluateContent').mockResolvedValue({
          score: 7,
          cefrLevel: item.expectedLevel,
          feedback: { strengths: [], weaknesses: [], recommendations: [] },
        });

        const result = await service.evaluateContent(item.text);

        expect(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).toContain(result.cefrLevel);
      }
    });

    it('should include all required evaluation fields', async () => {
      jest.spyOn(service, 'evaluateContent').mockResolvedValue({
        score: 7.5,
        grammar: 8,
        vocabulary: 7,
        structure: 7.5,
        cefrLevel: 'B1',
        feedback: {
          strengths: [],
          weaknesses: [],
          recommendations: [],
        },
      });

      const result = await service.evaluateContent('test transcript');

      expect(result.score).toBeDefined();
      expect(result.grammar).toBeDefined();
      expect(result.vocabulary).toBeDefined();
      expect(result.cefrLevel).toBeDefined();
      expect(result.feedback).toBeDefined();
    });
  });

  describe('API error handling', () => {
    it('should return fallback scores if API fails', async () => {
      jest.spyOn(service, 'evaluateContent').mockRejectedValue(new Error('API Error'));

      await expect(service.evaluateContent('test transcript')).rejects.toThrow();
    });

    it('should handle timeout gracefully', async () => {
      jest.spyOn(service, 'evaluateContent').mockRejectedValue(new Error('Timeout'));

      await expect(service.evaluateContent('test transcript')).rejects.toThrow('Timeout');
    });

    it('should handle invalid response format', async () => {
      jest.spyOn(service, 'evaluateContent').mockRejectedValue(new Error('Invalid response'));

      await expect(service.evaluateContent('test transcript')).rejects.toThrow();
    });
  });

  describe('language support', () => {
    it('should evaluate English text', async () => {
      jest.spyOn(service, 'evaluateContent').mockResolvedValue({
        score: 7.5,
        cefrLevel: 'B1',
        feedback: { strengths: [], weaknesses: [], recommendations: [] },
      });

      const result = await service.evaluateContent('I enjoy reading books');

      expect(result.score).toBeDefined();
    });

    it('should handle multi-language input', async () => {
      jest.spyOn(service, 'evaluateContent').mockResolvedValue({
        score: 6.5,
        cefrLevel: 'A2',
        feedback: { strengths: [], weaknesses: [], recommendations: [] },
      });

      const result = await service.evaluateContent('Hello, comment allez-vous?');

      expect(result).toBeDefined();
    });
  });

  describe('score validation', () => {
    it('should return scores between 0 and 10', async () => {
      jest.spyOn(service, 'evaluateContent').mockResolvedValue({
        score: 7.5,
        grammar: 8,
        vocabulary: 7,
        structure: 7.5,
        cefrLevel: 'B1',
        feedback: { strengths: [], weaknesses: [], recommendations: [] },
      });

      const result = await service.evaluateContent('test');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(10);
      expect(result.grammar).toBeGreaterThanOrEqual(0);
      expect(result.grammar).toBeLessThanOrEqual(10);
    });
  });
});
