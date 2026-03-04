import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression = require('compression');
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/success.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // ==================== 安全 ====================
  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
  }));
  app.use(compression());

  // ==================== Body Parser 限制 ====================
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // ==================== 全局管道/过滤器/拦截器 ====================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // ==================== CORS ====================
  const corsOrigins =
    configService.get<string>('CORS_ORIGIN')?.split(',') || [
      'http://localhost:5173',
      'http://localhost:5174',
    ];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ==================== Swagger ====================
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AI+ 智能写作平台')
      .setDescription(
        '基于三层架构（大纲层 L3 → 角色层 L2 → 执行层 L1）的 AI 辅助网文写作系统 API',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('ai', 'AI 写作代理 - 核心 Agent / 续写 / 一致性检查')
      .addTag('books', '书籍管理')
      .addTag('chapters', '章节管理')
      .addTag('documents', '文档协作')
      .addTag('auth', '用户认证')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
    logger.log('Swagger docs available at /api/docs');
  }

  // ==================== 优雅关闭 ====================
  app.enableShutdownHooks();

  // ==================== 启动 ====================
  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  logger.log(`AI+ Backend running on http://localhost:${port}`);
  logger.log(`Environment: ${isProduction ? 'production' : 'development'}`);
}

bootstrap();
