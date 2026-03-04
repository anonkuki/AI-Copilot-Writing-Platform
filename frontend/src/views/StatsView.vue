<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useBookStore } from '@/stores/book';

const bookStore = useBookStore();
const activeRange = ref<'week' | 'month'>('week');

onMounted(async () => {
  try {
    await Promise.all([
      bookStore.fetchStats(),
      bookStore.fetchWritingStats(7),
    ]);
  } catch (err) {
    console.error('加载统计失败:', err);
  }
});

// 切换时间范围时重新拉取数据
watch(activeRange, async (range) => {
  const days = range === 'month' ? 30 : 7;
  await bookStore.fetchWritingStats(days);
});

const todayWords = computed(() => bookStore.writingStats?.todayWordCount || 0);
const totalWords = computed(() => bookStore.writingStats?.totalWordCount || 0);
const streakDays = computed(() => bookStore.writingStats?.streakDays || 0);
const activeDays = computed(() => bookStore.writingStats?.activeDays || 0);
const chartDays = computed(() => bookStore.writingStats?.last7Days || []);
const stats = computed(() => bookStore.stats);

// 图表数据
const maxWordCount = computed(() => {
  const max = Math.max(...chartDays.value.map(d => d.wordCount), 1);
  return Math.ceil(max / 100) * 100; // 取整到百
});

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getBarHeight(wordCount: number) {
  if (maxWordCount.value === 0) return '4px';
  return `${Math.max(4, (wordCount / maxWordCount.value) * 160)}px`;
}

function getWeekday(dateStr: string) {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return '周' + days[new Date(dateStr).getDay()];
}

function formatBigNumber(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString();
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-auto bg-surface-secondary">
    <div class="max-w-content mx-auto w-full px-6 py-6">
      <!-- 页面标题 -->
      <h1 class="text-xl font-bold text-text-primary mb-6">码字统计</h1>

      <!-- 核心数据卡片 -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-5 shadow-card">
          <div class="text-xs text-text-muted mb-2">今日码字</div>
          <div class="text-3xl font-bold text-brand tabular-nums">{{ formatBigNumber(todayWords) }}</div>
          <div class="text-xs text-text-muted mt-1">字</div>
        </div>

        <div class="bg-white rounded-xl p-5 shadow-card">
          <div class="text-xs text-text-muted mb-2">累计码字</div>
          <div class="text-3xl font-bold text-text-primary tabular-nums">{{ formatBigNumber(totalWords) }}</div>
          <div class="text-xs text-text-muted mt-1">字</div>
        </div>

        <div class="bg-white rounded-xl p-5 shadow-card">
          <div class="text-xs text-text-muted mb-2">连续写作</div>
          <div class="text-3xl font-bold text-success tabular-nums">{{ streakDays }}</div>
          <div class="text-xs text-text-muted mt-1">天</div>
        </div>

        <div class="bg-white rounded-xl p-5 shadow-card">
          <div class="text-xs text-text-muted mb-2">活跃天数</div>
          <div class="text-3xl font-bold text-ai-primary tabular-nums">{{ activeDays }}</div>
          <div class="text-xs text-text-muted mt-1">天</div>
        </div>
      </div>

      <!-- 码字趋势 -->
      <div class="bg-white rounded-xl shadow-card p-5 mb-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-sm font-semibold text-text-primary">码字趋势</h2>
          <div class="flex items-center gap-1 text-xs">
            <button
              @click="activeRange = 'week'"
              class="px-3 py-1 rounded-md transition-colors"
              :class="activeRange === 'week' ? 'bg-brand text-white' : 'text-text-muted hover:bg-surface-hover'"
            >近 7 天</button>
            <button
              @click="activeRange = 'month'"
              class="px-3 py-1 rounded-md transition-colors"
              :class="activeRange === 'month' ? 'bg-brand text-white' : 'text-text-muted hover:bg-surface-hover'"
            >近 30 天</button>
          </div>
        </div>

        <!-- 柱状图 -->
        <div class="flex items-end gap-1 h-[200px] px-2 overflow-x-auto">
          <div
            v-for="day in chartDays"
            :key="day.date"
            class="flex flex-col items-center"
            :class="activeRange === 'month' ? 'min-w-[16px] flex-1' : 'flex-1'"
          >
            <!-- 数值（30天模式只在柱子较高时显示） -->
            <div v-if="activeRange === 'week' || day.wordCount > 0" class="text-xs text-text-muted mb-1 tabular-nums whitespace-nowrap">
              {{ day.wordCount > 0 ? (activeRange === 'month' ? (day.wordCount >= 1000 ? (day.wordCount / 1000).toFixed(0) + 'k' : day.wordCount) : day.wordCount.toLocaleString()) : '' }}
            </div>
            <!-- 柱 -->
            <div
              class="w-full rounded-t-md transition-all duration-300"
              :class="[day.wordCount > 0 ? 'bg-brand' : 'bg-surface-tertiary', activeRange === 'month' ? 'max-w-[20px]' : 'max-w-[48px]']"
              :style="{ height: getBarHeight(day.wordCount) }"
            />
            <!-- 日期标签 -->
            <div class="mt-2 text-center" v-if="activeRange === 'week' || chartDays.indexOf(day) % 5 === 0 || chartDays.indexOf(day) === chartDays.length - 1">
              <div class="text-xs text-text-muted" v-if="activeRange === 'week'">{{ getWeekday(day.date) }}</div>
              <div class="text-[10px] text-text-muted/70">{{ formatDate(day.date) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 作品统计 -->
      <div class="bg-white rounded-xl shadow-card p-5" v-if="stats">
        <h2 class="text-sm font-semibold text-text-primary mb-4">作品概况</h2>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-surface-secondary rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-text-primary">{{ stats.totalBooks }}</div>
            <div class="text-xs text-text-muted mt-1">作品总数</div>
          </div>
          <div class="bg-surface-secondary rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-text-primary">{{ stats.totalChapters }}</div>
            <div class="text-xs text-text-muted mt-1">章节总数</div>
          </div>
          <div class="bg-surface-secondary rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-success">{{ stats.serialBooks }}</div>
            <div class="text-xs text-text-muted mt-1">连载中</div>
          </div>
          <div class="bg-surface-secondary rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-ai-primary">{{ stats.finishedBooks }}</div>
            <div class="text-xs text-text-muted mt-1">已完结</div>
          </div>
        </div>
      </div>

      <!-- 写作建议 -->
      <div class="bg-gradient-to-r from-brand-50 to-blue-50 rounded-xl p-5 mt-6">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/>
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-text-primary">AI 写作建议</h3>
            <p class="text-xs text-text-secondary mt-1 leading-relaxed">
              <template v-if="streakDays >= 7">恭喜你已连续写作 {{ streakDays }} 天！保持节奏，灵感不断~</template>
              <template v-else-if="streakDays > 0">你已连续写作 {{ streakDays }} 天，继续坚持，养成良好写作习惯</template>
              <template v-else-if="todayWords > 0">今天已经开始写作了，继续保持！</template>
              <template v-else>今天还没开始写作哦，点击左侧「全部书籍」开始创作吧</template>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
