import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AssistantService {
  constructor(private prisma: PrismaService) {}

  // ==================== 大纲管理 ====================

  async getOutlines(bookId: string, userId: string) {
    await this.validateBook(bookId, userId);
    return this.prisma.outline.findMany({
      where: { bookId },
      orderBy: { order: 'asc' },
    });
  }

  async createOutline(bookId: string, userId: string, data: { title: string; content?: string }) {
    await this.validateBook(bookId, userId);
    const maxOrder = await this.prisma.outline.aggregate({
      where: { bookId },
      _max: { order: true },
    });
    return this.prisma.outline.create({
      data: {
        ...data,
        bookId,
        order: (maxOrder._max.order || 0) + 1,
      },
    });
  }

  async updateOutline(id: string, userId: string, data: { title?: string; content?: string; order?: number }) {
    const outline = await this.prisma.outline.findUnique({
      where: { id },
      include: { book: true },
    });
    if (!outline || outline.book.ownerId !== userId) {
      throw new NotFoundException('大纲不存在');
    }
    return this.prisma.outline.update({ where: { id }, data });
  }

  async deleteOutline(id: string, userId: string) {
    const outline = await this.prisma.outline.findUnique({
      where: { id },
      include: { book: true },
    });
    if (!outline || outline.book.ownerId !== userId) {
      throw new NotFoundException('大纲不存在');
    }
    return this.prisma.outline.delete({ where: { id } });
  }

  // ==================== 角色管理 ====================

  async getCharacters(bookId: string, userId: string) {
    await this.validateBook(bookId, userId);
    return this.prisma.character.findMany({
      where: { bookId },
    });
  }

  async createCharacter(bookId: string, userId: string, data: { name: string; role?: string; avatar?: string; bio?: string }) {
    await this.validateBook(bookId, userId);
    return this.prisma.character.create({
      data: { ...data, bookId },
    });
  }

  async updateCharacter(id: string, userId: string, data: { name?: string; role?: string; avatar?: string; bio?: string }) {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: { book: true },
    });
    if (!character || character.book.ownerId !== userId) {
      throw new NotFoundException('角色不存在');
    }
    return this.prisma.character.update({ where: { id }, data });
  }

  async deleteCharacter(id: string, userId: string) {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: { book: true },
    });
    if (!character || character.book.ownerId !== userId) {
      throw new NotFoundException('角色不存在');
    }
    return this.prisma.character.delete({ where: { id } });
  }

  // ==================== 灵感管理 ====================

  async getInspirations(bookId: string, userId: string) {
    await this.validateBook(bookId, userId);
    return this.prisma.inspiration.findMany({
      where: { bookId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInspiration(bookId: string, userId: string, data: { title: string; content: string; tags?: string[] }) {
    await this.validateBook(bookId, userId);
    return this.prisma.inspiration.create({
      data: {
        title: data.title,
        content: data.content,
        tags: JSON.stringify(data.tags || []),
        bookId,
      },
    });
  }

  async updateInspiration(id: string, userId: string, data: { title?: string; content?: string; tags?: string[] }) {
    const inspiration = await this.prisma.inspiration.findUnique({
      where: { id },
      include: { book: true },
    });
    if (!inspiration || inspiration.book.ownerId !== userId) {
      throw new NotFoundException('灵感不存在');
    }
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.tags) updateData.tags = JSON.stringify(data.tags);
    return this.prisma.inspiration.update({ where: { id }, data: updateData });
  }

  async deleteInspiration(id: string, userId: string) {
    const inspiration = await this.prisma.inspiration.findUnique({
      where: { id },
      include: { book: true },
    });
    if (!inspiration || inspiration.book.ownerId !== userId) {
      throw new NotFoundException('灵感不存在');
    }
    return this.prisma.inspiration.delete({ where: { id } });
  }

  // 辅助方法
  private async validateBook(bookId: string, userId: string) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, ownerId: userId },
    });
    if (!book) {
      throw new NotFoundException('书籍不存在');
    }
  }
}
