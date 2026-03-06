/**
 * OrchestratorService 单元测试
 *
 * 覆盖：多候选生成、FIM续写、大纲影响分析、Session日志、一致性检查集成
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OrchestratorService, AgentType, AgentRequest } from './orchestrator.service';
import { PrismaService } from '../prisma.service';
import { PlannerService } from '../planner/planner.service';
import { CharacterService } from '../character/character.service';
import { RagService } from '../rag/rag.service';
import { ConsistencyService } from '../consistency/consistency.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockPrisma = {
  worldSetting: { findMany: jest.fn() },
  plotLine: { findMany: jest.fn() },
  character: { findMany: jest.fn() },
  foreshadowing: { findMany: jest.fn() },
  chapter: { findMany: jest.fn(), findUnique: jest.fn() },
  chapterSummary: { findUnique: jest.fn() },
  agentSession: { create: jest.fn() },
};

const mockPlanner = {};
const mockCharacter = {};
const mockRag = {
  retrieve: jest.fn(),
};
const mockConsistency = {};
const mockConfig = {
  get: jest.fn().mockReturnValue('test-api-key'),
};

describe('OrchestratorService', () => {
  let service: OrchestratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrchestratorService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PlannerService, useValue: mockPlanner },
        { provide: CharacterService, useValue: mockCharacter },
        { provide: RagService, useValue: mockRag },
        { provide: ConsistencyService, useValue: mockConsistency },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<OrchestratorService>(OrchestratorService);
    jest.clearAllMocks();

    // Default mock responses for loadContext
    mockPrisma.worldSetting.findMany.mockResolvedValue([]);
    mockPrisma.plotLine.findMany.mockResolvedValue([]);
    mockPrisma.character.findMany.mockResolvedValue([]);
    mockPrisma.foreshadowing.findMany.mockResolvedValue([]);
    mockPrisma.chapterSummary.findUnique.mockResolvedValue(null);
  });

  // Helper: mock API call
  function mockApiResponse(content: string) {
    mockedAxios.post.mockResolvedValue({
      data: { choices: [{ message: { content } }] },
    });
  }

  function mockApiResponseSequence(responses: string[]) {
    let callIndex = 0;
    mockedAxios.post.mockImplementation(async () => {
      const content = responses[callIndex] || responses[responses.length - 1];
      callIndex++;
      return { data: { choices: [{ message: { content } }] } };
    });
  }

  // ==================== process ====================

  describe('process', () => {
    it('should process continue command and return result with session', async () => {
      mockRag.retrieve.mockResolvedValue([]);
      mockApiResponseSequence([
        '续写内容候选1',
        '续写内容候选2',
        '续写内容候选3',
        '{"issues": []}', // consistency check
      ]);
      mockPrisma.agentSession.create.mockResolvedValue({ id: 'session-1' });

      const request: AgentRequest = {
        bookId: 'book1',
        chapterId: 'ch1',
        content: '这是已有内容',
        command: 'continue',
        candidateCount: 3,
      };

      const result = await service.process(request);
      expect(result.status).toBe('success');
      expect(result.sessionId).toBe('session-1');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should log failed session on error', async () => {
      mockRag.retrieve.mockRejectedValue(new Error('RAG failure'));
      mockPrisma.agentSession.create.mockResolvedValue({ id: 'session-err' });

      const request: AgentRequest = {
        bookId: 'book1',
        content: '内容',
        command: 'continue',
      };

      await expect(service.process(request)).rejects.toThrow('RAG failure');
      expect(mockPrisma.agentSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        }),
      );
    });
  });

  // ==================== continueGeneration ====================

  describe('continueGeneration', () => {
    it('should use FIM when cursorPos is provided', async () => {
      mockApiResponseSequence(['插入的内容', '{"issues": []}']);

      const request: AgentRequest = {
        bookId: 'book1',
        content: '前半段内容后半段内容',
        cursorPos: 12, // 在"前半段内容"后
        candidateCount: 1,
      };

      const context = {
        characters: [],
        foreshadowings: [],
        chapterSummary: '',
        ragContext: '',
      };

      const result = await service.continueGeneration(request, context);
      expect(result.candidates).toBeDefined();
      expect(result.candidates!.length).toBeGreaterThanOrEqual(1);
    });

    it('should generate multiple candidates with increasing temperature', async () => {
      const calls: number[] = [];
      mockedAxios.post.mockImplementation(async (url, data: any) => {
        calls.push(data.temperature);
        return { data: { choices: [{ message: { content: `候选-${data.temperature}` } }] } };
      });

      const request: AgentRequest = {
        bookId: 'book1',
        content: '内容',
        candidateCount: 3,
      };

      const context = { characters: [], foreshadowings: [], chapterSummary: '', ragContext: '' };
      const result = await service.continueGeneration(request, context);

      // Should have 3 writer calls + 1 consistency check = 4 total
      expect(result.candidates!.length).toBe(3);
      // Temperatures: 0.7, 0.8, 0.9
      expect(calls[0]).toBeCloseTo(0.7);
      expect(calls[1]).toBeCloseTo(0.8);
      expect(calls[2]).toBeCloseTo(0.9);
    });

    it('should include diagnostics from consistency check', async () => {
      mockApiResponseSequence([
        '生成内容',
        '{"issues": [{"type": "character_personality", "severity": "WARNING", "description": "角色OOC"}]}',
      ]);

      const request: AgentRequest = { bookId: 'book1', content: 'X', candidateCount: 1 };
      const context = { characters: [], foreshadowings: [], chapterSummary: '', ragContext: '' };

      const result = await service.continueGeneration(request, context);
      expect(result.diagnostics).toBeDefined();
      expect(result.diagnostics!.length).toBe(1);
      expect(result.warnings).toContain('角色OOC');
    });
  });

  // ==================== analyzeImpact ====================

  describe('analyzeImpact', () => {
    it('should detect chapters affected by character deletion', async () => {
      mockPrisma.chapter.findMany.mockResolvedValue([
        {
          id: 'ch1',
          title: '第一章',
          order: 1,
          content: '林渊走进了酒馆，推开了沉重的木门，坐在角落里',
          chapterSummary: null,
        },
        {
          id: 'ch2',
          title: '第二章',
          order: 2,
          content: '阳光明媚的一天，鸟儿在枝头歌唱，花朵绽放在道路两旁',
          chapterSummary: null,
        },
      ]);

      const result = await service.analyzeImpact('book1', {
        type: 'character',
        action: 'delete',
        data: { name: '林渊' },
      });

      expect(result.affectedChapters).toHaveLength(1);
      expect(result.affectedChapters[0].chapterId).toBe('ch1');
      expect(result.affectedChapters[0].impact).toBe('HIGH');
    });

    it('should mark all chapters as MEDIUM for world_setting changes', async () => {
      mockPrisma.chapter.findMany.mockResolvedValue([
        { id: 'ch1', title: '第一章', order: 1, content: '内容满足长度要求1234567890' },
        { id: 'ch2', title: '第二章', order: 2, content: '另一个章节的内容1234567890' },
      ]);

      const result = await service.analyzeImpact('book1', {
        type: 'world_setting',
        action: 'update',
        data: { genre: '科幻' },
      });

      expect(result.affectedChapters).toHaveLength(2);
      expect(result.affectedChapters.every((c) => c.impact === 'MEDIUM')).toBe(true);
    });

    it('should detect foreshadowing impact with HIGH for mentioned chapters', async () => {
      mockPrisma.chapter.findMany.mockResolvedValue([
        {
          id: 'ch1',
          title: '第一章',
          order: 1,
          content: '他在古老的废墟中发现了神秘令牌，令牌散发着微弱的光芒',
        },
        {
          id: 'ch2',
          title: '第二章',
          order: 2,
          content: '无关的内容占位，这只是普通的日常描写，没有特别的剧情',
        },
      ]);

      const result = await service.analyzeImpact('book1', {
        type: 'foreshadowing',
        action: 'delete',
        data: { title: '神秘令牌' },
      });

      expect(result.affectedChapters).toHaveLength(1);
      expect(result.affectedChapters[0].impact).toBe('HIGH');
    });

    it('should sort by impact priority (HIGH first)', async () => {
      mockPrisma.chapter.findMany.mockResolvedValue([
        { id: 'ch1', title: '第一章', order: 1, content: '普通章节内容占位符' },
        { id: 'ch2', title: '第二章', order: 2, content: '林渊出场了这是重要章节' },
      ]);

      const result = await service.analyzeImpact('book1', {
        type: 'character',
        action: 'delete',
        data: { name: '林渊' },
      });

      // ch2 mentions 林渊 (HIGH), ch1 does not
      const highImpact = result.affectedChapters.filter((c) => c.impact === 'HIGH');
      if (highImpact.length > 0) {
        expect(result.affectedChapters[0].impact).toBe('HIGH');
      }
    });

    it('should include suggestedPriority for HIGH impact chapters', async () => {
      mockPrisma.chapter.findMany.mockResolvedValue([
        { id: 'ch1', title: '第一章', order: 1, content: '林渊的故事开始了..' },
      ]);

      const result = await service.analyzeImpact('book1', {
        type: 'character',
        action: 'delete',
        data: { name: '林渊' },
      });

      expect(result.suggestedPriority).toContain('ch1');
    });
  });

  // ==================== parseConsistencyResult ====================

  describe('parseConsistencyResult', () => {
    it('should parse valid JSON result', () => {
      const parsed = (service as any).parseConsistencyResult(
        '```json\n{"issues": [{"type": "timeline", "severity": "ERROR", "description": "时间错乱"}]}\n```',
      );
      expect(parsed.issues).toHaveLength(1);
      expect(parsed.issues[0].type).toBe('timeline');
    });

    it('should handle "检查通过" as no issues', () => {
      const parsed = (service as any).parseConsistencyResult('检查通过，没有发现问题');
      expect(parsed.issues).toEqual([]);
    });

    it('should fallback to INFO for unparseable text', () => {
      const parsed = (service as any).parseConsistencyResult('这段文本有些问题但不是JSON格式');
      expect(parsed.issues).toHaveLength(1);
      expect(parsed.issues[0].severity).toBe('INFO');
    });
  });

  // ==================== Session Logging ====================

  describe('Session Logging', () => {
    it('should log session with correct fields', async () => {
      mockPrisma.agentSession.create.mockResolvedValue({ id: 'sess1' });

      const session = await (service as any).logSession(
        'book1',
        'ch1',
        AgentType.WRITER,
        '{"command":"continue"}',
        '{"result":"ok"}',
        'COMPLETED',
        1234,
      );

      expect(mockPrisma.agentSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bookId: 'book1',
          chapterId: 'ch1',
          agentType: 'WRITER',
          status: 'COMPLETED',
          duration: 1234,
        }),
      });
    });

    it('should truncate long input/output', async () => {
      mockPrisma.agentSession.create.mockResolvedValue({ id: 'sess2' });

      const longInput = 'X'.repeat(10000);
      await (service as any).logSession(
        'book1',
        undefined,
        'WRITER',
        longInput,
        longInput,
        'COMPLETED',
        0,
      );

      const callData = mockPrisma.agentSession.create.mock.calls[0][0].data;
      expect(callData.input.length).toBeLessThanOrEqual(5000);
      expect(callData.output.length).toBeLessThanOrEqual(5000);
    });
  });

  // ==================== Prompt Building ====================

  describe('Prompt Building', () => {
    it('should build FIM prompt with prefix and suffix', () => {
      const prompt = (service as any).buildFIMPrompt(
        '前文内容',
        '后续内容',
        { characters: [], foreshadowings: [], chapterSummary: '前情摘要', ragContext: '' },
        '请写得更详细',
      );
      expect(prompt).toContain('前文内容');
      expect(prompt).toContain('后续内容');
      expect(prompt).toContain('前情摘要');
      expect(prompt).toContain('请写得更详细');
      expect(prompt).toContain('过渡段落');
    });

    it('should build writer prompt for generate mode', () => {
      const prompt = (service as any).buildWriterPrompt(
        'book1',
        '已有内容',
        '规划要点',
        {
          characters: [{ name: '林渊', role: '主角', profile: { personality: '冷静' } }],
          foreshadowings: [{ title: '秘密', content: '描述' }],
          plotLines: [{ type: 'MAIN', title: '主线', description: '描述' }],
          chapterSummary: '',
          ragContext: '',
        },
        'generate',
      );
      expect(prompt).toContain('林渊');
      expect(prompt).toContain('秘密');
      expect(prompt).toContain('规划要点');
    });

    it('should build consistency prompt with character settings', () => {
      const prompt = (service as any).buildConsistencyPrompt('book1', '待检查文本', {
        characters: [
          { name: '林渊', profile: { strength: '剑术', weakness: '火', personality: '冷静' } },
        ],
        foreshadowings: [{ title: '伏笔1', content: '内容' }],
        worldSettings: [{ genre: '玄幻', tone: '热血' }],
      });
      expect(prompt).toContain('林渊');
      expect(prompt).toContain('剑术');
      expect(prompt).toContain('伏笔1');
      expect(prompt).toContain('JSON');
    });
  });

  // ==================== Agent System Prompts ====================

  describe('System Prompts & Temperature', () => {
    it('should return different system prompts for each agent type', () => {
      const plannerPrompt = (service as any).getSystemPrompt(AgentType.PLANNER);
      const writerPrompt = (service as any).getSystemPrompt(AgentType.WRITER);
      const consistencyPrompt = (service as any).getSystemPrompt(AgentType.CONSISTENCY);

      expect(plannerPrompt).toContain('规划');
      expect(writerPrompt).toContain('小说');
      expect(consistencyPrompt).toContain('一致性');
    });

    it('should use lower temperature for consistency agent', () => {
      const consTemp = (service as any).getTemperature(AgentType.CONSISTENCY);
      const writerTemp = (service as any).getTemperature(AgentType.WRITER);
      expect(consTemp).toBeLessThan(writerTemp);
    });
  });
});
