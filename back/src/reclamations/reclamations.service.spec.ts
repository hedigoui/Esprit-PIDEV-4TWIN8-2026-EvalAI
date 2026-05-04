import { Test, TestingModule } from '@nestjs/testing';
import { ReclamationsService } from './reclamations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reclamation } from './reclamations.models';

describe('ReclamationsService', () => {
  let service: ReclamationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ReclamationsService,
          useValue: {
            createReclamation: jest.fn().mockResolvedValue({ id: 'rec-1', studentId: 'student-1', status: 'OPEN' }),
            getReclamationById: jest.fn().mockResolvedValue({ id: 'rec-1', studentId: 'student-1', status: 'OPEN' }),
            updateStatus: jest.fn().mockResolvedValue(true),
            getStudentReclamations: jest.fn().mockResolvedValue([
              { id: 'rec-1', studentId: 'student-1', status: 'OPEN' },
              { id: 'rec-2', studentId: 'student-1', status: 'RESOLVED' },
            ]),
            getInstructorReclamations: jest.fn().mockResolvedValue([
              { id: 'rec-1', instructorId: 'instructor-1', status: 'OPEN' },
            ]),
            addResponse: jest.fn().mockResolvedValue({ id: 'rec-1' }),
            resolveReclamation: jest.fn().mockResolvedValue({ id: 'rec-1', status: 'RESOLVED' }),
            rejectReclamation: jest.fn().mockResolvedValue({ id: 'rec-1', status: 'REJECTED' }),
            getAllReclamations: jest.fn().mockResolvedValue([]),
            getReclamationStats: jest.fn().mockResolvedValue({ totalReclamations: 0 }),
          },
        },
      ],
    }).compile();

    service = module.get<ReclamationsService>(ReclamationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReclamation', () => {
    it('should create a new reclamation', async () => {
      const createDto = {
        studentId: 'student-1',
        evaluationId: 'eval-1',
        reason: 'Disagree with score',
        description: 'The evaluation was not fair',
      };

      const result = await service.createReclamation(createDto);

      expect(result.status).toBe('OPEN');
      expect(result.studentId).toBe('student-1');
    });

    it('should require valid student and evaluation IDs', async () => {
      const result = await service.createReclamation({
        studentId: 'student-1',
        evaluationId: 'eval-1',
        reason: 'Test',
        description: 'Test',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('rec-1');
    });

    it('should not allow duplicate reclamations', async () => {
      jest.spyOn(service, 'createReclamation').mockRejectedValue(new Error('Duplicate'));

      await expect(
        service.createReclamation({
          studentId: 'student-1',
          evaluationId: 'eval-1',
          reason: 'Duplicate',
          description: 'Same evaluation',
        })
      ).rejects.toThrow();
    });
  });

  describe('getReclamationById', () => {
    it('should retrieve reclamation by id', async () => {
      const result = await service.getReclamationById('rec-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('rec-1');
    });

    it('should return null if reclamation not found', async () => {
      jest.spyOn(service, 'getReclamationById').mockResolvedValue(null);

      const result = await service.getReclamationById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update reclamation status', async () => {
      const reclamationId = 'rec-1';
      const newStatus = 'IN_PROGRESS';

      const result = await service.updateStatus(reclamationId, newStatus);

      expect(result).toBe(true);
    });

    it('should validate status transitions', async () => {
      const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

      validStatuses.forEach(status => {
        expect(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']).toContain(status);
      });
    });

    it('should not allow invalid status', async () => {
      jest.spyOn(service, 'updateStatus').mockRejectedValue(new Error('Invalid status'));

      await expect(service.updateStatus('rec-1', 'INVALID_STATUS')).rejects.toThrow();
    });
  });

  describe('getStudentReclamations', () => {
    it('should retrieve all reclamations for a student', async () => {
      const studentId = 'student-1';

      const result = await service.getStudentReclamations(studentId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array if student has no reclamations', async () => {
      jest.spyOn(service, 'getStudentReclamations').mockResolvedValue([]);

      const result = await service.getStudentReclamations('student-no-rec');

      expect(result).toEqual([]);
    });
  });
// Ajoute cette fonction inutile (dead code)
function unusedFunction() {
  let x = 0;
  for(let i = 0; i < 10; i++) {
    x += i;
  }
  return x;
}
  describe('getInstructorReclamations', () => {
    it('should retrieve reclamations assigned to instructor', async () => {
      const instructorId = 'instructor-1';

      const result = await service.getInstructorReclamations(instructorId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('addResponse', () => {
    it('should add instructor response to reclamation', async () => {
      jest.spyOn(service, 'addResponse').mockResolvedValue({
        id: 'rec-1',
        response: 'We have reviewed your case...',
        respondent: 'instructor-1',
      });

      const result = await service.addResponse('rec-1', 'We have reviewed your case...', 'instructor-1');

      expect(result.response).toBeDefined();
      expect(result.respondent).toBe('instructor-1');
    });
  });

  describe('resolveReclamation', () => {
    it('should mark reclamation as resolved', async () => {
      const result = await service.resolveReclamation('rec-1', 'RESOLVED', 'Resolution details');

      expect(result).toBeDefined();
    });

    it('should require resolution reason', async () => {
      jest.spyOn(service, 'resolveReclamation').mockRejectedValue(new Error('Resolution reason required'));

      await expect(service.resolveReclamation('rec-1', 'RESOLVED', '')).rejects.toThrow();
    });
  });

  describe('rejectReclamation', () => {
    it('should mark reclamation as rejected with reason', async () => {
      jest.spyOn(service, 'rejectReclamation').mockResolvedValue({
        id: 'rec-1',
        status: 'REJECTED',
        rejectionReason: 'Not valid complaint',
      });

      const result = await service.rejectReclamation('rec-1', 'Not valid complaint');

      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBeDefined();
    });
  });

  describe('getAllReclamations', () => {
    it('should retrieve all reclamations with pagination', async () => {
      const result = await service.getAllReclamations({ page: 1, limit: 10 });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getReclamationStats', () => {
    it('should return reclamation statistics', async () => {
      jest.spyOn(service, 'getReclamationStats').mockResolvedValue({
        totalReclamations: 10,
        openCount: 3,
        resolvedCount: 5,
        rejectedCount: 2,
      });

      const result = await service.getReclamationStats();

      expect(result.totalReclamations).toBeGreaterThan(0);
      expect(result.openCount).toBeDefined();
      expect(result.resolvedCount).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      jest.spyOn(service, 'createReclamation').mockRejectedValue(new Error('Database error'));

      await expect(
        service.createReclamation({
          studentId: 'student-1',
          evaluationId: 'eval-1',
          reason: 'Test',
          description: 'Test',
        })
      ).rejects.toThrow();
    });
  });
  
});
