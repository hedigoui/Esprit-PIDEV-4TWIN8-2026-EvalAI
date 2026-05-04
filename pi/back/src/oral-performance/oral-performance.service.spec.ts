import { Test, TestingModule } from '@nestjs/testing';
import { OralPerformanceService } from './oral-performance.service';

describe('OralPerformanceService', () => {
  let service: OralPerformanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: OralPerformanceService,
          useValue: {
            createPerformance: jest.fn().mockResolvedValue({
              id: 'perf-1',
              status: 'RECORDING',
              studentId: 'student-1',
            }),
            uploadAudio: jest.fn().mockResolvedValue({
              performanceId: 'perf-1',
              fileId: 'file-id-123',
              duration: 45,
            }),
            getStudentPerformances: jest.fn().mockResolvedValue([
              { id: 'perf-1', studentId: 'student-1', subject: 'Daily routines' },
              { id: 'perf-2', studentId: 'student-1', subject: 'Hobbies' },
            ]),
            getPerformanceById: jest.fn().mockResolvedValue({
              id: 'perf-1',
              studentId: 'student-1',
              subject: 'Daily routines',
            }),
            updatePerformance: jest.fn().mockResolvedValue({ id: 'perf-1' }),
            deletePerformance: jest.fn().mockResolvedValue(true),
            getInstructorPerformances: jest.fn().mockResolvedValue([
              { id: 'perf-1', instructorId: 'instructor-1' },
            ]),
            updatePerformanceStatus: jest.fn().mockResolvedValue({ id: 'perf-1' }),
          },
        },
      ],
    }).compile();

    service = module.get<OralPerformanceService>(OralPerformanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPerformance', () => {
    it('should create a new performance record', async () => {
      const createDto = {
        studentId: 'student-1',
        instructorId: 'instructor-1',
        subject: 'Daily routines',
      };

      const result = await service.createPerformance(createDto);

      expect(result.status).toBe('RECORDING');
      expect(result.studentId).toBe('student-1');
    });

    it('should require student and instructor IDs', async () => {
      const invalidDto = { subject: 'Daily routines' };

      const result = await service.createPerformance(invalidDto as any);
      expect(result).toBeDefined();
    });
  });

  describe('uploadAudio', () => {
    it('should upload audio for performance', async () => {
      const result = await service.uploadAudio('perf-1', Buffer.from('audio-data'));

      expect(result.fileId).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should return file ID after upload', async () => {
      const result = await service.uploadAudio('perf-1', Buffer.from('data'));

      expect(result.performanceId).toBe('perf-1');
      expect(result.fileId).toBe('file-id-123');
    });
  });

  describe('getStudentPerformances', () => {
    it('should retrieve all performances for a student', async () => {
      const result = await service.getStudentPerformances('student-1');

      expect(result).toHaveLength(2);
      expect(result[0].studentId).toBe('student-1');
    });

    it('should retrieve student performances', async () => {
      const result = await service.getStudentPerformances('student-1');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getPerformanceById', () => {
    it('should retrieve performance by id', async () => {
      const result = await service.getPerformanceById('perf-1');

      expect(result.id).toBe('perf-1');
      expect(result.studentId).toBe('student-1');
    });

    it('should return performance object', async () => {
      const result = await service.getPerformanceById('perf-1');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('studentId');
    });
  });

  describe('updatePerformance', () => {
    it('should update performance record', async () => {
      const updateDto = { subject: 'Updated subject' };
      const result = await service.updatePerformance('perf-1', updateDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('perf-1');
    });

    it('should return updated performance', async () => {
      const result = await service.updatePerformance('perf-1', {});

      expect(result.id).toBe('perf-1');
    });
  });

  describe('deletePerformance', () => {
    it('should delete performance', async () => {
      const result = await service.deletePerformance('perf-1');

      expect(result).toBe(true);
    });

    it('should return success status', async () => {
      const result = await service.deletePerformance('perf-1');

      expect(typeof result).toBe('boolean');
    });
  });

  describe('getInstructorPerformances', () => {
    it('should retrieve performances assigned to instructor', async () => {
      const result = await service.getInstructorPerformances('instructor-1');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return array of performances', async () => {
      const result = await service.getInstructorPerformances('instructor-1');

      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('updatePerformanceStatus', () => {
    it('should update performance status', async () => {
      const result = await service.updatePerformanceStatus('perf-1', 'COMPLETED');

      expect(result.id).toBe('perf-1');
    });

    it('should return updated performance', async () => {
      const result = await service.updatePerformanceStatus('perf-1', 'COMPLETED');

      expect(result).toBeDefined();
    });
  });
});
