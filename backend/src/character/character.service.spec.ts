/**
 * CharacterService 单元测试
 *
 * 覆盖角色详情、关系、情绪日志、成长记录的管理
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CharacterService } from './character.service';
import { PrismaService } from '../prisma.service';

const mockPrisma = {
  characterProfile: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  characterRelationship: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  emotionLog: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  growthRecord: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  character: {
    findMany: jest.fn(),
  },
};

describe('CharacterService', () => {
  let service: CharacterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharacterService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CharacterService>(CharacterService);
    jest.clearAllMocks();
  });

  // ==================== Character Profile ====================

  describe('CharacterProfile', () => {
    it('should get character profile', async () => {
      const profile = {
        id: 'p1',
        characterId: 'c1',
        personality: '冷静、理性',
        motivation: '找回记忆',
        currentGoal: '复兴家族',
      };
      mockPrisma.characterProfile.findUnique.mockResolvedValue(profile);

      const result = await service.getCharacterProfile('c1');
      expect(result).toEqual(profile);
      expect(result.personality).toBe('冷静、理性');
    });

    it('should upsert character profile - create new', async () => {
      const input = {
        personality: '勇敢、正直',
        background: '孤儿出身',
        currentGoal: '成为剑圣',
      };
      mockPrisma.characterProfile.upsert.mockResolvedValue({
        id: 'p1', characterId: 'c1', ...input,
      });

      const result = await service.upsertCharacterProfile('c1', input);
      expect(result.personality).toBe('勇敢、正直');
    });

    it('should update character state', async () => {
      mockPrisma.characterProfile.findUnique.mockResolvedValue({
        id: 'p1', characterId: 'c1', currentGoal: '旧目标',
      });
      mockPrisma.characterProfile.update.mockResolvedValue({
        id: 'p1', currentGoal: '新目标',
      });

      const result = await service.updateCharacterState('c1', '新目标');
      expect(result.currentGoal).toBe('新目标');
    });

    it('should create profile if not exists when updating state', async () => {
      mockPrisma.characterProfile.findUnique.mockResolvedValue(null);
      mockPrisma.characterProfile.create.mockResolvedValue({
        id: 'p1', characterId: 'c1', currentGoal: '目标',
      });

      const result = await service.updateCharacterState('c1', '目标');
      expect(result.currentGoal).toBe('目标');
    });
  });

  // ==================== Character Relationships ====================

  describe('CharacterRelationships', () => {
    it('should get all relationships for a book with character info', async () => {
      mockPrisma.characterRelationship.findMany.mockResolvedValue([
        {
          id: 'r1', fromId: 'c1', toId: 'c2', type: '师徒', status: 'POSITIVE',
          fromChar: { name: '林渊' }, toChar: { name: '张三' },
        },
      ]);

      const result = await service.getCharacterRelationships('book1');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('师徒');
    });

    it('should create a character relationship', async () => {
      mockPrisma.characterRelationship.create.mockResolvedValue({
        id: 'r1', bookId: 'book1', fromId: 'c1', toId: 'c2', type: '对手', status: 'NEGATIVE',
      });

      const result = await service.createCharacterRelationship('book1', 'c1', {
        toId: 'c2', type: '对手', status: 'NEGATIVE',
      });
      expect(result.type).toBe('对手');
      expect(result.status).toBe('NEGATIVE');
    });

    it('should default relationship status to NEUTRAL', async () => {
      mockPrisma.characterRelationship.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'r1', ...data }),
      );

      const result = await service.createCharacterRelationship('book1', 'c1', {
        toId: 'c2', type: '同窗',
      });
      expect(result.status).toBe('NEUTRAL');
    });
  });

  // ==================== Emotion Logs ====================

  describe('EmotionLogs', () => {
    it('should get emotion logs ordered by time', async () => {
      mockPrisma.emotionLog.findMany.mockResolvedValue([
        { id: 'e1', emotion: '愤怒', intensity: 8, trigger: '好友被害' },
        { id: 'e2', emotion: '悲伤', intensity: 6, trigger: '回忆往事' },
      ]);

      const result = await service.getEmotionLogs('c1', 5);
      expect(result).toHaveLength(2);
      expect(mockPrisma.emotionLog.findMany).toHaveBeenCalledWith({
        where: { characterId: 'c1' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });

    it('should log emotion with default intensity 5', async () => {
      mockPrisma.emotionLog.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'e1', ...data }),
      );

      const result = await service.logEmotion('c1', 'ch1', { emotion: '开心' });
      expect(result.intensity).toBe(5);
    });

    it('should log emotion with custom intensity', async () => {
      mockPrisma.emotionLog.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'e1', ...data }),
      );

      const result = await service.logEmotion('c1', 'ch1', {
        emotion: '怒', intensity: 9, trigger: '被背叛',
      });
      expect(result.intensity).toBe(9);
      expect(result.trigger).toBe('被背叛');
    });
  });

  // ==================== Growth Records ====================

  describe('GrowthRecords', () => {
    it('should log character growth', async () => {
      mockPrisma.growthRecord.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'g1', ...data }),
      );

      const result = await service.logGrowth(
        'c1', 'ch5', '初入门派的菜鸟', '掌握基本剑法', '在比武中获胜',
      );
      expect(result.beforeState).toBe('初入门派的菜鸟');
      expect(result.afterState).toBe('掌握基本剑法');
    });
  });

  // ==================== Full Characters ====================

  describe('FullCharacters', () => {
    it('should return characters with all relations', async () => {
      mockPrisma.character.findMany.mockResolvedValue([
        {
          id: 'c1', name: '林渊', role: '主角',
          profile: { personality: '冷静' },
          fromRels: [{ toChar: { name: '张三' } }],
          toRels: [],
          emotions: [{ emotion: '平静', intensity: 5 }],
        },
      ]);

      const result = await service.getFullCharacters('book1');
      expect(result).toHaveLength(1);
      expect(result[0].profile.personality).toBe('冷静');
    });
  });

  // ==================== Conflict Check ====================

  describe('ConflictCheck', () => {
    it('should detect weakness conflict', async () => {
      mockPrisma.characterProfile.findUnique.mockResolvedValue({
        id: 'p1', weakness: '恐高',
      });

      const result = await service.checkCharacterConflict('c1', '在高空中恐高跳跃');
      expect(result).toContain('角色行为可能与其弱点冲突');
    });

    it('should return no warnings if no conflict', async () => {
      mockPrisma.characterProfile.findUnique.mockResolvedValue({
        id: 'p1', weakness: '恐高',
      });

      const result = await service.checkCharacterConflict('c1', '在地面行走');
      expect(result).toHaveLength(0);
    });

    it('should return empty if no profile', async () => {
      mockPrisma.characterProfile.findUnique.mockResolvedValue(null);

      const result = await service.checkCharacterConflict('c1', '任何行为');
      expect(result).toHaveLength(0);
    });
  });
});
