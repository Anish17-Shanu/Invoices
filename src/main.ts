import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

function createRateLimiter(options: { windowMs: number; max: number; message: string }) {
  const store = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.toString().split(',')[0]?.trim() || req.ip || 'unknown';
    const key = `${clientIp}:${req.path}`;
    const now = Date.now();
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      const resetAt = now + options.windowMs;
      store.set(key, { count: 1, resetAt });
      res.setHeader('X-RateLimit-Limit', options.max.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(options.max - 1, 0).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
      return next();
    }

    if (current.count >= options.max) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000).toString());
      res.status(429).json({
        success: false,
        message: options.message,
      });
      return;
    }

    current.count += 1;
    store.set(key, current);
    res.setHeader('X-RateLimit-Limit', options.max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(options.max - current.count, 0).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(current.resetAt / 1000).toString());
    next();
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  const reflector = app.get(Reflector);

  app.useLogger(logger);
  app.enableShutdownHooks();
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validateCustomDecorators: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  const authRateLimitWindowMs = configService.get<number>('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
  const authRateLimitMax = configService.get<number>('AUTH_RATE_LIMIT_MAX', 20);
  app.use(
    `/${apiPrefix}/auth`,
    createRateLimiter({
      windowMs: authRateLimitWindowMs,
      max: authRateLimitMax,
      message: 'Too many authentication requests. Please try again later.',
    }),
  );

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });

  const authGuard = app.get(AuthGuard);
  const rolesGuard = new RolesGuard(reflector);
  app.useGlobalGuards(authGuard, rolesGuard);

  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get('SWAGGER_TITLE', 'Invoices Service API'))
    .setDescription(
      configService.get(
        'SWAGGER_DESC',
        'Standalone GST-compliant invoicing microservice with JWT auth and public integration endpoints.',
      ),
    )
    .setVersion(configService.get('SWAGGER_VERSION', '1.0'))
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addTag('Organizations', 'Organization management')
    .addTag('Business Partners', 'Customer and vendor management')
    .addTag('Invoices', 'Invoice management and operations')
    .addTag('Payments', 'Payment recording and tracking')
    .addTag('Compliance', 'GST and E-Way Bill compliance')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`Application running on: http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
  logger.log(`Swagger docs available at: http://localhost:${port}/${apiPrefix}/docs`, 'Bootstrap');
}

bootstrap();
