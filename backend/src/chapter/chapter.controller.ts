import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('books/:bookId/chapters')
@UseGuards(JwtAuthGuard)
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Get()
  async findAll(@Param('bookId') bookId: string, @Request() req: any) {
    return this.chapterService.findAllByBook(bookId, req.user.userId);
  }

  @Put('reorder')
  async reorder(
    @Param('bookId') bookId: string,
    @Body() body: { chapters: { id: string; order: number; volumeId?: string | null }[] },
    @Request() req: any,
  ) {
    return this.chapterService.reorder(bookId, req.user.userId, body.chapters || []);
  }

  @Post()
  async create(
    @Param('bookId') bookId: string,
    @Body() body: { title?: string; volumeId?: string },
    @Request() req: any,
  ) {
    return this.chapterService.create(bookId, req.user.userId, body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.chapterService.findOne(id, req.user.userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      content?: string;
      status?: string;
      volumeId?: string | null;
    },
    @Request() req: any,
  ) {
    return this.chapterService.save(id, req.user.userId, body);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string, @Request() req: any) {
    return this.chapterService.publish(id, req.user.userId);
  }

  @Post(':id/schedule')
  async schedule(
    @Param('id') id: string,
    @Body() body: { publishAt: string },
    @Request() req: any,
  ) {
    return this.chapterService.schedule(id, req.user.userId, body.publishAt);
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string, @Request() req: any) {
    return this.chapterService.getHistory(id, req.user.userId);
  }

  @Post(':id/rollback')
  async rollback(
    @Param('id') id: string,
    @Body() body: { versionId: string },
    @Request() req: any,
  ) {
    return this.chapterService.rollback(id, body.versionId, req.user.userId);
  }

  @Post(':id/versions')
  async createVersion(@Param('id') id: string, @Request() req: any) {
    return this.chapterService.createVersion(id, req.user.userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.chapterService.delete(id, req.user.userId);
  }
}
