<script setup lang="ts">
import { ref } from 'vue';
import { useAgentStore } from '@/stores/agent';

const agentStore = useAgentStore();

const emit = defineEmits<{
  (e: 'toggleHistory'): void;
  (e: 'popout'): void;
  (e: 'close'): void;
  (e: 'newSession'): void;
}>();

const showNotifDot = ref(true);
</script>

<template>
  <div class="ai-panel-header flex items-center justify-between px-3 py-2 border-b border-border/80 bg-gradient-to-r from-white via-white to-blue-50/30">
    <div class="flex items-center gap-2 min-w-0">
      <!-- 品牌标识 -->
      <div class="flex items-center gap-1.5">
        <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-sm ring-1 ring-white/20">
          <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L1 12h3v9h6v-6h4v6h6v-9h3L12 2z"/>
          </svg>
        </div>
        <div class="flex flex-col leading-none">
          <span class="text-[11px] font-bold text-text-primary tracking-tight">DeepSeek-R1</span>
          <span class="text-[9px] text-ai-primary font-medium">满血版</span>
        </div>
        <span v-if="showNotifDot" class="relative flex h-2 w-2 ml-0.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      </div>
    </div>

    <div class="flex items-center gap-0.5">
      <!-- 剩余次数 -->
      <div class="flex items-center gap-1 mr-1.5 px-2 py-0.5 rounded-full bg-brand-50/80 border border-brand/10">
        <span class="text-[9px] text-text-muted">剩</span>
        <span class="text-[10px] text-brand font-bold tabular-nums">{{ agentStore.remainingQuota }}</span>
        <span class="text-[9px] text-text-muted">次</span>
      </div>

      <!-- 新建对话 -->
      <button
        @click="emit('newSession')"
        class="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
        title="新建对话"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
        </svg>
      </button>

      <!-- 历史记录 -->
      <button
        @click="emit('toggleHistory')"
        class="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
        title="历史对话"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </button>

      <!-- 弹出窗口 -->
      <button
        @click="emit('popout')"
        class="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
        title="弹出窗口"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
        </svg>
      </button>

      <!-- 关闭 -->
      <button
        @click="emit('close')"
        class="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-red-400 transition-colors"
        title="关闭"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>
</template>
