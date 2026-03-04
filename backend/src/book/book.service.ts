import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BookService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.book.findMany({
      where: { ownerId: userId },
      include: {
        chapters: {
          select: {
            id: true,
            title: true,
            wordCount: true,
            status: true,
            order: true,
            volumeId: true,
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            chapters: true,
            characters: true,
            inspirations: true,
            outlines: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, ownerId: userId },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
        },
        volumes: {
          orderBy: { order: 'asc' },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
            },
          },
        },
        outlines: {
          orderBy: { order: 'asc' },
        },
        characters: {
          orderBy: { createdAt: 'asc' },
        },
        inspirations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('作品不存在');
    }

    return book;
  }

  async create(userId: string, data: { title?: string; description?: string; cover?: string }) {
    return this.prisma.book.create({
      data: {
        title: data.title?.trim() || '未命名作品',
        description: data.description,
        cover: data.cover,
        ownerId: userId,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      cover?: string;
      status?: string;
      wordCount?: number;
    },
  ) {
    await this.ensureOwnership(id, userId);

    const updateData: Prisma.BookUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.cover !== undefined) updateData.cover = data.cover;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.wordCount !== undefined) updateData.wordCount = data.wordCount;

    return this.prisma.book.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string, userId: string) {
    await this.ensureOwnership(id, userId);

    await this.prisma.book.delete({
      where: { id },
    });

    return { success: true };
  }

  async getStats(userId: string) {
    const books = await this.prisma.book.findMany({
      where: { ownerId: userId },
      include: {
        chapters: {
          select: { id: true },
        },
      },
    });

    const totalBooks = books.length;
    const totalWords = books.reduce((sum, book) => sum + book.wordCount, 0);
    const totalChapters = books.reduce((sum, book) => sum + book.chapters.length, 0);
    const serialBooks = books.filter((book) => book.status === 'SERIAL').length;
    const finishedBooks = books.filter((book) => book.status === 'FINISHED').length;

    return {
      totalBooks,
      totalWords,
      totalChapters,
      serialBooks,
      finishedBooks,
    };
  }

  private async ensureOwnership(id: string, userId: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, ownerId: userId },
      select: { id: true },
    });
    if (!book) {
      throw new NotFoundException('作品不存在');
    }
  }
}
