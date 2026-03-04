import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class VolumeService {
  constructor(private prisma: PrismaService) {}

  // 获取书籍的所有卷
  async findAllByBook(bookId: string, userId: string) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, ownerId: userId },
    });

    if (!book) {
      throw new NotFoundException('书籍不存在');
    }

    return this.prisma.volume.findMany({
      where: { bookId },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  // 创建卷
  async create(bookId: string, userId: string, data: { title?: string }) {
    const book = await this.prisma.book.findFirst({
      where: { id: bookId, ownerId: userId },
    });

    if (!book) {
      throw new NotFoundException('书籍不存在');
    }

    const maxOrder = await this.prisma.volume.aggregate({
      where: { bookId },
      _max: { order: true },
    });

    return this.prisma.volume.create({
      data: {
        title: data.title || '未命名卷',
        bookId,
        order: (maxOrder._max.order || 0) + 1,
      },
    });
  }

  // 更新卷
  async update(id: string, userId: string, data: { title?: string }) {
    const volume = await this.prisma.volume.findUnique({
      where: { id },
      include: { book: true },
    });

    if (!volume || volume.book.ownerId !== userId) {
      throw new NotFoundException('卷不存在');
    }

    return this.prisma.volume.update({
      where: { id },
      data,
    });
  }

  // 删除卷
  async delete(id: string, userId: string) {
    const volume = await this.prisma.volume.findUnique({
      where: { id },
      include: { book: true },
    });

    if (!volume || volume.book.ownerId !== userId) {
      throw new NotFoundException('卷不存在');
    }

    // 将卷内的章节移到无卷状态
    await this.prisma.chapter.updateMany({
      where: { volumeId: id },
      data: { volumeId: null },
    });

    return this.prisma.volume.delete({
      where: { id },
    });
  }
}
