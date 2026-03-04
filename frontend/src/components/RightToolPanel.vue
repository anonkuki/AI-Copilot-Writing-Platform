<script setup lang="ts">
import { computed, watch } from 'vue';
import { marked } from 'marked';
import { useAgentStore, type RightPanelTool } from '../stores/agent';

const props = defineProps<{
  tool: RightPanelTool;
  bookId: string;
  chapterId?: string;
  chapterTitle?: string;
  content: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'apply', data: { oldContent: string; newContent: string }): void;
}>();

const agentStore = useAgentStore();

const toolMeta = computed(() => {
  const map: Record<RightPanelTool, { label: string; shortLabel: string; description: string; color: string; bgColor: string; action: string }> = {
    proofread: { label: '校对助手', shortLabel: '校', description: '全面检查语法、逻辑、叙事一致性', color: 'text-blue-600', bgColor: 'bg-blue-50', action: '开始校对' },
    spelling:  { label: '拼字检查', shortLabel: '字', description: '检测错别字、同音字、用词不当', color: 'text-emerald-600', bgColor: 'bg-emerald-50', action: '开始检查' },
    outline:   { label: '大纲', shortLabel: '纲', description: '章节大纲', color: 'text-brand', bgColor: 'bg-brand-50', action: '生成大纲' },
    character: { label: '角色', shortLabel: '角', description: '角色管理', color: 'text-brand', bgColor: 'bg-brand-50', action: '分析角色' },
    setting:   { label: '设定', shortLabel: '设', description: '世界观设定', color: 'text-brand', bgColor: 'bg-brand-50', action: '检查设定' },
    inspiration: { label: '灵感生成', shortLabel: '灵', description: '基于当前内容激发创作灵感', color: 'text-yellow-600', bgColor: 'bg-yellow-50', action: '获取灵感' },
    writing:   { label: '妙笔润色', shortLabel: '润', description: '文学润色、修辞增强、风格优化', color: 'text-purple-600', bgColor: 'bg-purple-50', action: '开始润色' },
  };
  return map[props.tool];
});

const isLoading = computed(() => agentStore.toolAnalysisResult?.loading === true);
const hasResult = computed(() => agentStore.toolAnalysisResult && !agentStore.toolAnalysisResult.loading && agentStore.toolAnalysisResult.content);
const resultContent = computed(() => agentStore.toolAnalysisResult?.content || '');
const resultItems = computed(() => agentStore.toolAnalysisResult?.items || []);

// 统计问题数量
const issueStats = computed(() => {
  const items = resultItems.value;
  return {
    errors: items.filter(i => i.type === 'error').length,
    warnings: items.filter(i => i.type === 'warning').length,
    suggestions: items.filter(i => i.type === 'suggestion' || i.type === 'info').length,
    total: items.length,
  };
});

function renderMarkdown(md: string): string {
  if (!md) return '';
  return marked.parse(md, { breaks: true, gfm: true }) as string;
}

function runAnalysis() {
  if (!props.content.trim()) return;
  agentStore.runToolAnalysis(
    props.bookId,
    props.tool,
    props.content,
    props.chapterId,
    props.chapterTitle,
  );
}

function handleClose() {
  agentStore.clearToolAnalysis();
  emit('close');
}

// 切换工具时清除结果
watch(() => props.tool, () => {
  agentStore.clearToolAnalysis();
});
</script>

<template>
  <div class="flex flex-col h-full bg-white">
    <!-- 头部 -->
    <div class="px-3 py-2.5 border-b border-border flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <span
          class="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
          :class="[toolMeta.bgColor, toolMeta.color]"
        >{{ toolMeta.shortLabel }}</span>
        <div>
          <h3 class="text-sm font-bold text-text-primary leading-tight">{{ toolMeta.label }}</h3>
          <p class="text-[10px] text-text-muted leading-tight">{{ toolMeta.description }}</p>
        </div>
      </div>
      <button @click="handleClose" class="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-all">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- 内容检测信息 -->
    <div v-if="!hasResult && !isLoading" class="px-3 py-3 border-b border-border/50 bg-surface-secondary/50">
      <div class="flex items-center gap-2 text-xs text-text-secondary mb-2">
        <svg class="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
        <span v-if="chapterTitle">{{ chapterTitle }}</span>
        <span v-else>当前章节</span>
        <span class="text-text-muted">·</span>
        <span class="text-text-muted">{{ content.length }} 字</span>
      </div>
      <button
        @click="runAnalysis"
        :disabled="!content.trim()"
        class="w-full py-2.5 rounded-xl text-xs font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-30"
        :class="toolMeta.color.replace('text-', 'bg-').replace('-600', '-500') + ' text-white hover:opacity-90 shadow-sm hover:shadow-md'"
      >
        {{ toolMeta.action }}
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="px-3 py-2 border-b border-border/50 bg-surface-secondary/30 shrink-0">
      <div class="flex items-center gap-2">
        <div class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="toolMeta.bgColor"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5" :class="toolMeta.bgColor"></span>
        </div>
        <span class="text-xs font-medium" :class="toolMeta.color">{{ toolMeta.label }}分析中…</span>
        <button @click="agentStore.cancelToolAnalysis()" class="ml-auto text-[10px] text-text-muted hover:text-red-400 transition-colors">取消</button>
      </div>
    </div>

    <!-- 问题统计栏 -->
    <div v-if="hasResult && issueStats.total > 0" class="px-3 py-2 border-b border-border/50 bg-surface-secondary/30 shrink-0">
      <div class="flex items-center gap-3 text-[10px]">
        <span v-if="issueStats.errors > 0" class="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-100">
          <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
          错误 {{ issueStats.errors }}
        </span>
        <span v-if="issueStats.warnings > 0" class="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full border border-yellow-100">
          <span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
          警告 {{ issueStats.warnings }}
        </span>
        <span v-if="issueStats.suggestions > 0" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          建议 {{ issueStats.suggestions }}
        </span>
      </div>
    </div>

    <!-- 分析结果 -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <!-- 空状态 -->
      <div v-if="!hasResult && !isLoading" class="flex flex-col items-center justify-center h-full text-center px-6">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold mb-3 shadow-sm" :class="[toolMeta.bgColor, toolMeta.color]">
          {{ toolMeta.shortLabel }}
        </div>
        <p class="text-xs text-text-muted leading-relaxed">
          点击上方按钮，AI 将自动分析<br/>当前章节内容并给出详细报告
        </p>
      </div>

      <!-- 流式输出 / 最终结果 -->
      <div v-if="hasResult || isLoading" class="p-3">
        <div
          class="ai-message prose prose-xs max-w-none text-xs leading-relaxed text-text-primary"
          v-html="renderMarkdown(resultContent)"
        ></div>

        <!-- 重新分析按钮 -->
        <div v-if="hasResult" class="mt-4 pt-3 border-t border-border/50 flex gap-2">
          <button
            @click="runAnalysis"
            class="flex-1 py-2 rounded-lg text-xs font-medium border transition-all active:scale-[0.98]"
            :class="toolMeta.color + ' border-current/20 hover:bg-current/5'"
          >
            重新分析
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
