import { Module, Global, Logger } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisCacheService } from './redis-cache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): any => {
        const redisHost = configService.get<string>('REDIS_HOST');
        // 若未配置 REDIS_HOST 或为空，使用内存缓存
        if (!redisHost) {
          new Logger('RedisModule').warn(
            'REDIS_HOST not configured, falling back to in-memory cache',
          );
          return {
            ttl: configService.get<number>('CACHE_TTL', 300) * 1000,
          };
        }
        return {
          store: 'redis' as const,
          host: redisHost,
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          ttl: configService.get<number>('CACHE_TTL', 300) * 1000,
        };
      },
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService, CacheModule],
})
export class RedisModule {}
