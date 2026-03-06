import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户写作统计
   * @param days 查询天数，默认 7 天
   */
  async getStats(userId: string, days: number = 7) {
    const today = this.getDateOnly(new Date());

    // 今日统计
    const todayStat = await this.prisma.writingStat.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    // 总字数（所有天累计）
    const totalResult = await this.prisma.writingStat.aggregate({
      where: { userId },
      _sum: { wordCount: true },
    });

    // 活跃天数
    const activeDaysResult = await this.prisma.writingStat.count({
      where: { userId, wordCount: { gt: 0 } },
    });

    // 最近 N 天明细
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));

    const recentStats = await this.prisma.writingStat.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: today },
      },
      orderBy: { date: 'asc' },
    });

    // 构建最近N天数据（补齐空天）
    const recentDays: Array<{ date: string; wordCount: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const stat = recentStats.find((s) => s.date.toISOString().split('T')[0] === dateStr);
      recentDays.push({
        date: dateStr,
        wordCount: stat?.wordCount || 0,
      });
    }

    // 计算连续天数
    const streakDays = await this.calculateStreak(userId, today);

    return {
      todayWordCount: todayStat?.wordCount || 0,
      totalWordCount: totalResult._sum.wordCount || 0,
      streakDays,
      activeDays: activeDaysResult,
      last7Days: recentDays,
      today: today.toISOString().split('T')[0],
    };
  }

  /**
   * 更新某天的写作统计（绝对值设置）
   */
  async updateStats(userId: string, wordCount: number, dateStr?: string) {
    const date = dateStr ? this.getDateOnly(new Date(dateStr)) : this.getDateOnly(new Date());

    const stat = await this.prisma.writingStat.upsert({
      where: { userId_date: { userId, date } },
      update: { wordCount },
      create: { userId, date, wordCount },
    });

    return stat;
  }

  /**
   * 增量添加字数（章节保存时调用）
   */
  async addWords(userId: string, delta: number) {
    if (delta <= 0) return;

    const today = this.getDateOnly(new Date());

    await this.prisma.writingStat.upsert({
      where: { userId_date: { userId, date: today } },
      update: { wordCount: { increment: delta } },
      create: { userId, date: today, wordCount: delta },
    });
  }

  /**
   * 计算连续写作天数（从今天往前数）
   */
  private async calculateStreak(userId: string, today: Date): Promise<number> {
    // 获取所有有字数的日期，按日期降序
    const stats = await this.prisma.writingStat.findMany({
      where: { userId, wordCount: { gt: 0 } },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    if (stats.length === 0) return 0;

    let streak = 0;
    const checkDate = new Date(today);

    for (const stat of stats) {
      const statDateStr = stat.date.toISOString().split('T')[0];
      const checkDateStr = checkDate.toISOString().split('T')[0];

      if (statDateStr === checkDateStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (statDateStr < checkDateStr) {
        // 有间断，停止计数
        break;
      }
    }

    return streak;
  }

  /**
   * 将日期归零到当天 00:00:00 UTC，用于唯一约束
   */
  private getDateOnly(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}
