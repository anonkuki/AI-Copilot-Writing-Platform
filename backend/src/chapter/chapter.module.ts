import { Module } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { ChapterController } from './chapter.controller';
import { PrismaService } from '../prisma.service';
import { StatsModule } from '../stats/stats.module';
import { WriterChapterController } from './writer-chapter.controller';

@Module({
  imports: [StatsModule],
  controllers: [ChapterController, WriterChapterController],
  providers: [ChapterService, PrismaService],
  exports: [ChapterService],
})
export class ChapterModule {}
