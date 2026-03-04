import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from './common/redis/redis.module';
import { DocumentGateway } from './gateway/document.gateway';
import { AiModule } from './ai/ai.module';
import { AssistantModule } from './assistant/assistant.module';
import { AuthModule } from './auth/auth.module';
import { BookModule } from './book/book.module';
import { ChapterModule } from './chapter/chapter.module';
import { DocumentModule } from './document/document.module';
import { StatsModule } from './stats/stats.module';
import { UsersModule } from './users/users.module';
import { VolumeModule } from './volume/volume.module';
import { UploadModule } from './upload/upload.module';
import { AgentModule } from './agent/agent.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    // 全局限流：默认 60 次/分钟, AI 接口另设
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 60),
          },
          {
            name: 'ai',
            ttl: 60000,
            limit: config.get<number>('AI_THROTTLE_LIMIT', 15),
          },
        ],
      }),
    }),
    RedisModule,
    DocumentModule,
    AiModule,
    AuthModule,
    UsersModule,
    BookModule,
    ChapterModule,
    VolumeModule,
    AssistantModule,
    StatsModule,
    UploadModule,
    AgentModule,
  ],
  providers: [
    DocumentGateway,
    // 全局限流 Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
