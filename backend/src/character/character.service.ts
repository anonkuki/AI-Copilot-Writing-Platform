import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

/**
 * 角色详情输入
 */
export interface CharacterProfileInput {
  personality?: string;
  background?: string;
  motivation?: string;
  fear?: string;
  strength?: string;
  weakness?: string;
  currentGoal?: string;
  longTermGoal?: string;
  arc?: string;
  appearance?: string;
  catchphrase?: string;
}

export interface CharacterRelationshipInput {
  toId: string;
  type: string;
  description?: string;
  status?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

export interface EmotionLogInput {
  emotion: string;
  intensity?: number;
  trigger?: string;
}

/**
 * Character Service - 角色管理服务
 * 负责 L2 战术层的角色数据管理
 */
@Injectable()
export class CharacterService {
  constructor(private prisma: PrismaService) {}

  // ==================== 角色详情 ====================

  /**
   * 获取角色详情
   */
  async getCharacterProfile(characterId: string) {
    return this.prisma.characterProfile.findUnique({
      where: { characterId },
    });
  }

  /**
   * 创建或更新角色详情
   */
  async upsertCharacterProfile(characterId: string, input: CharacterProfileInput) {
    return this.prisma.characterProfile.upsert({
      where: { characterId },
      update: input,
      create: {
        characterId,
        ...input,
      },
    });
  }

  /**
   * 更新角色状态（当前目标等）
   */
  async updateCharacterState(characterId: string, currentGoal?: string, emotion?: string) {
    const profile = await this.prisma.characterProfile.findUnique({
      where: { characterId },
    });

    if (!profile) {
      // 如果没有详情，创建新的
      return this.prisma.characterProfile.create({
        data: {
          characterId,
          currentGoal,
        },
      });
    }

    return this.prisma.characterProfile.update({
      where: { characterId },
      data: {
        currentGoal,
      },
    });
  }

  // ==================== 角色关系 ====================

  /**
   * 获取角色的所有关系
   */
  async getCharacterRelationships(bookId: string) {
    return this.prisma.characterRelationship.findMany({
      where: { bookId },
      include: {
        fromChar: true,
        toChar: true,
      },
    });
  }

  /**
   * 创建角色关系
   */
  async createCharacterRelationship(bookId: string, fromId: string, input: CharacterRelationshipInput) {
    return this.prisma.characterRelationship.create({
      data: {
        bookId,
        fromId,
        toId: input.toId,
        type: input.type,
        description: input.description,
        status: input.status || 'NEUTRAL',
      },
    });
  }

  /**
   * 更新角色关系
   */
  async updateCharacterRelationship(id: string, input: Partial<CharacterRelationshipInput>) {
    return this.prisma.characterRelationship.update({
      where: { id },
      data: input,
    });
  }

  /**
   * 删除角色关系
   */
  async deleteCharacterRelationship(id: string) {
    return this.prisma.characterRelationship.delete({
      where: { id },
    });
  }

  // ==================== 情绪日志 ====================

  /**
   * 获取角色的情绪日志
   */
  async getEmotionLogs(characterId: string, limit: number = 10) {
    return this.prisma.emotionLog.findMany({
      where: { characterId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * 记录情绪
   */
  async logEmotion(characterId: string, chapterId: string | undefined, input: EmotionLogInput) {
    return this.prisma.emotionLog.create({
      data: {
        characterId,
        chapterId,
        emotion: input.emotion,
        intensity: input.intensity || 5,
        trigger: input.trigger,
      },
    });
  }

  // ==================== 成长记录 ====================

  /**
   * 获取角色成长记录
   */
  async getGrowthRecords(characterId: string) {
    return this.prisma.growthRecord.findMany({
      where: { characterId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 记录成长
   */
  async logGrowth(
    characterId: string,
    chapterId: string | undefined,
    beforeState: string,
    afterState: string,
    description?: string,
  ) {
    return this.prisma.growthRecord.create({
      data: {
        characterId,
        chapterId,
        beforeState,
        afterState,
        description,
      },
    });
  }

  // ==================== 批量操作 ====================

  /**
   * 获取书籍的所有角色（含详情）
   */
  async getFullCharacters(bookId: string) {
    return this.prisma.character.findMany({
      where: { bookId },
      include: {
        profile: true,
        fromRels: { include: { toChar: true } },
        toRels: { include: { fromChar: true } },
        emotions: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  /**
   * 检查角色冲突
   */
  async checkCharacterConflict(characterId: string, action: string): Promise<string[]> {
    const warnings: string[] = [];
    const profile = await this.prisma.characterProfile.findUnique({
      where: { characterId },
    });

    if (!profile) return warnings;

    // 检查能力边界
    if (profile.weakness && action.includes(profile.weakness)) {
      warnings.push(`角色行为可能与其弱点冲突`);
    }

    return warnings;
  }
}
