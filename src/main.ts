import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  
  // Use Winston logger
  app.useLogger(logger);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    validateCustomDecorators: true,
  }));
  
  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // API prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);
  
  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Flocci Invoices API')
    .setDescription('Multi-tenant GST compliant invoicing microservice for the Flocci ecosystem')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Organizations', 'Organization management')
    .addTag('Business Partners', 'Customer and vendor management')
    .addTag('Products & Services', 'Product and service catalog')
    .addTag('Invoices', 'Invoice management and operations')
    .addTag('Payments', 'Payment recording and tracking')
    .addTag('Compliance', 'GST and E-Way Bill compliance')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  
  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
  logger.log(`Swagger documentation available at: http://localhost:${port}/${apiPrefix}/docs`, 'Bootstrap');
}

bootstrap();
