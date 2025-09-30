import { ExecutionContext, HttpException } from '@nestjs/common';
import { of } from 'rxjs';
import { CurrentUser } from '../src/common/decorators/current-user.decorator';
import { Roles } from '../src/common/decorators/roles.decorator';
import { Public } from '../src/common/decorators/public.decorator';
import { AuthGuard } from '../src/common/guards/auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { createAdmin } from '../src/seeds/create-admin';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/common/enums/user-role.enum';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Misc coverage full', () => {

  // 🔹 CurrentUser decorator
  it('CurrentUser should return user from request', () => {
    const mockUser = { id: '1', email: 'test@test.com' };
    const ctx: any = {
      switchToHttp: () => ({ getRequest: () => ({ user: mockUser }) })
    } as ExecutionContext;

    const result = CurrentUser()(null, null, ctx);
    expect(result).toEqual(mockUser);
  });

  // 🔹 Roles decorator
  it('Roles should set metadata', () => {
    class Test {}
    Roles(UserRole.ADMIN)(
      Test.prototype,
      'method',
      {} as TypedPropertyDescriptor<any>
    );
    const roles = Reflect.getMetadata('roles', Test.prototype, 'method');
    expect(roles).toEqual([UserRole.ADMIN]);
  });

  // 🔹 Public decorator
  it('Public decorator should set metadata', () => {
    class Test {}
    Public()(Test.prototype, 'method', {} as TypedPropertyDescriptor<any>);
    const isPublic = Reflect.getMetadata('isPublic', Test.prototype, 'method');
    expect(isPublic).toBe(true);
  });

  // 🔹 AuthGuard
  it('AuthGuard should allow user', () => {
    const jwtService: any = { verify: jest.fn().mockReturnValue({ userId: '1' }) };
    const reflector = new Reflector();
    const mockConfigService: any = {}; // dummy config if constructor needs it
    const guard = new AuthGuard(jwtService as JwtService, reflector, mockConfigService);
    const ctx: any = { switchToHttp: () => ({ getRequest: () => ({ user: { id: '1' } }) }) } as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('AuthGuard should throw if no user', () => {
    const jwtService: any = { verify: jest.fn() };
    const reflector = new Reflector();
    const mockConfigService: any = {};
    const guard = new AuthGuard(jwtService as JwtService, reflector, mockConfigService);
    const ctx: any = { switchToHttp: () => ({ getRequest: () => ({}) }) } as ExecutionContext;
    expect(() => guard.canActivate(ctx)).toThrow();
  });

  // 🔹 RolesGuard
  it('RolesGuard should allow when role matches', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'get').mockReturnValue([UserRole.ADMIN]);
    const guard = new RolesGuard(reflector);
    const ctx: any = { switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.ADMIN } }) }) } as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('RolesGuard should deny when role does not match', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'get').mockReturnValue([UserRole.ADMIN]);
    const guard = new RolesGuard(reflector);
    const ctx: any = { switchToHttp: () => ({ getRequest: () => ({ user: { role: UserRole.GUEST } }) }) } as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(false);
  });

  // 🔹 TransformInterceptor
  it('TransformInterceptor should map data', (done) => {
    const interceptor = new TransformInterceptor();
    const ctx: any = {} as ExecutionContext;
    const next: any = { handle: () => of({ data: 'test' }) };
    interceptor.intercept(ctx, next).subscribe(res => {
      expect(res).toEqual({ data: 'test' });
      done();
    });
  });

  // 🔹 LoggingInterceptor
  it('LoggingInterceptor should call next.handle', (done) => {
    const interceptor = new LoggingInterceptor();
    const ctx: any = {} as ExecutionContext;
    const next: any = { handle: () => of('ok') };
    interceptor.intercept(ctx, next).subscribe(res => {
      expect(res).toBe('ok');
      done();
    });
  });

  // 🔹 Exception Filters
  it('GlobalExceptionFilter should catch exception', () => {
    const filter = new GlobalExceptionFilter();
    const mockHost: any = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        })
      })
    };
    expect(() => filter.catch(new Error('test'), mockHost)).not.toThrow();
  });

  it('HttpExceptionFilter should catch HttpException', () => {
    const filter = new HttpExceptionFilter();
    const mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const mockHost: any = { switchToHttp: () => ({ getResponse: () => mockResponse }) };
    const ex = new HttpException('error', 400);
    filter.catch(ex, mockHost);
    expect(mockResponse.status).toHaveBeenCalled();
  });

  // 🔹 createAdmin seed
  it('createAdmin should create admin user', async () => {
    const mockRepo: any = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue({ email: 'admin@example.com' }),
      save: jest.fn(),
    };
    const mockDataSource = { getRepository: () => mockRepo } as unknown as DataSource;
    await createAdmin(mockDataSource);
    expect(mockRepo.findOne).toHaveBeenCalled();
    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalled();
  });

});
