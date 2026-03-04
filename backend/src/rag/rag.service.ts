import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma.service';

/**
 * RAG 检索结果
 */
export interface RetrievalResult {
  type: 'world_setting' | 'plot_line' | 'character' | 'foreshadowing' | 'chapter_summary' | 'scene' | 'event';
  content: string;
  sourceId: string;
  score: number;
  metadata?: Record<string, any>;
}

/**
 * Embedding 条目
 */
interface EmbeddingEntry {
  id: string;
  sourceType: string;
  sourceId: string;
  bookId: string;
  content: string;
  vector: number[];
  metadata?: Record<string, any>;
}

/**
 * RAG Service - 增强版向量检索服务
 *
 * 实现 SPEC 中 B 模块：
 * - 向量存储与索引
 * - 余弦相似度检索
 * - 分层检索策略（短期 window + 长期 embedding）
 * - 按章节/人物/主题/情绪/伏笔标签索引
 */
@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.siliconflow.cn/v1/embeddings';
  private readonly embeddingModel = 'BAAI/bge-large-zh-v1.5';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('SILICONFLOW_API_KEY');
  }

  // ==================== Embedding 管理 ====================

  /**
   * 获取文本嵌入向量
   */
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.embeddingModel,
          input: text.slice(0, 2000), // 截断超长文本
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      return response.data.data[0].embedding;
    } catch (error: any) {
      this.logger.error('获取嵌入向量失败', error.message);
      return [];
    }
  }

  /**
   * 存储/更新 embedding
   */
  async upsertEmbedding(
    sourceType: string,
    sourceId: string,
    bookId: string,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const vector = await this.getEmbedding(content);
    if (vector.length === 0) return;

    await this.prisma.embedding.upsert({
      where: {
        // 使用 sourceId 查找
        id: await this.findEmbeddingId(sourceType, sourceId) || 'non-existent',
      },
      update: {
        content,
        vector: JSON.stringify(vector),
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      create: {
        sourceType,
        sourceId,
        bookId,
        content,
        vector: JSON.stringify(vector),
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }

  private async findEmbeddingId(sourceType: string, sourceId: string): Promise<string | null> {
    const existing = await this.prisma.embedding.findFirst({
      where: { sourceType, sourceId },
      select: { id: true },
    });
    return existing?.id || null;
  }

  /**
   * 批量索引书籍全部资源
   */
  async indexBook(bookId: string): Promise<{ indexed: number; failed: number }> {
    let indexed = 0;
    let failed = 0;

    // 索引世界观
    const worldSettings = await this.prisma.worldSetting.findMany({ where: { bookId } });
    for (const ws of worldSettings) {
      try {
        const text = `题材:${ws.genre || ''} 主题:${ws.theme || ''} 风格:${ws.tone || ''}`;
        await this.upsertEmbedding('world_setting', ws.id, bookId, text, { type: 'world_setting' });
        indexed++;
      } catch { failed++; }
    }

    // 索引剧情线
    const plotLines = await this.prisma.plotLine.findMany({ where: { bookId } });
    for (const pl of plotLines) {
      try {
        await this.upsertEmbedding('plot_line', pl.id, bookId, `${pl.title}: ${pl.description || ''}`, {
          type: pl.type, status: pl.status,
        });
        indexed++;
      } catch { failed++; }
    }

    // 索引角色
    const characters = await this.prisma.character.findMany({
      where: { bookId },
      include: { profile: true },
    });
    for (const c of characters) {
      try {
        const profile = c.profile;
        const text = profile
          ? `${c.name}(${c.role || ''}): 性格=${profile.personality || ''}, 背景=${profile.background || ''}, 动机=${profile.motivation || ''}, 目标=${profile.currentGoal || ''}`
          : `${c.name}(${c.role || ''}): ${c.bio || ''}`;
        await this.upsertEmbedding('character', c.id, bookId, text, {
          name: c.name, role: c.role,
        });
        indexed++;
      } catch { failed++; }
    }

    // 索引伏笔
    const foreshadowings = await this.prisma.foreshadowing.findMany({ where: { bookId } });
    for (const f of foreshadowings) {
      try {
        await this.upsertEmbedding('foreshadowing', f.id, bookId, `伏笔: ${f.title} - ${f.content}`, {
          status: f.status, chapterId: f.chapterId,
        });
        indexed++;
      } catch { failed++; }
    }

    // 索引章节摘要
    const chapters = await this.prisma.chapter.findMany({
      where: { bookId },
      include: { chapterSummary: true },
    });
    for (const ch of chapters) {
      if (ch.chapterSummary) {
        try {
          await this.upsertEmbedding('chapter_summary', ch.id, bookId, ch.chapterSummary.summary, {
            chapterId: ch.id, chapterTitle: ch.title, order: ch.order,
          });
          indexed++;
        } catch { failed++; }
      }
    }

    return { indexed, failed };
  }

  // ==================== 核心检索 ====================

  /**
   * 增强版上下文检索
   * 使用分层检索策略：
   * 1. 短期窗口：最近章节的直接内容
   * 2. 长期记忆：基于向量相似度的 Top-K 检索
   * 3. 结构化元数据：直接加载关键设定
   */
  async retrieve(
    bookId: string,
    queryText: string,
    options: {
      limit?: number;
      includeTypes?: string[];
      chapterId?: string;
    } = {},
  ): Promise<RetrievalResult[]> {
    const limit = options.limit || 10;
    const results: RetrievalResult[] = [];

    // Layer 1: 结构化直接加载（始终包含核心设定）
    const structuredResults = await this.loadStructuredContext(bookId);
    results.push(...structuredResults);

    // Layer 2: 短期窗口 - 最近章节摘要
    const windowResults = await this.loadRecentWindow(bookId, options.chapterId, 3);
    results.push(...windowResults);

    // Layer 3: 向量相似度检索
    if (queryText && queryText.length > 0) {
      const vectorResults = await this.vectorSearch(bookId, queryText, limit);
      results.push(...vectorResults);
    }

    // 去重（按 sourceId）
    const seen = new Set<string>();
    const deduped = results.filter(r => {
      const key = `${r.type}:${r.sourceId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 过滤类型
    let filtered = deduped;
    if (options.includeTypes && options.includeTypes.length > 0) {
      filtered = deduped.filter(r => options.includeTypes.includes(r.type));
    }

    // 按 score 降序排列
    filtered.sort((a, b) => b.score - a.score);

    return filtered.slice(0, limit);
  }

  /**
   * 向量相似度搜索 (Top-K)
   */
  private async vectorSearch(bookId: string, queryText: string, limit: number): Promise<RetrievalResult[]> {
    const queryVector = await this.getEmbedding(queryText);
    if (queryVector.length === 0) return [];

    // 加载该书籍的所有 embedding
    const embeddings = await this.prisma.embedding.findMany({
      where: { bookId },
    });

    if (embeddings.length === 0) return [];

    // 计算余弦相似度
    const scored = embeddings.map(emb => {
      let vector: number[];
      try {
        vector = JSON.parse(emb.vector);
      } catch {
        return null;
      }
      const score = this.cosineSimilarity(queryVector, vector);
      return {
        type: emb.sourceType as any,
        content: emb.content,
        sourceId: emb.sourceId,
        score,
        metadata: emb.metadata ? JSON.parse(emb.metadata) : undefined,
      };
    }).filter(Boolean) as RetrievalResult[];

    // 按相似度排序取 Top-K
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * 余弦相似度计算
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // ==================== 分层加载 ====================

  /**
   * 加载结构化核心设定（高优先级，始终包含）
   */
  private async loadStructuredContext(bookId: string): Promise<RetrievalResult[]> {
    const results: RetrievalResult[] = [];

    // 世界观（最高优先级）
    const worldSettings = await this.prisma.worldSetting.findMany({ where: { bookId } });
    for (const ws of worldSettings) {
      results.push({
        type: 'world_setting',
        content: `题材: ${ws.genre || '未设定'}, 主题: ${ws.theme || '未设定'}, 风格: ${ws.tone || '未设定'}`,
        sourceId: ws.id,
        score: 1.0, // 核心设定满分
      });
    }

    // 活跃剧情线
    const plotLines = await this.prisma.plotLine.findMany({
      where: { bookId, status: 'ACTIVE' },
    });
    for (const pl of plotLines) {
      results.push({
        type: 'plot_line',
        content: `[${pl.type}] ${pl.title}: ${pl.description || ''}`,
        sourceId: pl.id,
        score: 0.95,
      });
    }

    // 待回收伏笔
    const foreshadowings = await this.prisma.foreshadowing.findMany({
      where: { bookId, status: 'PENDING' },
    });
    for (const f of foreshadowings) {
      results.push({
        type: 'foreshadowing',
        content: `伏笔「${f.title}」: ${f.content}`,
        sourceId: f.id,
        score: 0.9,
      });
    }

    // 角色核心信息
    const characters = await this.prisma.character.findMany({
      where: { bookId },
      include: { profile: true },
    });
    for (const c of characters) {
      const p = c.profile;
      const content = p
        ? `${c.name}(${c.role || ''}): 性格=${p.personality || '未设定'}, 目标=${p.currentGoal || '未设定'}, 动机=${p.motivation || '未设定'}`
        : `${c.name}(${c.role || ''}): ${c.bio || '暂无简介'}`;
      results.push({
        type: 'character',
        content,
        sourceId: c.id,
        score: 0.85,
      });
    }

    return results;
  }

  /**
   * 加载最近章节窗口（短期记忆）
   */
  private async loadRecentWindow(bookId: string, currentChapterId?: string, windowSize = 3): Promise<RetrievalResult[]> {
    const results: RetrievalResult[] = [];

    let orderCondition: any = {};
    if (currentChapterId) {
      const current = await this.prisma.chapter.findUnique({
        where: { id: currentChapterId },
        select: { order: true },
      });
      if (current) {
        orderCondition = { order: { lt: current.order } };
      }
    }

    const chapters = await this.prisma.chapter.findMany({
      where: { bookId, ...orderCondition },
      orderBy: { order: 'desc' },
      take: windowSize,
      include: { chapterSummary: true },
    });

    for (const ch of chapters) {
      if (ch.chapterSummary) {
        results.push({
          type: 'chapter_summary',
          content: `第${ch.order}章「${ch.title}」: ${ch.chapterSummary.summary}`,
          sourceId: ch.id,
          score: 0.8 + (0.05 * (windowSize - chapters.indexOf(ch))), // 越近的章节权重越高
        });
      }
    }

    return results;
  }

  // ==================== 章节摘要 ====================

  /**
   * 生成章节摘要
   */
  async generateChapterSummary(chapterId: string): Promise<string> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new Error('章节不存在');
    }

    const content = chapter.content;
    if (content.length < 500) {
      return '';
    }

    try {
      const response = await axios.post(
        'https://api.siliconflow.cn/v1/chat/completions',
        {
          model: 'deepseek-ai/DeepSeek-V3.2',
          messages: [
            {
              role: 'system',
              content: `你是一个小说摘要助手。请用以下JSON格式返回章节摘要：
{"summary": "摘要文本", "keyEvents": ["事件1", "事件2"], "characters": ["出场角色1", "出场角色2"], "emotions": ["主要情绪基调"]}`,
            },
            {
              role: 'user',
              content: `请总结以下章节内容，摘要控制在200字以内：\n\n${content.slice(0, 4000)}`,
            },
          ],
          temperature: 0.5,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const resultText = response.data.choices[0].message.content;
      let summary = resultText;
      let keyEvents: string[] = [];

      // 尝试解析 JSON
      try {
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          summary = parsed.summary || resultText;
          keyEvents = parsed.keyEvents || [];
        }
      } catch {}

      // 保存摘要
      await this.prisma.chapterSummary.upsert({
        where: { chapterId },
        update: {
          summary,
          keyEvents: JSON.stringify(keyEvents),
          wordCount: content.length,
        },
        create: {
          chapterId,
          summary,
          keyEvents: JSON.stringify(keyEvents),
          wordCount: content.length,
        },
      });

      // 更新 embedding 索引
      await this.upsertEmbedding('chapter_summary', chapterId, chapter.bookId, summary, {
        chapterId, chapterTitle: chapter.title, order: chapter.order,
      });

      return summary;
    } catch (error: any) {
      this.logger.error('生成章节摘要失败', error.message);
      return '';
    }
  }

  // ==================== 伏笔管理 ====================

  /**
   * 智能伏笔回收建议 - 增强版
   * 使用关键词提取 + 语义相似度
   */
  async suggestForeshadowingResolution(
    bookId: string,
    chapterId: string,
    chapterContent: string,
  ): Promise<Array<{ foreshadowingId: string; title: string; confidence: number; suggestion: string }>> {
    const foreshadowings = await this.prisma.foreshadowing.findMany({
      where: { bookId, status: 'PENDING' },
    });

    if (foreshadowings.length === 0) return [];

    const suggestions: Array<{ foreshadowingId: string; title: string; confidence: number; suggestion: string }> = [];

    // 获取章节内容的 embedding
    const chapterVector = await this.getEmbedding(chapterContent.slice(0, 2000));

    for (const f of foreshadowings) {
      // 方法1: 关键词匹配
      const keywords = this.extractKeywords(f.title + ' ' + f.content);
      const matchCount = keywords.filter(k => chapterContent.includes(k)).length;
      const keywordScore = keywords.length > 0 ? matchCount / keywords.length : 0;

      // 方法2: 向量相似度
      let vectorScore = 0;
      if (chapterVector.length > 0) {
        const fVector = await this.getEmbedding(`${f.title}: ${f.content}`);
        if (fVector.length > 0) {
          vectorScore = this.cosineSimilarity(chapterVector, fVector);
        }
      }

      // 综合得分
      const confidence = keywordScore * 0.4 + vectorScore * 0.6;

      if (confidence > 0.3) {
        suggestions.push({
          foreshadowingId: f.id,
          title: f.title,
          confidence,
          suggestion: confidence > 0.6
            ? `伏笔「${f.title}」与当前章节高度相关，建议在此处回收`
            : `伏笔「${f.title}」可能与当前章节有关联，建议确认`,
        });
      }
    }

    suggestions.sort((a, b) => b.confidence - a.confidence);
    return suggestions;
  }

  // ==================== 事件日志 ====================

  async logEvent(
    bookId: string,
    chapterId: string | undefined,
    type: string,
    description: string,
    participants?: string[],
  ) {
    return this.prisma.eventLog.create({
      data: {
        bookId,
        chapterId,
        type,
        description,
        participants: participants ? JSON.stringify(participants) : null,
      },
    });
  }

  async getRelatedEvents(bookId: string, characterName?: string, limit = 10) {
    const where: any = { bookId };

    const events = await this.prisma.eventLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit * 2, // 多取一些用于过滤
    });

    if (characterName) {
      return events.filter(e => {
        if (e.participants) {
          try {
            const participants = JSON.parse(e.participants);
            return participants.includes(characterName);
          } catch { return false; }
        }
        return e.description.includes(characterName);
      }).slice(0, limit);
    }

    return events.slice(0, limit);
  }

  // ==================== 辅助方法 ====================

  private extractKeywords(text: string): string[] {
    if (!text) return [];
    const chineseWords = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    const englishWords = text.match(/[a-zA-Z]{3,}/g) || [];
    // 去除常见停用词
    const stopWords = new Set(['一个', '没有', '可以', '这个', '那个', '已经', '所以', '因为', '但是', '如果']);
    return [...new Set([...chineseWords, ...englishWords])].filter(w => !stopWords.has(w));
  }
}
