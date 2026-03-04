import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma.service';
import { AuthAliasController } from './auth-alias.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [UsersController, AuthAliasController],
  providers: [UsersService, JwtStrategy, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
