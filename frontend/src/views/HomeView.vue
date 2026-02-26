<script setup lang="ts">
/**
 * 首页视图组件（HomeView.vue）
 * ============================================
 * 这是应用的主页面，显示文档列表，类似于公司的前台大厅
 *
 * 核心功能：
 * 1. 显示所有文档列表 - 以卡片形式展示
 * 2. 创建新文档 - 点击按钮创建
 * 3. 删除文档 - 悬停后显示删除按钮
 * 4. 打开文档 - 点击卡片进入编辑页面
 * 5. 显示欢迎指南 - 首次访问时显示使用说明
 * 6. 自动创建示例 - 如果没有文档，自动创建一个示例文档
 *
 * 什么是视图组件（View）？
 * - Vue Router 管理的页面级别的组件
 * - 每个路由对应一个视图组件
 * - 负责展示完整的页面内容
 */

import { ref, onMounted } from 'vue';
// 引入 Vue Router，用于编程式导航（跳转页面）
import { useRouter } from 'vue-router';
// 引入文档状态管理
import { useDocumentStore } from '@/stores/document';

// 创建路由实例
const router = useRouter();
// 创建文档 store 实例
const documentStore = useDocumentStore();

// 是否正在创建文档（用于禁用按钮）
const isCreating = ref(false);
// 是否显示操作指南
const showGuide = ref(true);

/**
 * 组件挂载时执行
 * 类似于组件的"出生"事件
 */
onMounted(async () => {
  // 获取所有文档
  await documentStore.fetchDocuments();
  // 如果没有文档，自动创建一个示例文档
  if (documentStore.documents.length === 0) {
    await createSampleDocument();
  }
});

/**
 * 创建新文档
 * 1. 调用 store 创建文档
 * 2. 跳转到文档编辑页面
 */
async function createNewDocument() {
  isCreating.value = true;  // 开始创建，显示加载状态
  const doc = await documentStore.createDocument('未命名文档');
  isCreating.value = false;  // 创建完成

  if (doc) {
    // 跳转到文档编辑页面
    router.push(`/document/${doc.id}`);
  }
}

/**
 * 创建示例文档
 * 首次使用时自动创建，包含使用说明
 */
async function createSampleDocument() {
  // 创建文档
  const doc = await documentStore.createDocument('欢迎使用 AI+ 文档');
  if (doc) {
    // 构建示例内容（TipTap JSON 格式）
    const sampleContent = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: '欢迎使用 AI+ 智能文档系统' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '这是一个类似 Notion 的智能文档编辑器，支持以下功能：' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: '实时协作' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: '输入 / 唤起命令菜单' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'AI 智能辅助写作' }] }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '📝 使用技巧' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '在空白行输入斜杠 / 可唤起命令菜单，支持添加标题、列表、代码块等。' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '选中文本后，会出现 AI 按钮，点击可获取智能建议！' }]
        }
      ]
    });
    // 更新文档内容
    await documentStore.updateDocument(doc.id, { content: sampleContent });
    // 跳转到示例文档
    router.push(`/document/${doc.id}`);
  }
}

/**
 * 打开文档
 * 跳转到文档编辑页面
 * @param id - 文档 ID
 */
function openDocument(id: string) {
  router.push(`/document/${id}`);
}

/**
 * 删除文档
 * 1. 阻止事件冒泡（避免触发卡片点击）
 * 2. 确认删除
 * 3. 调用 store 删除
 * @param id - 文档 ID
 * @param event - 点击事件
 */
async function deleteDocument(id: string, event: Event) {
  event.stopPropagation();  // 阻止冒泡
  if (confirm('确定要删除这个文档吗？')) {
    await documentStore.deleteDocument(id);
  }
}

/**
 * 格式化日期
 * 将 ISO 格式日期转换为中文友好格式
 * @param dateString - ISO 格式的日期字符串
 */
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * 关闭操作指南
 */
function closeGuide() {
  showGuide.value = false;
}
</script>

<template>
  <!--
    页面容器
    min-h-screen: 最小高度占满整个屏幕
    p-8: 内边距 2rem
  -->
  <div class="min-h-screen p-8">

    <!-- 操作提示（首次访问时显示） -->
    <div v-if="showGuide" class="max-w-4xl mx-auto mb-6">
      <!-- 渐变背景卡片 -->
      <div class="bg-gradient-to-r from-accent/20 to-purple-500/20 border border-accent/30 rounded-xl p-4">
        <div class="flex items-start justify-between">
          <!-- 指南内容 -->
          <div class="flex items-start gap-3">
            <!-- 图标 -->
            <div class="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <!-- 指南文本 -->
            <div>
              <h3 class="font-semibold text-text-primary">🎉 欢迎使用 AI+ 文档系统</h3>
              <ul class="text-sm text-text-secondary mt-2 space-y-1">
                <li>• <strong>新建文档</strong>：点击右上角"新建文档"按钮</li>
                <li>• <strong>命令菜单</strong>：在空白行输入 <code class="bg-white/10 px-1 rounded">/</code> 唤起</li>
                <li>• <strong>AI 辅助</strong>：选中文本后点击浮动工具栏的 AI 按钮</li>
                <li>• <strong>右侧面板</strong>：点击右上角 AI 按钮打开完整 AI 面板</li>
              </ul>
            </div>
          </div>
          <!-- 关闭按钮 -->
          <button @click="closeGuide" class="text-text-muted hover:text-text-primary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="max-w-4xl mx-auto">
      <!-- 页面头部 -->
      <header class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-text-primary">AI+ 智能文档</h1>
          <p class="text-text-secondary mt-1">您的智能文档工作空间</p>
        </div>
        <!-- 新建文档按钮 -->
        <button
          @click="createNewDocument"
          :disabled="isCreating"
          class="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ isCreating ? '创建中...' : '新建文档' }}
        </button>
      </header>

      <!-- 加载状态 -->
      <div v-if="documentStore.isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>

      <!-- 文档列表（网格布局） -->
      <div v-else-if="documentStore.documents.length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <!-- 文档卡片 -->
        <div
          v-for="doc in documentStore.documents"
          :key="doc.id"
          @click="openDocument(doc.id)"
          class="group bg-surface-light/50 hover:bg-surface-light border border-white/5 hover:border-accent/30 rounded-xl p-5 cursor-pointer transition-all duration-200"
        >
          <!-- 卡片头部 -->
          <div class="flex items-start justify-between">
            <!-- 文档标题 -->
            <h3 class="font-semibold text-lg text-text-primary truncate flex-1">
              {{ doc.title || '未命名' }}
            </h3>
            <!-- 删除按钮（悬停时显示） -->
            <button
              @click="deleteDocument(doc.id, $event)"
              class="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition-all"
            >
              <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <!-- 更新时间 -->
          <p class="text-text-secondary text-sm mt-2 line-clamp-2">
            最后编辑于 {{ formatDate(doc.updatedAt) }}
          </p>
          <!-- 版本标签 -->
          <div class="flex items-center gap-2 mt-3">
            <span class="text-xs text-text-muted bg-white/5 px-2 py-1 rounded">
              v{{ doc.version }}
            </span>
          </div>
        </div>
      </div>

      <!-- 空状态（没有文档时） -->
      <div v-else class="text-center py-16">
        <!-- 空状态图标 -->
        <div class="w-20 h-20 mx-auto mb-6 bg-surface-light/30 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <!-- 空状态文本 -->
        <h2 class="text-xl font-semibold text-text-primary mb-2">暂无文档</h2>
        <p class="text-text-secondary mb-6">创建您的第一个文档开始使用</p>
        <button
          @click="createNewDocument"
          class="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-all duration-200"
        >
          创建文档
        </button>
      </div>
    </div>
  </div>
</template>
