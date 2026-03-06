/**
 * SceneService 单元测试
 *
 * 覆盖 L1 执行层场景的 CRUD、重排序、自动拆分
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SceneService } from './scene.service';
import { PrismaService } from '../prisma.service';

const mockPrisma = {
  scene: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('SceneService', () => {
  let service: SceneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SceneService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SceneService>(SceneService);
    jest.clearAllMocks();
  });

  // ==================== CRUD ====================

  describe('CRUD', () => {
    it('should get scenes for a chapter ordered by position', async () => {
      const scenes = [
        { id: 's1', title: '场景1', order: 1 },
        { id: 's2', title: '场景2', order: 2 },
      ];
      mockPrisma.scene.findMany.mockResolvedValue(scenes);

      const result = await service.getScenes('ch1');
      expect(result).toHaveLength(2);
      expect(mockPrisma.scene.findMany).toHaveBeenCalledWith({
        where: { chapterId: 'ch1' },
        orderBy: { order: 'asc' },
      });
    });

    it('should get a single scene', async () => {
      mockPrisma.scene.findUnique.mockResolvedValue({
        id: 's1',
        title: '酒馆相遇',
        location: '酒馆',
        timeOfDay: '夜晚',
      });

      const result = await service.getScene('s1');
      expect(result.location).toBe('酒馆');
    });

    it('should throw for non-existent scene', async () => {
      mockPrisma.scene.findUnique.mockResolvedValue(null);

      await expect(service.getScene('nonexistent')).rejects.toThrow('场景不存在');
    });

    it('should create scene with auto order', async () => {
      mockPrisma.scene.findFirst.mockResolvedValue({ order: 3 });
      mockPrisma.scene.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 's1', ...data }),
      );

      const result = await service.createScene('ch1', {
        content: '林渊推开酒馆的门',
        location: '酒馆',
        timeOfDay: '夜晚',
      });
      expect(result.order).toBe(4);
      expect(result.location).toBe('酒馆');
    });

    it('should create first scene with order 1', async () => {
      mockPrisma.scene.findFirst.mockResolvedValue(null);
      mockPrisma.scene.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 's1', ...data }),
      );

      const result = await service.createScene('ch1', {
        content: '开场',
      });
      expect(result.order).toBe(1);
    });

    it('should update a scene', async () => {
      mockPrisma.scene.update.mockResolvedValue({
        id: 's1',
        title: '新标题',
        content: '新内容',
      });

      const result = await service.updateScene('s1', { title: '新标题' });
      expect(result.title).toBe('新标题');
    });

    it('should delete a scene', async () => {
      mockPrisma.scene.delete.mockResolvedValue({ id: 's1' });
      await service.deleteScene('s1');
      expect(mockPrisma.scene.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    });
  });

  // ==================== Reorder ====================

  describe('Reorder', () => {
    it('should reorder scenes', async () => {
      mockPrisma.$transaction.mockResolvedValue([]);
      mockPrisma.scene.findMany.mockResolvedValue([
        { id: 's2', order: 1 },
        { id: 's1', order: 2 },
      ]);

      const result = await service.reorderScenes('ch1', ['s2', 's1']);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  // ==================== Auto Split ====================

  describe('AutoSplit', () => {
    it('should split content by separator marks', async () => {
      mockPrisma.scene.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.scene.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: `s${data.order}`, ...data }),
      );

      const content = '场景一的内容\n\n***\n\n场景二的内容\n\n***\n\n场景三的内容';
      const result = await service.autoSplitScenes('ch1', content);
      expect(result).toHaveLength(3);
    });

    it('should split by paragraphs if no separators', async () => {
      mockPrisma.scene.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.scene.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: `s${data.order}`, ...data }),
      );

      const content = '段落一\n\n段落二\n\n段落三\n\n段落四\n\n段落五\n\n段落六';
      const result = await service.autoSplitScenes('ch1', content);
      expect(result.length).toBeGreaterThanOrEqual(2); // 每3段一个场景
    });
  });
});
