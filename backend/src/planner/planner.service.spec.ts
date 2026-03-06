/**
 * PlannerService 单元测试
 *
 * 覆盖世界观、剧情线、时间线、伏笔的 CRUD 操作
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PlannerService } from './planner.service';
import { PrismaService } from '../prisma.service';

// Mock PrismaService
const mockPrisma = {
  worldSetting: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  plotLine: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  timelineEvent: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  foreshadowing: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('PlannerService', () => {
  let service: PlannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlannerService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<PlannerService>(PlannerService);
    jest.clearAllMocks();
  });

  // ==================== World Settings ====================

  describe('WorldSettings', () => {
    it('should get world settings for a book', async () => {
      const mockSettings = [
        { id: '1', bookId: 'book1', genre: '修仙', theme: '成长', tone: '轻松' },
      ];
      mockPrisma.worldSetting.findMany.mockResolvedValue(mockSettings);

      const result = await service.getWorldSettings('book1');
      expect(result).toEqual(mockSettings);
      expect(mockPrisma.worldSetting.findMany).toHaveBeenCalledWith({
        where: { bookId: 'book1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should create a world setting', async () => {
      const input = { genre: '科幻', theme: '末日', tone: '严肃' };
      const mockCreated = { id: 'ws1', bookId: 'book1', ...input };
      mockPrisma.worldSetting.create.mockResolvedValue(mockCreated);

      const result = await service.createWorldSetting('book1', input);
      expect(result.genre).toBe('科幻');
      expect(mockPrisma.worldSetting.create).toHaveBeenCalledWith({
        data: { bookId: 'book1', ...input },
      });
    });

    it('should update a world setting', async () => {
      const mockUpdated = { id: 'ws1', genre: '玄幻' };
      mockPrisma.worldSetting.update.mockResolvedValue(mockUpdated);

      const result = await service.updateWorldSetting('ws1', { genre: '玄幻' });
      expect(result.genre).toBe('玄幻');
    });

    it('should delete a world setting', async () => {
      mockPrisma.worldSetting.delete.mockResolvedValue({ id: 'ws1' });
      await service.deleteWorldSetting('ws1');
      expect(mockPrisma.worldSetting.delete).toHaveBeenCalledWith({ where: { id: 'ws1' } });
    });
  });

  // ==================== Plot Lines ====================

  describe('PlotLines', () => {
    it('should get plot lines sorted by order', async () => {
      const mockPlots = [
        { id: '1', title: '主线', order: 1 },
        { id: '2', title: '副线', order: 2 },
      ];
      mockPrisma.plotLine.findMany.mockResolvedValue(mockPlots);

      const result = await service.getPlotLines('book1');
      expect(result).toHaveLength(2);
      expect(mockPrisma.plotLine.findMany).toHaveBeenCalledWith({
        where: { bookId: 'book1' },
        orderBy: { order: 'asc' },
      });
    });

    it('should create a plot line with auto-incremented order', async () => {
      mockPrisma.plotLine.findFirst.mockResolvedValue({ order: 3 });
      mockPrisma.plotLine.create.mockResolvedValue({
        id: 'pl1',
        bookId: 'book1',
        title: '角色线',
        order: 4,
      });

      const result = await service.createPlotLine('book1', {
        title: '角色线',
        type: 'CHARACTER',
      });
      expect(result.order).toBe(4);
    });

    it('should create first plot line with order 1', async () => {
      mockPrisma.plotLine.findFirst.mockResolvedValue(null);
      mockPrisma.plotLine.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'pl1', ...data }),
      );

      const result = await service.createPlotLine('book1', { title: '主线' });
      expect(result.order).toBe(1);
    });

    it('should update a plot line', async () => {
      mockPrisma.plotLine.update.mockResolvedValue({ id: 'pl1', title: '新标题' });
      const result = await service.updatePlotLine('pl1', { title: '新标题' });
      expect(result.title).toBe('新标题');
    });
  });

  // ==================== Timeline Events ====================

  describe('TimelineEvents', () => {
    it('should get timeline events ordered', async () => {
      mockPrisma.timelineEvent.findMany.mockResolvedValue([{ id: '1', title: '事件A', order: 1 }]);

      const result = await service.getTimelineEvents('book1');
      expect(result).toHaveLength(1);
    });

    it('should filter timeline events by chapterId', async () => {
      mockPrisma.timelineEvent.findMany.mockResolvedValue([]);

      await service.getTimelineEvents('book1', 'ch1');
      expect(mockPrisma.timelineEvent.findMany).toHaveBeenCalledWith({
        where: { bookId: 'book1', chapterId: 'ch1' },
        orderBy: { order: 'asc' },
      });
    });

    it('should create a timeline event', async () => {
      mockPrisma.timelineEvent.findFirst.mockResolvedValue(null);
      mockPrisma.timelineEvent.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'te1', ...data }),
      );

      const result = await service.createTimelineEvent('book1', { title: '大战' }, 'ch1');
      expect(result.title).toBe('大战');
      expect(result.chapterId).toBe('ch1');
    });
  });

  // ==================== Foreshadowings ====================

  describe('Foreshadowings', () => {
    it('should get all foreshadowings', async () => {
      mockPrisma.foreshadowing.findMany.mockResolvedValue([
        { id: '1', title: '暗线', status: 'PENDING' },
      ]);

      const result = await service.getForeshadowings('book1');
      expect(result).toHaveLength(1);
    });

    it('should filter foreshadowings by status', async () => {
      mockPrisma.foreshadowing.findMany.mockResolvedValue([]);

      await service.getForeshadowings('book1', 'RESOLVED');
      expect(mockPrisma.foreshadowing.findMany).toHaveBeenCalledWith({
        where: { bookId: 'book1', status: 'RESOLVED' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should create a foreshadowing with PENDING status', async () => {
      mockPrisma.foreshadowing.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'f1', ...data }),
      );

      const result = await service.createForeshadowing(
        'book1',
        {
          title: '神秘人的身份',
          content: '在第三章出现的蒙面人',
        },
        'ch3',
      );

      expect(result.status).toBe('PENDING');
      expect(result.chapterId).toBe('ch3');
    });

    it('should resolve a foreshadowing', async () => {
      mockPrisma.foreshadowing.update.mockResolvedValue({
        id: 'f1',
        status: 'RESOLVED',
        resolveAt: 'ch10',
      });

      const result = await service.resolveForeshadowing('f1', 'ch10');
      expect(result.status).toBe('RESOLVED');
    });

    it('should abandon a foreshadowing', async () => {
      mockPrisma.foreshadowing.update.mockResolvedValue({
        id: 'f1',
        status: 'ABANDONED',
      });

      const result = await service.abandonForeshadowing('f1');
      expect(result.status).toBe('ABANDONED');
    });
  });
});
