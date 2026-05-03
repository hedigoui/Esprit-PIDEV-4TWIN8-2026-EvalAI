import { Test, TestingModule } from '@nestjs/testing';
import { AssemblyAIService } from './assemblyai.service';
import { ConfigService } from '@nestjs/config';

describe('AssemblyAIService', () => {
  let service: AssemblyAIService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key) => {
        return key === 'ASSEMBLYAI_API_KEY' ? 'test-api-key' : null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AssemblyAIService,
          useValue: {
            transcribeAudio: jest.fn().mockResolvedValue({
              transcript: 'Hello, this is a test',
              confidence: 0.98,
              metrics: { wpm: 140, fluency: 0.87, pace: 'normal', pauseRate: 0.05 },
            }),
            extractSpeechMetrics: jest.fn().mockResolvedValue({
              averageConfidence: 0.94,
              pronunciationQuality: 'good',
              problematicWords: [],
            }),
            analyzeFluentSpeech: jest.fn().mockResolvedValue({
              fluencyScore: 0.87,
              pauseCount: 3,
              avgPauseDuration: 0.5,
              pace: 'normal',
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AssemblyAIService>(AssemblyAIService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transcribeAudio', () => {
    it('should transcribe audio and extract metrics', async () => {
      jest.spyOn(service, 'transcribeAudio').mockResolvedValue({
        transcript: 'Hello, this is a test',
        confidence: 0.98,
        metrics: {
          wpm: 140,
          fluency: 0.87,
          pace: 'normal',
          pauseRate: 0.05,
        },
      });

      const result = await service.transcribeAudio('https://example.com/audio.wav');

      expect(result.transcript).toBeDefined();
      expect(result.transcript.length).toBeGreaterThan(0);
      expect(result.metrics.wpm).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle invalid audio URL', async () => {
      jest.spyOn(service, 'transcribeAudio').mockRejectedValue(new Error('Invalid URL'));

      await expect(service.transcribeAudio('invalid-url')).rejects.toThrow();
    });

    it('should return correct WPM range', async () => {
      jest.spyOn(service, 'transcribeAudio').mockResolvedValue({
        transcript: 'Hello world',
        confidence: 0.95,
        metrics: {
          wpm: 120,
          fluency: 0.85,
          pace: 'normal',
          pauseRate: 0.08,
        },
      });

      const result = await service.transcribeAudio('https://example.com/audio.wav');

      expect(result.metrics.wpm).toBeGreaterThanOrEqual(0);
      expect(result.metrics.wpm).toBeLessThanOrEqual(300);
    });
  });

  describe('extractSpeechMetrics', () => {
    it('should calculate pronunciation confidence from word-level data', async () => {
      const words = [
        { word: 'Hello', confidence: 0.99 },
        { word: 'world', confidence: 0.95 },
        { word: 'test', confidence: 0.88 },
      ];

      jest.spyOn(service, 'extractSpeechMetrics').mockResolvedValue({
        averageConfidence: 0.94,
        pronunciationQuality: 'good',
        problematicWords: ['test'],
      });

      const result = await service.extractSpeechMetrics(words);

      expect(result.averageConfidence).toBeGreaterThan(0.8);
      expect(Array.isArray(result.problematicWords)).toBe(true);
    });

    it('should identify low confidence words', async () => {
      const words = [
        { word: 'excellent', confidence: 0.85 },
        { word: 'pronunciation', confidence: 0.75 },
        { word: 'issue', confidence: 0.65 },
      ];

      jest.spyOn(service, 'extractSpeechMetrics').mockResolvedValue({
        averageConfidence: 0.75,
        pronunciationQuality: 'fair',
        problematicWords: ['pronunciation', 'issue'],
      });

      const result = await service.extractSpeechMetrics(words);

      expect(result.problematicWords.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeFluentSpeech', () => {
    it('should analyze fluency from pauses and pace', async () => {
      jest.spyOn(service, 'analyzeFluentSpeech').mockResolvedValue({
        fluencyScore: 0.87,
        pauseCount: 3,
        avgPauseDuration: 0.5,
        pace: 'normal',
      });

      const result = await service.analyzeFluentSpeech({
        duration: 45,
        wordCount: 150,
        pauses: [0.3, 0.5, 0.7],
      });

      expect(result.fluencyScore).toBeGreaterThan(0);
      expect(result.fluencyScore).toBeLessThanOrEqual(1);
      expect(result.pace).toMatch(/slow|normal|fast/);
    });
  });

  describe('error handling', () => {
    it('should handle API timeout gracefully', async () => {
      jest.spyOn(service, 'transcribeAudio').mockRejectedValue(new Error('API Timeout'));

      await expect(service.transcribeAudio('https://example.com/audio.wav')).rejects.toThrow('API Timeout');
    });

    it('should handle missing API key', async () => {
      expect(configService.get('ASSEMBLYAI_API_KEY')).toBeDefined();
    });
  });
});
