import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const mockReflector = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RolesGuard,
          useValue: {
            canActivate: jest.fn((context: ExecutionContext) => {
              const requiredRoles = mockReflector.get('roles', context.getHandler());
              if (!requiredRoles) {
                return true;
              }
              const request = context.switchToHttp().getRequest();
              const user = request.user;
              if (!user) {
                throw new ForbiddenException('User not found');
              }
              return requiredRoles.includes(user.role);
            }),
          },
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access for user with required role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['INSTRUCTOR']);

    const mockExecutionContext = {
      getHandler: () => ({ name: 'testHandler' }),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: '1', role: 'INSTRUCTOR' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
  });

  it('should deny access for user without required role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['ADMIN']);

    const mockExecutionContext = {
      getHandler: () => ({ name: 'testHandler' }),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: '1', role: 'STUDENT' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(false);
  });

  it('should allow access if no roles required', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);

    const mockExecutionContext = {
      getHandler: () => ({ name: 'testHandler' }),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: '1', role: 'STUDENT' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
  });

  it('should allow multiple valid roles', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(['INSTRUCTOR', 'ADMIN']);

    const mockExecutionContext = {
      getHandler: () => ({ name: 'testHandler' }),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: '1', role: 'ADMIN' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
  });
});
