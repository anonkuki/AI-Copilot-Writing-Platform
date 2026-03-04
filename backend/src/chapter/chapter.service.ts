import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StatsService } from '../stats/stats.service';

interface ChapterUpdatePayload {
  title?: string;
  content?: string;
  status?: string;
  volumeId?: string | null;
}

@Injectable()
export class ChapterService {
  constructor(
    private prisma: PrismaService,
    private statsService: StatsService,
  ) {}

  async findAllByBook(bookId: string, userId: string) {
    await this.assertBookOwner(bookId, userId);

    return this.prisma.chapter.findMany({
      where: { bookId },
      include: {
        volume: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: {
        book: true,
        volume: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 20,
        },
      },
    });

    if (!chapter) {
      throw new NotFoundException('章节不存在');
    }
    if (chapter.book.ownerId !== userId) {
      throw new ForbiddenException('无权限访问该章节');
    }

    return chapter;
  }

  async create(bookId: string, userId: string, data: { title?: string; volumeId?: string }) {
    await this.assertBookOwner(bookId, userId);

    const maxOrder = await this.prisma.chapter.aggregate({
      where: { bookId },
      _max: { order: true },
    });

    return this.prisma.chapter.create({
      data: {
        title: data.title?.trim() || `第${(maxOrder._max.order || 0) + 1}章`,
        bookId,
        volumeId: data.volumeId || null,
        order: (maxOrder._max.order || 0) + 1,
      },
    });
  }

  async update(id: string, userId: string, data: ChapterUpdatePayload) {
    return this.save(id, userId, data);
  }

  async save(id: string, userId: string, data: ChapterUpdatePayload) {
    const chapter = await this.ensureChapterOwner(id, userId);

    if (
      data.title === undefined &&
      data.content === undefined &&
      data.status === undefined &&
      data.volumeId === undefined
    ) {
      throw new BadRequestException('缺少可保存字段');
    }

    const nextContent = data.content ?? chapter.content;
    const nextWordCount = this.calculateWordCount(nextContent);
    const prevWordCount = chapter.wordCount ?? this.calculateWordCount(chapter.content);

    if (data.content !== undefined && data.content !== chapter.content) {
      await this.createHistorySnapshot(chapter.id, chapter.content);
    }

    const updateData: ChapterUpdatePayload & { wordCount?: number } = {};
    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.content !== undefined) {
      updateData.content = data.content;
      updateData.wordCount = nextWordCount;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.volumeId !== undefined) {
      updateData.volumeId = data.volumeId;
    }

    const updated = await this.prisma.chapter.update({
      where: { id },
      data: updateData,
    });

    await this.syncBookWordCount(chapter.bookId);

    const writtenDelta = Math.max(0, nextWordCount - prevWordCount);
    if (writtenDelta > 0) {
      await this.statsService.addWords(userId, writtenDelta);
    }

    return updated;
  }

  async publish(chapterId: string, userId: string) {
    const chapter = await this.ensureChapterOwner(chapterId, userId);

    return this.prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        status: 'PUBLISHED',
      },
    });
  }

  async schedule(chapterId: string, userId: string, publishAt: string) {
    const chapter = await this.ensureChapterOwner(chapterId, userId);

    const scheduledAt = new Date(publishAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('定时发布时间格式不正确');
    }
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('定时发布时间必须晚于当前时间');
    }

    return this.prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        status: 'SCHEDULED',
      },
    });
  }

  async delete(id: string, userId: string) {
    const chapter = await this.ensureChapterOwner(id, userId);

    await this.prisma.chapter.delete({
      where: { id },
    });

    await this.syncBookWordCount(chapter.bookId);

    return { success: true };
  }

  async reorder(
    bookId: string,
    userId: string,
    chapters: { id: string; order: number; volumeId?: string | null }[],
  ) {
    await this.assertBookOwner(bookId, userId);

    if (!Array.isArray(chapters) || chapters.length === 0) {
      throw new BadRequestException('章节排序数据不能为空');
    }

    const ids = chapters.map((c) => c.id);
    const ownedCount = await this.prisma.chapter.count({
      where: {
        id: { in: ids },
        bookId,
      },
    });

    if (ownedCount !== ids.length) {
      throw new BadRequestException('排序数据包含不属于该作品的章节');
    }

    await this.prisma.$transaction(
      chapters.map((item) =>
        this.prisma.chapter.update({
          where: { id: item.id },
          data: {
            order: item.order,
            volumeId: item.volumeId === undefined ? undefined : item.volumeId,
          },
        }),
      ),
    );

    return { success: true };
  }

  async createVersion(chapterId: string, userId: string) {
    const chapter = await this.ensureChapterOwner(chapterId, userId);
    return this.createHistorySnapshot(chapter.id, chapter.content);
  }

  async getHistory(chapterId: string, userId: string) {
    await this.ensureChapterOwner(chapterId, userId);

    return this.prisma.chapterVersion.findMany({
      where: { chapterId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async rollback(chapterId: string, versionId: string, userId: string) {
    const chapter = await this.ensureChapterOwner(chapterId, userId);

    const version = await this.prisma.chapterVersion.findFirst({
      where: { id: versionId, chapterId },
    });
    if (!version) {
      throw new NotFoundException('历史版本不存在');
    }

    await this.createHistorySnapshot(chapter.id, chapter.content);

    const nextWordCount = this.calculateWordCount(version.content);
    const prevWordCount = chapter.wordCount ?? this.calculateWordCount(chapter.content);

    const updated = await this.prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        content: version.content,
        wordCount: nextWordCount,
      },
    });

    await this.syncBookWordCount(chapter.bookId);

    const writtenDelta = Math.max(0, nextWordCount - prevWordCount);
    if (writtenDelta > 0) {
      await this.statsService.addWords(userId, writtenDelta);
    }

    return updated;
  }

  private async assertBookOwner(bookId: string, userId: string) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, ownerId: userId },
      select: { id: true },
    });
    if (!book) {
      throw new NotFoundException('作品不存在');
    }
  }

  private async ensureChapterOwner(chapterId: string, userId: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        book: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!chapter) {
      throw new NotFoundException('章节不存在');
    }
    if (chapter.book.ownerId !== userId) {
      throw new ForbiddenException('无权限操作该章节');
    }

    return chapter;
  }

  private async createHistorySnapshot(chapterId: string, content: string) {
    const maxVersion = await this.prisma.chapterVersion.aggregate({
      where: { chapterId },
      _max: { version: true },
    });

    return this.prisma.chapterVersion.create({
      data: {
        chapterId,
        content,
        version: (maxVersion._max.version || 0) + 1,
      },
    });
  }

  private calculateWordCount(content: string): number {
    if (!content) return 0;

    const text = content.replace(/<[^>]*>/g, '').trim();
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length;

    return chineseChars + englishWords;
  }

  private async syncBookWordCount(bookId: string) {
    const result = await this.prisma.chapter.aggregate({
      where: { bookId },
      _sum: { wordCount: true },
    });

    await this.prisma.book.update({
      where: { id: bookId },
      data: { wordCount: result._sum.wordCount || 0 },
    });
  }
}
