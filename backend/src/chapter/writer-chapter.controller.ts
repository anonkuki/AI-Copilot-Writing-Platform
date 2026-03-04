import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChapterService } from './chapter.service';

@Controller('chapter')
@UseGuards(JwtAuthGuard)
export class WriterChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Get('history/:chapterId')
  async getHistory(@Param('chapterId') chapterId: string, @Request() req: any) {
    return this.chapterService.getHistory(chapterId, req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.chapterService.findOne(id, req.user.userId);
  }

  @Put('save')
  async save(
    @Body() body: { chapterId?: string; chapter_id?: string; content?: string; title?: string },
    @Request() req: any,
  ) {
    const chapterId = body.chapterId || body.chapter_id;
    return this.chapterService.save(chapterId || '', req.user.userId, {
      content: body.content,
      title: body.title,
    });
  }

  @Post('publish')
  async publish(
    @Body() body: { chapterId?: string; chapter_id?: string },
    @Request() req: any,
  ) {
    const chapterId = body.chapterId || body.chapter_id;
    return this.chapterService.publish(chapterId || '', req.user.userId);
  }

  @Post('schedule')
  async schedule(
    @Body() body: { chapterId?: string; chapter_id?: string; publishAt?: string; publish_at?: string },
    @Request() req: any,
  ) {
    const chapterId = body.chapterId || body.chapter_id;
    const publishAt = body.publishAt || body.publish_at || '';
    return this.chapterService.schedule(chapterId || '', req.user.userId, publishAt);
  }

  @Post('rollback')
  async rollback(
    @Body() body: {
      chapterId?: string;
      chapter_id?: string;
      versionId?: string;
      version_id?: string;
    },
    @Request() req: any,
  ) {
    const chapterId = body.chapterId || body.chapter_id;
    const versionId = body.versionId || body.version_id;
    return this.chapterService.rollback(chapterId || '', versionId || '', req.user.userId);
  }

  @Post('reorder')
  async reorder(
    @Body()
    body: {
      bookId?: string;
      book_id?: string;
      chapters: { id: string; order: number; volumeId?: string | null; volume_id?: string | null }[];
    },
    @Request() req: any,
  ) {
    const bookId = body.bookId || body.book_id || '';
    const chapters = (body.chapters || []).map((item) => ({
      id: item.id,
      order: item.order,
      volumeId: item.volumeId !== undefined ? item.volumeId : item.volume_id,
    }));
    return this.chapterService.reorder(bookId, req.user.userId, chapters);
  }
}
