<script setup lang="ts">
/**
 * AI 面板组件（AiPanel.vue）
 * ============================================
 * 这是 AI 助手的控制面板，类似于 AI 部门的办公室
 *
 * 核心功能：
 * 1. 快捷操作按钮 - 续写、改进、纠错、总结
 * 2. 问答输入 - 用户可以向 AI 提问
 * 3. 显示 AI 响应 - 展示 AI 的回答和建议
 * 4. 应用建议 - 将 AI 建议插入到文档中
 * 5. 选中文本显示 - 显示当前选中的文本作为上下文
 *
 * 什么是 Teleport？
 * - Vue 3 的内置组件
 * - 可以将组件渲染到 DOM 的任意位置
 * - 这里用于将 AI 面板渲染到 body，不受父容器限制
 */

import { ref, watch } from 'vue';
import { useAiStore } from '@/stores/ai';
import { useDocumentStore } from '@/stores/document';

// 创建 Store 实例
const aiStore = useAiStore();
const documentStore = useDocumentStore();

// 问答输入框的值
const question = ref('');
// 当前正在执行的命令
const activeCommand = ref<string | null>(null);

/**
 * 向 AI 提问
 * 调用 AI store 的 askQuestion 方法
 */
async function askAi() {
  // 验证输入
  if (!question.value.trim() || !documentStore.currentDocument) return;

  // 调用 AI 接口
  await aiStore.askQuestion(
    documentStore.currentDocument.id,
    question.value,
    aiStore.selectedText
  );
  // 清空输入框
  question.value = '';
}

/**
 * 执行快捷命令
 * @param command - 命令类型（continue/improve/fix/summarize）
 */
async function runCommand(command: string) {
  if (!documentStore.currentDocument) return;

  // 设置当前命令状态
  activeCommand.value = command;
  // 调用 AI 建议接口
  await aiStore.getSuggestion(
    documentStore.currentDocument.id,
    aiStore.selectedText,
    command
  );
  // 清除命令状态
  activeCommand.value = null;
}

/**
 * 应用 AI 建议
 * 将建议的文本插入到编辑器中
 * @param text - 要插入的文本
 */
function applySuggestion(text: string) {
  // 设置待插入的文本
  // DocumentView 会监听这个状态并在编辑器中插入文本
  aiStore.setPendingInsert(text);
  // 关闭面板
  aiStore.closePanel();
  // 清除响应记录
  aiStore.clearResponse();
}

/**
 * 处理键盘事件
 * ESC 键关闭面板
 * @param event - 键盘事件
 */
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    aiStore.closePanel();
  }
}
</script>

<template>
  <!--
    Teleport: 将面板传送到 body 标签
    这样面板不会受到父容器 overflow 等限制
  -->
  <Teleport to="body">
    <!-- 面板主体 -->
    <Transition name="slide">
      <div
        v-if="aiStore.isPanelOpen"
        class="fixed right-0 top-0 h-full w-80 bg-surface-light border-l border-white/10 shadow-2xl z-40 flex flex-col"
        @keydown="handleKeyDown"
      >
        <!-- 面板头部 -->
        <div class="flex items-center justify-between p-4 border-b border-white/10">
          <div class="flex items-center gap-2">
            <!-- AI 图标 -->
            <div class="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/>
              </svg>
            </div>
            <span class="font-semibold text-text-primary">AI 助手</span>
          </div>
          <!-- 关闭按钮 -->
          <button
            @click="aiStore.closePanel()"
            class="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 快捷操作 -->
        <div class="p-4 border-b border-white/10">
          <p class="text-xs text-text-muted mb-3 uppercase tracking-wider">快捷操作</p>
          <div class="grid grid-cols-2 gap-2">
            <!-- 续写按钮 -->
            <button
              @click="runCommand('continue')"
              :disabled="aiStore.isLoading"
              class="px-3 py-2 bg-white/5 hover:bg-accent/20 border border-white/5 hover:border-accent/30 rounded-lg text-sm text-text-primary transition-all text-left flex items-center gap-2 disabled:opacity-50"
            >
              <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              续写
            </button>
            <!-- 改进按钮 -->
            <button
              @click="runCommand('improve')"
              :disabled="aiStore.isLoading"
              class="px-3 py-2 bg-white/5 hover:bg-accent/20 border border-white/5 hover:border-accent/30 rounded-lg text-sm text-text-primary transition-all text-left flex items-center gap-2 disabled:opacity-50"
            >
              <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              改进
            </button>
            <!-- 纠错按钮 -->
            <button
              @click="runCommand('fix')"
              :disabled="aiStore.isLoading"
              class="px-3 py-2 bg-white/5 hover:bg-accent/20 border border-white/5 hover:border-accent/30 rounded-lg text-sm text-text-primary transition-all text-left flex items-center gap-2 disabled:opacity-50"
            >
              <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              语法纠错
            </button>
            <!-- 总结按钮 -->
            <button
              @click="runCommand('summarize')"
              :disabled="aiStore.isLoading"
              class="px-3 py-2 bg-white/5 hover:bg-accent/20 border border-white/5 hover:border-accent/30 rounded-lg text-sm text-text-primary transition-all text-left flex items-center gap-2 disabled:opacity-50"
            >
              <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              总结
            </button>
          </div>
        </div>

        <!-- 选中文本显示 -->
        <div v-if="aiStore.selectedText" class="p-4 border-b border-white/10">
          <p class="text-xs text-text-muted mb-2 uppercase tracking-wider">选中文本</p>
          <p class="text-sm text-text-secondary bg-white/5 p-2 rounded-lg line-clamp-3">
            "{{ aiStore.selectedText }}"
          </p>
        </div>

        <!-- 问答输入 -->
        <div class="p-4 border-b border-white/10">
          <div class="relative">
            <textarea
              v-model="question"
              @keydown.enter.exact.prevent="askAi"
              placeholder="向 AI 提问..."
              rows="2"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent/50"
            ></textarea>
            <!-- 发送按钮 -->
            <button
              @click="askAi"
              :disabled="!question.trim() || aiStore.isLoading"
              class="absolute right-2 bottom-2 p-1.5 bg-accent hover:bg-accent-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="!aiStore.isLoading" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <svg v-else class="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- AI 响应显示 -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- 加载状态 -->
          <div v-if="aiStore.isLoading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
          </div>

          <!-- AI 响应内容 -->
          <div v-else-if="aiStore.lastResponse">
            <!-- AI 回答 -->
            <div v-if="aiStore.lastResponse.answer" class="mb-4">
              <p class="text-xs text-text-muted mb-2 uppercase tracking-wider">回复</p>
              <div class="bg-white/5 rounded-lg p-3 text-sm text-text-primary leading-relaxed">
                {{ aiStore.lastResponse.answer }}
              </div>
            </div>

            <!-- AI 建议 -->
            <div v-if="aiStore.lastResponse.suggestion" class="mb-4">
              <p class="text-xs text-text-muted mb-2 uppercase tracking-wider">建议</p>
              <div class="bg-gradient-to-r from-accent/10 to-purple-500/10 rounded-lg p-3 border border-accent/20">
                <p class="text-sm text-text-primary leading-relaxed">
                  {{ aiStore.lastResponse.suggestion }}
                </p>
                <!-- 应用建议按钮 -->
                <button
                  @click="applySuggestion(aiStore.lastResponse.suggestion!)"
                  class="mt-3 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs rounded-lg transition-colors"
                >
                  应用建议
                </button>
              </div>
            </div>

            <!-- 建议列表 -->
            <div v-if="aiStore.lastResponse.suggestions?.length">
              <p class="text-xs text-text-muted mb-2 uppercase tracking-wider">建议列表</p>
              <div class="space-y-2">
                <button
                  v-for="(suggestion, index) in aiStore.lastResponse.suggestions"
                  :key="index"
                  @click="applySuggestion(suggestion)"
                  class="w-full text-left p-2 bg-white/5 hover:bg-accent/20 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>
          </div>

          <!-- 空状态提示 -->
          <div v-else class="text-center py-8 text-text-muted text-sm">
            <p>选中文本或使用快捷操作</p>
            <p class="mt-1">获取 AI 辅助</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 背景遮罩层 -->
    <Transition name="fade">
      <div
        v-if="aiStore.isPanelOpen"
        class="fixed inset-0 bg-black/50 z-30"
        @click="aiStore.closePanel()"
      ></div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 滑入滑出动画 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
