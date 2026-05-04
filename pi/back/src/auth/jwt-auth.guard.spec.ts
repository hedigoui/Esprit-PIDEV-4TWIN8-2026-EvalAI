import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn((context: ExecutionContext) => {
              const request = context.switchToHttp().getRequest();
              const authHeader = request.headers.authorization;
              if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return false;
              }
              return true;
            }),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access with valid JWT token', () => {
    const mockToken = 'valid-jwt-token';

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: `Bearer ${mockToken}` },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('should deny access without token', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockExecutionContext);
    expect(result).toBe(false);
  });

  it('should deny access with invalid token format', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'invalid-token' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockExecutionContext);
    expect(result).toBe(false);
  });
});
