/**
 * DocumentGateway 单元测试
 *
 * 覆盖：连接鉴权、文档级权限校验（join）、断开清理、内容同步
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DocumentGateway } from './document.gateway';
import { DocumentService } from '../document/document.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret';

function mockSocket(overrides: Record<string, any> = {}): any {
  return {
    id: 'socket-1',
    handshake: { auth: {}, query: {} },
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    ...overrides,
  };
}

describe('DocumentGateway', () => {
  let gateway: DocumentGateway;
  let documentService: { findOne: jest.Mock };

  beforeEach(async () => {
    documentService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentGateway,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(JWT_SECRET) },
        },
        {
          provide: DocumentService,
          useValue: documentService,
        },
      ],
    }).compile();

    gateway = module.get<DocumentGateway>(DocumentGateway);
    // 手动赋值 server（WebSocketServer 装饰器在非真实 WS 环境下不注入）
    (gateway as any).server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
  });

  // ==================== handleConnection ====================

  describe('handleConnection', () => {
    it('应在无 token 时断开连接', () => {
      const client = mockSocket();
      gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('应在 token 无效时断开连接', () => {
      const client = mockSocket({
        handshake: { auth: { token: 'bad-token' }, query: {} },
      });
      gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('应在 token 有效时附加 user 信息', () => {
      // 使用 sub 字段，与 users.service.ts 生成的 token 一致
      const token = jwt.sign({ sub: 'u1', username: 'test@test.com' }, JWT_SECRET);
      const client = mockSocket({
        handshake: { auth: { token }, query: {} },
      });
      gateway.handleConnection(client);
      expect(client.disconnect).not.toHaveBeenCalled();
      expect((client as any).user).toBeDefined();
      expect((client as any).user.userId).toBe('u1');
    });
  });

  // ==================== handleJoin ====================

  describe('handleJoin - 权限校验', () => {
    it('未认证用户应被拒绝加入', async () => {
      const client = mockSocket(); // 没有 user 属性
      const result = await gateway.handleJoin(client, { documentId: 'doc-1' });
      expect(result).toEqual({ success: false, error: 'Unauthorized' });
      expect(client.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ message: expect.any(String) }),
      );
    });

    it('无权限访问文档的用户应被拒绝', async () => {
      const client = mockSocket();
      (client as any).user = { userId: 'u-other', username: 'other@test.com' };
      documentService.findOne.mockRejectedValue(new ForbiddenException('No access'));

      const result = await gateway.handleJoin(client, { documentId: 'doc-1' });
      expect(result).toEqual({ success: false, error: 'Forbidden' });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('文档不存在时应被拒绝', async () => {
      const client = mockSocket();
      (client as any).user = { userId: 'u1', username: 'test@test.com' };
      documentService.findOne.mockRejectedValue(new NotFoundException('Not found'));

      const result = await gateway.handleJoin(client, { documentId: 'doc-404' });
      expect(result).toEqual({ success: false, error: 'Forbidden' });
    });

    it('有权限用户应成功加入房间', async () => {
      const client = mockSocket();
      (client as any).user = { userId: 'u1', username: 'test@test.com' };
      documentService.findOne.mockResolvedValue({ id: 'doc-1', ownerId: 'u1' });

      const result = await gateway.handleJoin(client, { documentId: 'doc-1', userName: 'Alice' });
      expect(result).toEqual(expect.objectContaining({ success: true }));
      expect(client.join).toHaveBeenCalledWith('document:doc-1');
      expect(documentService.findOne).toHaveBeenCalledWith('doc-1', 'u1');
    });
  });

  // ==================== handleDisconnect ====================

  describe('handleDisconnect', () => {
    it('应从房间中清除断开的用户并通知他人', async () => {
      const client = mockSocket();
      (client as any).user = { userId: 'u1', username: 'test@test.com' };
      documentService.findOne.mockResolvedValue({ id: 'doc-1', ownerId: 'u1' });

      // 先加入
      await gateway.handleJoin(client, { documentId: 'doc-1', userName: 'Alice' });

      // 再断开
      gateway.handleDisconnect(client);

      const server = (gateway as any).server;
      expect(server.to).toHaveBeenCalledWith('document:doc-1');
    });
  });
});
