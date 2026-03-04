import { Body, Controller, Get, Put, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getStats(@Request() req: any, @Query('days') days?: string) {
    const numDays = days ? Math.min(Math.max(parseInt(days, 10) || 7, 1), 90) : 7;
    return this.statsService.getStats(req.user.userId, numDays);
  }

  @Put('update')
  async updateStats(
    @Request() req: any,
    @Body() body: { wordCount: number; date?: string },
  ) {
    return this.statsService.updateStats(req.user.userId, body.wordCount, body.date);
  }
}
