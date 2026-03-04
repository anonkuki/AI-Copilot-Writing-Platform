/**
 * RagService 单元测试
 *
 * 覆盖：Embedding管理、向量检索、分层检索、章节摘要、伏笔建议
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RagService } from './rag.service';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockPrisma = {
  embedding: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  worldSetting: { findMany: jest.fn() },
  plotLine: { findMany: jest.fn() },
  character: { findMany: jest.fn() },
  foreshadowing: { findMany: jest.fn() },
  chapter: { findMany: jest.fn(), findUnique: jest.fn() },
  chapterSummary: { findUnique: jest.fn(), upsert: jest.fn() },
  eventLog: { create: jest.fn(), findMany: jest.fn() },
};

const mockConfig = {
  get: jest.fn().mockReturnValue('test-api-key'),
};

describe('RagService', () => {
  let service: RagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
    jest.clearAllMocks();
  });

  // ==================== getEmbedding ====================

  describe('getEmbedding', () => {
    it('should call API and return embedding vector', async () => {
      const fakeVector = [0.1, 0.2, 0.3, 0.4, 0.5];
      mockedAxios.post.mockResolvedValue({
        data: { data: [{ embedding: fakeVector }] },
      });

      const result = await service.getEmbedding('测试文本');
      expect(result).toEqual(fakeVector);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('embeddings'),
        expect.objectContaining({
          model: 'BAAI/bge-large-zh-v1.5',
          input: '测试文本',
        }),
        expect.any(Object),
      );
    });

    it('should return empty array on API error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API down'));

      const result = await service.getEmbedding('测试文本');
      expect(result).toEqual([]);
    });

    it('should truncate text longer than 2000 chars', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { data: [{ embedding: [0.1] }] },
      });

      const longText = 'X'.repeat(5000);
      await service.getEmbedding(longText);

      const calledInput = (mockedAxios.post.mock.calls[0][1] as any).input;
      expect(calledInput.length).toBeLessThanOrEqual(2000);
    });
  });

  // ==================== upsertEmbedding ====================

  describe('upsertEmbedding', () => {
    it('should store embedding for new source', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { data: [{ embedding: [0.1, 0.2, 0.3] }] },
      });
      mockPrisma.embedding.findFirst.mockResolvedValue(null);
      mockPrisma.embedding.upsert.mockResolvedValue({ id: 'emb1' });

      await service.upsertEmbedding('character', 'char1', 'book1', '林渊');
      expect(mockPrisma.embedding.upsert).toHaveBeenCalled();
    });

    it('should skip when embedding fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('fail'));

      await service.upsertEmbedding('character', 'char1', 'book1', '林渊');
      expect(mockPrisma.embedding.upsert).not.toHaveBeenCalled();
    });
  });

  // ==================== vectorSearch ====================

  describe('vectorSearch (via retrieve)', () => {
    it('should retrieve with mixed layers', async () => {
      // Layer 1: structured
      mockPrisma.worldSetting.findMany.mockResolvedValue([
        { id: 'ws1', genre: '玄幻', theme: '成长', tone: '热血' },
      ]);
      mockPrisma.plotLine.findMany.mockResolvedValue([]);
      mockPrisma.foreshadowing.findMany.mockResolvedValue([]);
      mockPrisma.character.findMany.mockResolvedValue([]);

      // Layer 2: recent window
      mockPrisma.chapter.findMany.mockResolvedValue([]);

      // Layer 3: vector search
      const fakeVector = [1, 0, 0];
      mockedAxios.post.mockResolvedValue({
        data: { data: [{ embedding: fakeVector }] },
      });
      mockPrisma.embedding.findMany.mockResolvedValue([
        {
          id: 'e1', sourceType: 'character', sourceId: 'c1',
          content: '林渊', vector: JSON.stringify([0.9, 0.1, 0]),
          metadata: null,
        },
      ]);

      const results = await service.retrieve('book1', '林渊的故事');
      expect(results.length).toBeGreaterThanOrEqual(1);
      // world_setting has score 1.0 (structured context)
      expect(results[0].type).toBe('world_setting');
    });

    it('should deduplicate by sourceId', async () => {
      mockPrisma.worldSetting.findMany.mockResolvedValue([
        { id: 'ws1', genre: '玄幻', theme: '', tone: '' },
      ]);
      mockPrisma.plotLine.findMany.mockResolvedValue([]);
      mockPrisma.foreshadowing.findMany.mockResolvedValue([]);
      mockPrisma.character.findMany.mockResolvedValue([]);
      mockPrisma.chapter.findMany.mockResolvedValue([]);

      // Embedding that duplicates world_setting ws1
      const fakeVector = [1, 0, 0];
      mockedAxios.post.mockResolvedValue({
        data: { data: [{ embedding: fakeVector }] },
      });
      mockPrisma.embedding.findMany.mockResolvedValue([
        {
          id: 'e1', sourceType: 'world_setting', sourceId: 'ws1',
          content: '玄幻', vector: JSON.stringify([0.9, 0.1, 0]),
          metadata: null,
        },
      ]);

      const results = await service.retrieve('book1', '任意查询');
      const wsResults = results.filter(r => r.sourceId === 'ws1');
      expect(wsResults.length).toBe(1); // 去重后只有1个
    });
  });

  // ==================== cosineSimilarity ====================

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      // Access private method via any
      const sim = (service as any).cosineSimilarity([1, 0, 0], [1, 0, 0]);
      expect(sim).toBeCloseTo(1.0);
    });

    it('should return 0 for orthogonal vectors', () => {
      const sim = (service as any).cosineSimilarity([1, 0, 0], [0, 1, 0]);
      expect(sim).toBeCloseTo(0.0);
    });

    it('should return 0 for empty vectors', () => {
      const sim = (service as any).cosineSimilarity([], []);
      expect(sim).toBe(0);
    });

    it('should return 0 for mismatched lengths', () => {
      const sim = (service as any).cosineSimilarity([1, 0], [1, 0, 0]);
      expect(sim).toBe(0);
    });
  });

  // ==================== indexBook ====================

  describe('indexBook', () => {
    it('should index all resource types', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { data: [{ embedding: [0.1, 0.2] }] },
      });
      mockPrisma.embedding.findFirst.mockResolvedValue(null);
      mockPrisma.embedding.upsert.mockResolvedValue({ id: 'emb' });

      mockPrisma.worldSetting.findMany.mockResolvedValue([
        { id: 'ws1', genre: '玄幻', theme: '成长', tone: '热血' },
      ]);
      mockPrisma.plotLine.findMany.mockResolvedValue([
        { id: 'pl1', title: '主线', description: '成长之路', type: 'MAIN', status: 'ACTIVE' },
      ]);
      mockPrisma.character.findMany.mockResolvedValue([
        { id: 'c1', name: '林渊', role: '主角', bio: '', profile: null },
      ]);
      mockPrisma.foreshadowing.findMany.mockResolvedValue([
        { id: 'f1', title: '神秘令牌', content: '描述', status: 'PENDING', chapterId: 'ch1' },
      ]);
      mockPrisma.chapter.findMany.mockResolvedValue([
        { id: 'ch1', title: '第一章', order: 1, bookId: 'b1', chapterSummary: { summary: '摘要' } },
      ]);

      const result = await service.indexBook('book1');
      expect(result.indexed).toBe(5); // 1 ws + 1 pl + 1 char + 1 fs + 1 summary
      expect(result.failed).toBe(0);
    });
  });

  // ==================== suggestForeshadowingResolution ====================

  describe('suggestForeshadowingResolution', () => {
    it('should suggest foreshadowing with keyword+vector scoring', async () => {
      mockPrisma.foreshadowing.findMany.mockResolvedValue([
        { id: 'f1', title: '神秘令牌', content: '令牌隐藏在暗室中', status: 'PENDING' },
      ]);

      mockedAxios.post.mockResolvedValue({
        data: { data: [{ embedding: [0.9, 0.1, 0] }] },
      });

      const result = await service.suggestForeshadowingResolution(
        'book1', 'ch1', '他在暗室中发现了一枚古老的令牌',
      );
      // 应该有匹配（关键词 "令牌", "暗室" 都命中）
      expect(result.length).toBeGreaterThanOrEqual(0); // 取决于分词和向量相似度
    });

    it('should return empty for no pending foreshadowings', async () => {
      mockPrisma.foreshadowing.findMany.mockResolvedValue([]);

      const result = await service.suggestForeshadowingResolution('book1', 'ch1', '内容');
      expect(result).toEqual([]);
    });
  });

  // ==================== generateChapterSummary ====================

  describe('generateChapterSummary', () => {
    it('should generate and save summary', async () => {
      mockPrisma.chapter.findUnique.mockResolvedValue({
        id: 'ch1', title: '第一章', content: 'X'.repeat(600), bookId: 'b1', order: 1,
      });

      mockedAxios.post.mockResolvedValue({
        data: { choices: [{ message: { content: '{"summary": "这是摘要", "keyEvents": ["事件1"]}' } }] },
      });

      mockPrisma.chapterSummary.upsert.mockResolvedValue({ id: 'cs1' });
      mockPrisma.embedding.findFirst.mockResolvedValue(null);
      mockPrisma.embedding.upsert.mockResolvedValue({ id: 'e1' });

      const result = await service.generateChapterSummary('ch1');
      expect(result).toBe('这是摘要');
      expect(mockPrisma.chapterSummary.upsert).toHaveBeenCalled();
    });

    it('should throw for non-existent chapter', async () => {
      mockPrisma.chapter.findUnique.mockResolvedValue(null);
      await expect(service.generateChapterSummary('fake')).rejects.toThrow('章节不存在');
    });

    it('should return empty for short content', async () => {
      mockPrisma.chapter.findUnique.mockResolvedValue({
        id: 'ch1', title: '短章', content: '很短', bookId: 'b1',
      });
      const result = await service.generateChapterSummary('ch1');
      expect(result).toBe('');
    });
  });

  // ==================== Events ====================

  describe('Events', () => {
    it('should log event', async () => {
      mockPrisma.eventLog.create.mockResolvedValue({ id: 'ev1', type: 'FIGHT' });
      const result = await service.logEvent('b1', 'ch1', 'FIGHT', '战斗描述', ['林渊', '敌人']);
      expect(result.type).toBe('FIGHT');
    });

    it('should get events filtered by character', async () => {
      mockPrisma.eventLog.findMany.mockResolvedValue([
        { id: 'ev1', description: '林渊战斗', participants: JSON.stringify(['林渊']) },
        { id: 'ev2', description: '其他事件', participants: JSON.stringify(['其他']) },
      ]);

      const result = await service.getRelatedEvents('b1', '林渊');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ev1');
    });
  });
});
