import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

/**
 * 场景输入
 */
export interface SceneInput {
  title?: string;
  content: string;
  location?: string;
  timeOfDay?: string;
  order?: number;
}

/**
 * SceneService - L1 执行层场景管理
 *
 * 每个章节可拆分为多个场景，场景是写作的最小执行单元
 */
@Injectable()
export class SceneService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取章节的所有场景
   */
  async getScenes(chapterId: string) {
    return this.prisma.scene.findMany({
      where: { chapterId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * 获取单个场景
   */
  async getScene(id: string) {
    const scene = await this.prisma.scene.findUnique({ where: { id } });
    if (!scene) throw new NotFoundException('场景不存在');
    return scene;
  }

  /**
   * 创建场景
   */
  async createScene(chapterId: string, input: SceneInput) {
    // 自动排序
    const maxOrder = await this.prisma.scene.findFirst({
      where: { chapterId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.scene.create({
      data: {
        chapterId,
        title: input.title,
        content: input.content,
        location: input.location,
        timeOfDay: input.timeOfDay,
        order: input.order ?? (maxOrder?.order ?? 0) + 1,
      },
    });
  }

  /**
   * 更新场景
   */
  async updateScene(id: string, input: Partial<SceneInput>) {
    return this.prisma.scene.update({
      where: { id },
      data: input,
    });
  }

  /**
   * 删除场景
   */
  async deleteScene(id: string) {
    return this.prisma.scene.delete({ where: { id } });
  }

  /**
   * 场景重排序
   */
  async reorderScenes(chapterId: string, sceneIds: string[]) {
    const updates = sceneIds.map((id, index) =>
      this.prisma.scene.update({
        where: { id },
        data: { order: index + 1 },
      }),
    );
    await this.prisma.$transaction(updates);
    return this.getScenes(chapterId);
  }

  /**
   * 从章节内容自动拆分场景（基于分隔符或段落）
   */
  async autoSplitScenes(chapterId: string, content: string): Promise<any[]> {
    // 按常见场景分隔符拆分
    const separators = /(?:\n\s*\*{3,}\s*\n|\n\s*-{3,}\s*\n|\n\s*={3,}\s*\n|【场景[\d一二三四五六七八九十]*】)/;
    const parts = content.split(separators).filter(p => p.trim().length > 0);

    if (parts.length <= 1) {
      // 如果没有明显分隔符，按大段落拆分（连续两个换行）
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      // 每3段合并为一个场景
      const scenes: string[] = [];
      for (let i = 0; i < paragraphs.length; i += 3) {
        scenes.push(paragraphs.slice(i, i + 3).join('\n\n'));
      }
      return this.createScenesFromParts(chapterId, scenes);
    }

    return this.createScenesFromParts(chapterId, parts);
  }

  private async createScenesFromParts(chapterId: string, parts: string[]) {
    // 先删除已有场景
    await this.prisma.scene.deleteMany({ where: { chapterId } });

    const scenes = [];
    for (let i = 0; i < parts.length; i++) {
      const scene = await this.prisma.scene.create({
        data: {
          chapterId,
          title: `场景 ${i + 1}`,
          content: parts[i].trim(),
          order: i + 1,
        },
      });
      scenes.push(scene);
    }
    return scenes;
  }
}
