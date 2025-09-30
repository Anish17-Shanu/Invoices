// src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  const reflector = app.get(Reflector);

  // Use Winston logger
  app.useLogger(logger);

  // Enable shutdown hooks
  app.enableShutdownHooks();

  // Security middleware
  app.use(helmet());

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validateCustomDecorators: true,
    }),
  );

  // Exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // API prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });

  // 🔹 Correct DI for global guards
  const authGuard = app.get(AuthGuard); // inject AuthGuard properly
  const rolesGuard = new RolesGuard(reflector); // RolesGuard needs Reflector

  app.useGlobalGuards(authGuard, rolesGuard);

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get('SWAGGER_TITLE', 'Flocci Invoices API'))
    .setDescription(
      configService.get(
        'SWAGGER_DESC',
        'Multi-tenant GST compliant invoicing microservice for the Flocci ecosystem',
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

  // Start server
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`Application running on: http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
  logger.log(`Swagger docs available at: http://localhost:${port}/${apiPrefix}/docs`, 'Bootstrap');
}

bootstrap();
