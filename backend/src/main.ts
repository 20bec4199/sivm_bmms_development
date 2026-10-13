import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { EnterpriseExceptionFilter } from './common/filters/enterprise-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie parsing (needed for HttpOnly cookie auth)
  app.use(cookieParser());

  // Global enterprise exception filter for consistent error payloads
  app.useGlobalFilters(new EnterpriseExceptionFilter());

  // Global validation — strips unknown fields and transforms types
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: 400,
    }),
  );

  // Global serializer — honours @Exclude() / @Expose() on entity classes
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableCors({

    origin: process.env.FRONTEND_URL?.split(',') ?? [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8081',
      'https://sivm-bmms-development.vercel.app',
    ],
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('SIVM API')
    .setDescription('Building Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('refresh_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
