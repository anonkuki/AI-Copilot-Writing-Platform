import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma.service';

/**
 * 一致性检查问题
 */
export interface ConsistencyIssue {
  type:
    | 'timeline'
    | 'character_ability'
    | 'character_personality'
    | 'world_rule'
    | 'foreshadowing'
    | 'logic';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  description: string;
  suggestion?: string;
  location?: string;
}

/**
 * 一致性规则输入
 */
export interface ConsistencyRuleInput {
  type: string;
  name: string;
  description?: string;
  condition: string; // JSON condition expression
  severity?: 'ERROR' | 'WARNING' | 'INFO';
}

/**
 * 一致性检查结果
 */
export interface ConsistencyCheckResult {
  score: number; // 0-1
  issues: ConsistencyIssue[];
  autoFixCandidates: Array<{
    issueIndex: number;
    candidates: string[];
  }>;
}

/**
 * ConsistencyService - 一致性检查服务（规则引擎 + LLM 辅助）
 *
 * 实现 SPEC 中 F 模块：
 * - 规则引擎（时间线约束、属性上限）
 * - 语义校验（LLM 辅助标注打分）
 * - 自动修复建议
 */
@Injectable()
export class ConsistencyService {
  private readonly logger = new Logger(ConsistencyService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.siliconflow.cn/v1/chat/completions';
  private readonly model = 'deepseek-ai/DeepSeek-V3.2';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('SILICONFLOW_API_KEY') ?? '';
  }

  // ==================== 规则 CRUD ====================

  async getRules(bookId: string, type?: string) {
    const where: any = { bookId };
    if (type) where.type = type;
    return this.prisma.consistencyRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(bookId: string, input: ConsistencyRuleInput) {
    return this.prisma.consistencyRule.create({
      data: {
        bookId,
        type: input.type,
        name: input.name,
        description: input.description,
        condition: input.condition,
        severity: input.severity || 'WARNING',
      },
    });
  }

  async updateRule(id: string, input: Partial<ConsistencyRuleInput>) {
    return this.prisma.consistencyRule.update({
      where: { id },
      data: input,
    });
  }

  async deleteRule(id: string) {
    return this.prisma.consistencyRule.delete({ where: { id } });
  }

  async toggleRule(id: string, isActive: boolean) {
    return this.prisma.consistencyRule.update({
      where: { id },
      data: { isActive },
    });
  }

  // ==================== 报告查询 ====================

  async getReports(bookId: string, limit = 10) {
    return this.prisma.consistencyReport.findMany({
      where: { bookId },
      orderBy: { checkedAt: 'desc' },
      take: limit,
    });
  }

  async getReport(id: string) {
    return this.prisma.consistencyReport.findUnique({ where: { id } });
  }

  // ==================== 核心：一致性检查 ====================

  /**
   * 对指定章节执行完整一致性检查
   * 1. 规则引擎检查（结构化规则）
   * 2. LLM 语义校验
   * 3. 合并评分
   */
  async checkChapter(bookId: string, chapterId: string): Promise<ConsistencyCheckResult> {
    const chapter = await this.prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) throw new NotFoundException('章节不存在');

    const content = chapter.content;
    if (!content || content.length < 10) {
      return { score: 1.0, issues: [], autoFixCandidates: [] };
    }

    // 并行加载所有检查所需数据
    const [
      rules,
      characters,
      foreshadowings,
      worldSettings,
      plotLines,
      timelineEvents,
      recentChapters,
    ] = await Promise.all([
      this.prisma.consistencyRule.findMany({ where: { bookId, isActive: true } }),
      this.prisma.character.findMany({
        where: { bookId },
        include: { profile: true, fromRels: { include: { toChar: true } } },
      }),
      this.prisma.foreshadowing.findMany({ where: { bookId } }),
      this.prisma.worldSetting.findMany({ where: { bookId } }),
      this.prisma.plotLine.findMany({ where: { bookId, status: 'ACTIVE' } }),
      this.prisma.timelineEvent.findMany({ where: { bookId }, orderBy: { order: 'asc' } }),
      this.prisma.chapter.findMany({
        where: { bookId, order: { lt: chapter.order } },
        orderBy: { order: 'desc' },
        take: 3,
        include: { chapterSummary: true },
      }),
    ]);

    const allIssues: ConsistencyIssue[] = [];

    // 1. 规则引擎检查
    const ruleIssues = this.runRuleEngine(
      content,
      rules,
      characters,
      foreshadowings,
      timelineEvents,
    );
    allIssues.push(...ruleIssues);

    // 2. 伏笔回收检查（结构化）
    const foreshadowingIssues = this.checkForeshadowingConsistency(
      content,
      foreshadowings,
      chapter.order,
    );
    allIssues.push(...foreshadowingIssues);

    // 3. 角色一致性检查（结构化）
    const characterIssues = this.checkCharacterConsistency(content, characters);
    allIssues.push(...characterIssues);

    // 4. LLM 语义校验
    const llmIssues = await this.llmSemanticCheck(
      content,
      characters,
      foreshadowings,
      worldSettings,
      recentChapters,
    );
    allIssues.push(...llmIssues);

    // 5. 计算评分
    const score = this.calculateScore(allIssues);

    // 6. 尝试生成自动修复候选
    const autoFixCandidates = await this.generateAutoFixCandidates(
      content,
      allIssues.filter((i) => i.severity === 'ERROR'),
    );

    // 7. 保存报告
    await this.prisma.consistencyReport.create({
      data: {
        bookId,
        chapterId,
        issues: JSON.stringify(allIssues),
        score,
      },
    });

    return { score, issues: allIssues, autoFixCandidates };
  }

  /**
   * 全书扫描 - 检查所有章节
   */
  async scanBook(bookId: string): Promise<{
    overallScore: number;
    chapterResults: Array<{ chapterId: string; title: string; score: number; issueCount: number }>;
    unresolvedForeshadowings: any[];
    taskList: Array<{
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      description: string;
      chapterId?: string;
    }>;
  }> {
    const chapters = await this.prisma.chapter.findMany({
      where: { bookId },
      orderBy: { order: 'asc' },
    });

    const chapterResults: Array<{
      chapterId: string;
      title: string;
      score: number;
      issueCount: number;
    }> = [];
    const allIssues: ConsistencyIssue[] = [];

    for (const chapter of chapters) {
      if (!chapter.content || chapter.content.length < 10) continue;
      const result = await this.checkChapter(bookId, chapter.id);
      chapterResults.push({
        chapterId: chapter.id,
        title: chapter.title,
        score: result.score,
        issueCount: result.issues.length,
      });
      allIssues.push(...result.issues);
    }

    // 检查未回收伏笔
    const unresolvedForeshadowings = await this.prisma.foreshadowing.findMany({
      where: { bookId, status: 'PENDING' },
    });

    // 生成任务列表
    const taskList = this.generateTaskList(chapterResults, unresolvedForeshadowings, allIssues);

    const overallScore =
      chapterResults.length > 0
        ? chapterResults.reduce((sum, r) => sum + r.score, 0) / chapterResults.length
        : 1.0;

    return { overallScore, chapterResults, unresolvedForeshadowings, taskList };
  }

  // ==================== 规则引擎 ====================

  private runRuleEngine(
    content: string,
    rules: any[],
    characters: any[],
    foreshadowings: any[],
    timelineEvents: any[],
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    for (const rule of rules) {
      try {
        const condition = JSON.parse(rule.condition);
        const matched = this.evaluateCondition(
          condition,
          content,
          characters,
          foreshadowings,
          timelineEvents,
        );
        if (matched) {
          issues.push({
            type: rule.type as any,
            severity: rule.severity as any,
            description: `规则 "${rule.name}" 触发: ${rule.description || ''}`,
            suggestion: condition.suggestion || undefined,
          });
        }
      } catch (e) {
        this.logger.warn(`规则解析失败: ${rule.id} - ${(e as Error).message}`);
      }
    }

    return issues;
  }

  /**
   * 评估规则条件
   * 条件格式:
   * { "operator": "contains", "field": "content", "value": "xxx" }
   * { "operator": "not_contains", "field": "content", "value": "xxx" }
   * { "operator": "character_mentions", "characterName": "xxx", "forbidden_actions": ["xxx"] }
   * { "operator": "keyword_conflict", "keywords": ["A", "B"], "message": "..." }
   */
  private evaluateCondition(
    condition: any,
    content: string,
    characters: any[],
    foreshadowings: any[],
    timelineEvents: any[],
  ): boolean {
    switch (condition.operator) {
      case 'contains':
        return content.includes(condition.value);

      case 'not_contains':
        return !content.includes(condition.value);

      case 'character_mentions': {
        const char = characters.find((c) => c.name === condition.characterName);
        if (!char || !content.includes(char.name)) return false;
        const forbiddenActions = condition.forbidden_actions || [];
        return forbiddenActions.some((action: string) => content.includes(action));
      }

      case 'keyword_conflict': {
        const keywords = condition.keywords || [];
        const found = keywords.filter((k: string) => content.includes(k));
        return found.length >= 2; // 两个冲突关键词同时出现
      }

      case 'timeline_order': {
        // 检查事件顺序是否正确
        const events = condition.events || [];
        let lastIndex = -1;
        for (const event of events) {
          const idx = content.indexOf(event);
          if (idx !== -1 && idx < lastIndex) return true; // 顺序错误
          if (idx !== -1) lastIndex = idx;
        }
        return false;
      }

      default:
        return false;
    }
  }

  // ==================== 结构化检查 ====================

  private checkForeshadowingConsistency(
    content: string,
    foreshadowings: any[],
    currentChapterOrder: number,
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    for (const f of foreshadowings) {
      if (f.status === 'PENDING') {
        // 检查是否在当前章节内容中有提及（使用关键词匹配）
        const keywords = this.extractKeywords(f.title + ' ' + f.content);
        const matchCount = keywords.filter((k) => content.includes(k)).length;
        const matchRatio = keywords.length > 0 ? matchCount / keywords.length : 0;

        if (matchRatio > 0.3) {
          issues.push({
            type: 'foreshadowing',
            severity: 'INFO',
            description: `伏笔「${f.title}」可能在本章有提及，建议确认是否需要回收`,
            suggestion: `检查伏笔「${f.title}」是否在此处得到解答或推进`,
          });
        }
      }
    }

    // 检查长期未回收的伏笔
    const pendingForeshadowings = foreshadowings.filter((f) => f.status === 'PENDING');
    for (const f of pendingForeshadowings) {
      // 如果伏笔关联的章节存在且距离当前章节超过10章
      if (f.chapterId && currentChapterOrder > 10) {
        issues.push({
          type: 'foreshadowing',
          severity: 'WARNING',
          description: `伏笔「${f.title}」已超过10章未回收，建议尽快处理`,
          suggestion: `在近期章节中安排伏笔「${f.title}」的回收`,
        });
      }
    }

    return issues;
  }

  private checkCharacterConsistency(content: string, characters: any[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    for (const char of characters) {
      if (!content.includes(char.name)) continue;

      const profile = char.profile;
      if (!profile) continue;

      // 检查能力越界 (如果有 weakness 且内容中角色做了相关事情)
      if (profile.weakness) {
        const weaknessKeywords = this.extractKeywords(profile.weakness);
        // 检查角色名附近是否有与弱点矛盾的描写
        const charIndex = content.indexOf(char.name);
        if (charIndex !== -1) {
          const surroundingText = content.substring(
            Math.max(0, charIndex - 200),
            Math.min(content.length, charIndex + 500),
          );
          // 检查是否有"轻松完成弱点相关动作"的描写
          const strengthIndicators = ['轻松', '毫不费力', '轻而易举', '不费吹灰之力'];
          for (const kw of weaknessKeywords) {
            if (surroundingText.includes(kw)) {
              const hasEasyIndicator = strengthIndicators.some((s) => surroundingText.includes(s));
              if (hasEasyIndicator) {
                issues.push({
                  type: 'character_ability',
                  severity: 'WARNING',
                  description: `角色「${char.name}」的弱点为「${profile.weakness}」，但在本章中出现了轻松完成相关动作的描写`,
                  suggestion: `请检查「${char.name}」的行为是否与其能力设定一致`,
                });
              }
            }
          }
        }
      }

      // 检查性格一致性
      if (profile.personality) {
        const personalityTraits = this.extractKeywords(profile.personality);
        const contradictions = this.getPersonalityContradictions();
        for (const trait of personalityTraits) {
          const contradicting = contradictions[trait];
          if (contradicting) {
            const charIndex = content.indexOf(char.name);
            if (charIndex !== -1) {
              const surroundingText = content.substring(
                Math.max(0, charIndex - 100),
                Math.min(content.length, charIndex + 500),
              );
              for (const contra of contradicting) {
                if (surroundingText.includes(contra)) {
                  issues.push({
                    type: 'character_personality',
                    severity: 'WARNING',
                    description: `角色「${char.name}」性格为「${trait}」，但出现了「${contra}」的描写，可能存在OOC`,
                    suggestion: `确认「${char.name}」的行为是否有合理的心理转变铺垫`,
                  });
                }
              }
            }
          }
        }
      }
    }

    return issues;
  }

  // ==================== LLM 语义校验 ====================

  private async llmSemanticCheck(
    content: string,
    characters: any[],
    foreshadowings: any[],
    worldSettings: any[],
    recentChapters: any[],
  ): Promise<ConsistencyIssue[]> {
    try {
      const charSummary = characters
        .slice(0, 8)
        .map((c) => {
          const p = c.profile || {};
          return `${c.name}(${c.role || '未设定'}): 性格=${p.personality || '未设定'}, 能力=${p.strength || '未设定'}, 弱点=${p.weakness || '未设定'}, 目标=${p.currentGoal || '未设定'}`;
        })
        .join('\n');

      const worldSummary = worldSettings
        .map(
          (ws) =>
            `题材=${ws.genre || '未设定'}, 主题=${ws.theme || '未设定'}, 风格=${ws.tone || '未设定'}`,
        )
        .join('\n');

      const pendingFS = foreshadowings.filter((f) => f.status === 'PENDING');
      const fsSummary = pendingFS
        .slice(0, 5)
        .map((f) => `「${f.title}」: ${f.content}`)
        .join('\n');

      const recentSummary = recentChapters
        .map((ch) => (ch.chapterSummary ? `第${ch.order}章: ${ch.chapterSummary.summary}` : ''))
        .filter(Boolean)
        .join('\n');

      const systemPrompt = `你是一个专业的小说编辑，负责检查文本的一致性问题。
请严格按照JSON格式返回检查结果，不要返回其他内容。

返回格式:
{
  "issues": [
    {
      "type": "timeline|character_ability|character_personality|world_rule|foreshadowing|logic",
      "severity": "ERROR|WARNING|INFO",
      "description": "问题描述",
      "suggestion": "修改建议"
    }
  ]
}

如果没有发现问题，返回 {"issues": []}`;

      const userPrompt = `请检查以下小说章节内容的一致性：

## 世界观设定
${worldSummary || '暂无'}

## 角色设定
${charSummary || '暂无'}

## 待回收伏笔
${fsSummary || '暂无'}

## 前情摘要
${recentSummary || '暂无'}

## 待检查内容
${content.slice(0, 4000)}

请检查：
1. 角色行为是否符合其性格和能力设定（OOC检测）
2. 时间线是否有矛盾
3. 世界观规则是否被违反
4. 是否有逻辑漏洞
5. 伏笔是否有回收机会但被遗漏`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 1500,
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
      return this.parseLlmIssues(resultText);
    } catch (error: any) {
      this.logger.error('LLM 语义校验失败', error.message);
      return [];
    }
  }

  private parseLlmIssues(text: string): ConsistencyIssue[] {
    try {
      // 提取 JSON 部分
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.issues || !Array.isArray(parsed.issues)) return [];

      return parsed.issues.map((issue: any) => ({
        type: issue.type || 'logic',
        severity: issue.severity || 'WARNING',
        description: issue.description || '',
        suggestion: issue.suggestion || undefined,
      }));
    } catch {
      return [];
    }
  }

  // ==================== 自动修复 ====================

  private async generateAutoFixCandidates(
    content: string,
    errorIssues: ConsistencyIssue[],
  ): Promise<Array<{ issueIndex: number; candidates: string[] }>> {
    if (errorIssues.length === 0) return [];

    const results: Array<{ issueIndex: number; candidates: string[] }> = [];

    for (let i = 0; i < Math.min(errorIssues.length, 3); i++) {
      const issue = errorIssues[i];
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            messages: [
              {
                role: 'system',
                content:
                  '你是小说编辑，请提供2种修改方案来修复以下问题。每种方案用 --- 分隔，直接给出修改后的文本片段。',
              },
              {
                role: 'user',
                content: `问题：${issue.description}\n建议：${issue.suggestion || '无'}\n\n原文片段：\n${content.slice(0, 2000)}\n\n请提供2种修改方案：`,
              },
            ],
            temperature: 0.8,
            max_tokens: 1000,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        );

        const text = response.data.choices[0].message.content;
        const candidates = text
          .split('---')
          .map((s: string) => s.trim())
          .filter(Boolean);
        results.push({ issueIndex: i, candidates: candidates.slice(0, 2) });
      } catch {
        // 跳过失败的修复
      }
    }

    return results;
  }

  // ==================== 任务列表生成 ====================

  private generateTaskList(
    chapterResults: Array<{ chapterId: string; title: string; score: number; issueCount: number }>,
    unresolvedForeshadowings: any[],
    allIssues: ConsistencyIssue[],
  ): Array<{ priority: 'HIGH' | 'MEDIUM' | 'LOW'; description: string; chapterId?: string }> {
    const tasks: Array<{
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      description: string;
      chapterId?: string;
    }> = [];

    // 低分章节需要重写
    for (const cr of chapterResults) {
      if (cr.score < 0.5) {
        tasks.push({
          priority: 'HIGH',
          description: `章节「${cr.title}」一致性评分仅 ${(cr.score * 100).toFixed(0)}% ，有 ${cr.issueCount} 个问题需要修复`,
          chapterId: cr.chapterId,
        });
      } else if (cr.score < 0.8) {
        tasks.push({
          priority: 'MEDIUM',
          description: `章节「${cr.title}」有 ${cr.issueCount} 个一致性问题`,
          chapterId: cr.chapterId,
        });
      }
    }

    // 未回收伏笔
    for (const f of unresolvedForeshadowings) {
      tasks.push({
        priority: 'MEDIUM',
        description: `伏笔「${f.title}」尚未回收`,
      });
    }

    // ERROR 级别问题
    const errors = allIssues.filter((i) => i.severity === 'ERROR');
    if (errors.length > 0) {
      tasks.push({
        priority: 'HIGH',
        description: `全书共有 ${errors.length} 个严重一致性错误需要修复`,
      });
    }

    // 按优先级排序
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return tasks;
  }

  // ==================== 辅助方法 ====================

  private calculateScore(issues: ConsistencyIssue[]): number {
    if (issues.length === 0) return 1.0;
    const weights = { ERROR: 0.3, WARNING: 0.1, INFO: 0.02 };
    let penalty = 0;
    for (const issue of issues) {
      penalty += weights[issue.severity] || 0.05;
    }
    return Math.max(0, Math.min(1, 1 - penalty));
  }

  private extractKeywords(text: string): string[] {
    if (!text) return [];
    // 提取中文词语（2字以上）和英文单词
    const chineseWords = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    const englishWords = text.match(/[a-zA-Z]{3,}/g) || [];
    return [...new Set([...chineseWords, ...englishWords])];
  }

  private getPersonalityContradictions(): Record<string, string[]> {
    return {
      冷静: ['暴怒', '失控', '歇斯底里', '情绪崩溃'],
      理性: ['冲动', '鲁莽', '不顾后果'],
      温柔: ['暴力', '残忍', '冷酷无情'],
      勇敢: ['畏缩', '逃跑', '胆怯', '害怕得发抖'],
      善良: ['残忍', '邪恶', '害人'],
      沉默寡言: ['滔滔不绝', '话痨', '喋喋不休'],
      谨慎: ['鲁莽', '冲动', '不计后果'],
      正直: ['欺骗', '说谎', '背叛'],
      内向: ['热情洋溢', '侃侃而谈', '成为焦点'],
      骄傲: ['卑微', '乞求', '低声下气'],
    };
  }
}
