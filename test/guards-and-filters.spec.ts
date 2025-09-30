// test/guards-and-filters.spec.ts
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '../src/common/guards/auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { User } from '../src/modules/users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

describe('Guards & Filters', () => {
  let authGuard: AuthGuard;
  let rolesGuard: RolesGuard;
  let globalFilter: GlobalExceptionFilter;
  let httpFilter: HttpExceptionFilter;

  beforeAll(() => {
    const jwtServiceMock = {} as JwtService;
    const reflectorMock = { get: jest.fn() } as unknown as Reflector;
    const configServiceMock = {} as ConfigService;

    authGuard = new AuthGuard(jwtServiceMock, reflectorMock, configServiceMock);
    rolesGuard = new RolesGuard(reflectorMock);
    globalFilter = new GlobalExceptionFilter();
    httpFilter = new HttpExceptionFilter();
  });

  it('AuthGuard should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  it('RolesGuard should be defined', () => {
    expect(rolesGuard).toBeDefined();
  });

  it('GlobalExceptionFilter should be defined', () => {
    expect(globalFilter).toBeDefined();
  });

  it('HttpExceptionFilter should be defined', () => {
    expect(httpFilter).toBeDefined();
  });

  it('AuthGuard can call canActivate', async () => {
    const context = {} as ExecutionContext;
    const result = await authGuard.canActivate(context);
    expect(result).toBeDefined();
  });

  it('RolesGuard can call canActivate', async () => {
    const context = {} as ExecutionContext;
    const result = await rolesGuard.canActivate(context);
    expect(result).toBeDefined();
  });
});

describe('Entities', () => {
  it('should create a User entity', () => {
    const user = new User();
    user.email = 'test@test.com';
    user.password = 'securepassword';
    expect(user.email).toBe('test@test.com');
    expect(user.password).toBe('securepassword');
  });
});
