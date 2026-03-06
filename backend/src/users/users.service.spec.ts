/**
 * UsersService 单元测试
 *
 * 覆盖：注册、登录、token 分离、refreshAuth
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

const JWT_SECRET = 'test-secret';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let jwtService: JwtService;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: new JwtService({ secret: JWT_SECRET, signOptions: { expiresIn: '2h' } }),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  // ==================== register ====================

  describe('register', () => {
    it('应返回不同的 accessToken 和 refreshToken', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'a',
        role: 'USER',
        avatar: null,
        createdAt: new Date(),
      });

      const result = await service.register({ email: 'a@b.com', password: '123456' });
      expect(result!.accessToken).toBeDefined();
      expect(result!.refreshToken).toBeDefined();
      expect(result!.accessToken).not.toEqual(result!.refreshToken);
    });
  });

  // ==================== login ====================

  describe('login', () => {
    it('应返回分离的 access / refresh token', async () => {
      const hashed = await bcrypt.hash('pass123', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'a',
        password: hashed,
        role: 'USER',
        avatar: null,
      });

      const result = await service.login({ email: 'a@b.com', password: 'pass123' });
      expect(result!.accessToken).not.toEqual(result!.refreshToken);

      // accessToken 的 payload 应该有 type='access'
      const accessPayload: any = jwtService.verify(result!.accessToken);
      expect(accessPayload.type).toBe('access');

      // refreshToken 的 payload 应该有 type='refresh'
      const refreshPayload: any = jwtService.verify(result!.refreshToken);
      expect(refreshPayload.type).toBe('refresh');
    });
  });

  // ==================== refreshAuth ====================

  describe('refreshAuth', () => {
    it('有效 refreshToken 应返回新的 token 对', async () => {
      // 先生成一个 refresh token
      const refreshToken = jwtService.sign(
        { sub: 'u1', username: 'a@b.com', type: 'refresh' },
        { expiresIn: '7d' },
      );

      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'a',
        role: 'USER',
        avatar: null,
        createdAt: new Date(),
      });

      const result = await service.refreshAuth(refreshToken);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.accessToken).not.toEqual(refreshToken);
    });

    it('使用 accessToken 来刷新应被拒绝', async () => {
      const accessToken = jwtService.sign(
        { sub: 'u1', username: 'a@b.com', type: 'access' },
        { expiresIn: '2h' },
      );

      await expect(service.refreshAuth(accessToken)).rejects.toThrow(UnauthorizedException);
    });

    it('过期 token 应被拒绝', async () => {
      const expired = jwtService.sign(
        { sub: 'u1', username: 'a@b.com', type: 'refresh' },
        { expiresIn: '0s' },
      );

      // 等一下确保过期
      await new Promise((r) => setTimeout(r, 50));
      await expect(service.refreshAuth(expired)).rejects.toThrow(UnauthorizedException);
    });

    it('不存在的用户应被拒绝', async () => {
      const refreshToken = jwtService.sign(
        { sub: 'u-gone', username: 'gone@test.com', type: 'refresh' },
        { expiresIn: '7d' },
      );
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshAuth(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });
});
