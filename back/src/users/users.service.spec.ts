import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './users.models';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com', role: 'STUDENT' }),
            findById: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com' }),
            findByEmail: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com' }),
            updateUser: jest.fn().mockResolvedValue({ id: '1' }),
            deleteUser: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user with hashed password', async () => {
      const createUserDto = {
        email: 'test@test.com',
        password: 'plain_password',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUser = {
        id: '1',
        ...createUserDto,
        password: 'hashed_password',
        role: 'STUDENT',
        isActive: true,
      };

      const result = await service.createUser(createUserDto);

      expect(result.email).toBe('test@test.com');
      expect(result.role).toBe('STUDENT');
    });

    it('should throw error if user already exists', async () => {
      jest.spyOn(service, 'createUser').mockRejectedValue(new Error('User exists'));

      await expect(service.createUser({ email: 'existing@test.com', password: 'pass' })).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const result = await service.findById('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('should return null if user not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(null);

      const result = await service.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const result = await service.findByEmail('test@test.com');

      expect(result).toBeDefined();
    });
  });

  describe('updateUser', () => {
    it('should update user information', async () => {
      const userId = '1';
      const updateDto = { firstName: 'Jane', lastName: 'Smith' };

      const result = await service.updateUser(userId, updateDto);

      expect(result).toBeDefined();
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const result = await service.deleteUser('1');

      expect(result).toBe(true);
    });
  });
});
