<script setup lang="ts">
/**
 * TipTap 编辑器组件（TipTapEditor.vue）
 * ============================================
 * 这是文档编辑的核心组件，类似于公司的书写白板
 *
 * 什么是 TipTap？
 * - 一个基于 ProseMirror 的现代富文本编辑器
 * - Notion 和其他流行编辑器都在用
 * - 支持块状内容（Block-based）
 *
 * 核心功能：
 * 1. 富文本编辑 - 支持标题、列表、代码块等
 * 2. 斜杠命令菜单 - 输入 / 唤起命令菜单
 * 3. 浮动工具栏 - 选中文本时显示格式选项
 * 4. 内容变化监听 - 实时通知父组件内容变化
 * 5. 文本选择通知 - 选中文本时通知 AI 模块
 * 6. 外部内容同步 - 响应远程内容更新
 *
 * 什么是 defineProps 和 defineEmits？
 * - Vue 3 的编译时宏，不需要导入
 * - defineProps: 定义组件接收的属性
 * - defineEmits: 定义组件发出的事件
 */

import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
// 引入 TipTap 编辑器核心
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/vue-3';
// 引入 TipTap 官方扩展包
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
// 引入状态管理
import { useDocumentStore } from '@/stores/document';
import { useAiStore } from '@/stores/ai';

/**
 * 定义组件属性（Props）
 * 父组件可以传入这些数据
 */
const props = defineProps<{
  documentId: string;        // 文档 ID
  initialContent?: string;   // 初始内容（JSON 字符串）
}>();

/**
 * 定义组件事件（Emits）
 * 组件内部可以触发这些事件通知父组件
 */
const emit = defineEmits<{
  (e: 'update:content', content: string): void;           // 内容更新事件
  (e: 'selection-change', selection: string): void;     // 选中文本事件
}>();

// 创建状态管理Store
const aiStore = useAiStore();
const documentStore = useDocumentStore();

// ====== 斜杠命令相关状态 ======

// 是否显示斜杠菜单
const showSlashMenu = ref(false);
// 斜杠菜单位置
const slashMenuPosition = ref({ top: 0, left: 0 });
// 斜杠命令过滤关键字
const slashFilter = ref('');
// 标记是否为远程更新（避免协作回环）
const isRemoteUpdate = ref(false);

// 斜杠命令列表
// 每个命令代表一种可插入的块类型
const slashCommands = [
  { id: 'h1', label: 'Heading 1', icon: 'H1', command: 'heading', args: { level: 1 } },
  { id: 'h2', label: 'Heading 2', icon: 'H2', command: 'heading', args: { level: 2 } },
  { id: 'h3', label: 'Heading 3', icon: 'H3', command: 'heading', args: { level: 3 } },
  { id: 'bullet', label: 'Bullet List', icon: '•', command: 'bulletList' },
  { id: 'ordered', label: 'Numbered List', icon: '1.', command: 'orderedList' },
  { id: 'task', label: 'Task List', icon: '☑', command: 'taskList' },
  { id: 'quote', label: 'Quote', icon: '"', command: 'blockquote' },
  { id: 'code', label: 'Code Block', icon: '</>', command: 'codeBlock' },
  { id: 'divider', label: 'Divider', icon: '—', command: 'horizontalRule' },
];

/**
 * 计算属性：过滤后的命令列表
 * 根据用户输入的关键字过滤
 */
const filteredCommands = computed(() => {
  if (!slashFilter.value) return slashCommands;
  const filter = slashFilter.value.toLowerCase();
  return slashCommands.filter(cmd => cmd.label.toLowerCase().includes(filter));
});

// ====== TipTap 编辑器初始化 ======

/**
 * 创建编辑器实例
 * useEditor 是 TipTap 提供的响应式编辑器创建函数
 */
const editor = useEditor({
  // 配置扩展
  extensions: [
    // StarterKit: 包含基础功能（段落、标题、列表等）
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],  // 支持 1-3 级标题
      },
    }),
    // Placeholder: 占位符扩展
    Placeholder.configure({
      placeholder: "输入 / 唤起命令菜单...",
    }),
    // Highlight: 高亮文字
    Highlight,
    // TaskList: 任务列表
    TaskList,
    // TaskItem: 任务项（支持嵌套）
    TaskItem.configure({
      nested: true,
    }),
  ],
  // 初始内容
  content: props.initialContent || '',
  // 编辑器属性配置
  editorProps: {
    attributes: {
      // Tailwind Typography 样式类
      class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px]',
    },
  },
  // 内容更新回调
  onUpdate: ({ editor }) => {
    // 如果是远程更新（避免协作回环），不触发广播
    if (isRemoteUpdate.value) return;
    // 将内容转换为 JSON 字符串发送
    const json = JSON.stringify(editor.getJSON());
    emit('update:content', json);
  },
  // 选区更新回调
  onSelectionUpdate: ({ editor }) => {
    // 获取选中的文本
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    if (text) {
      emit('selection-change', text);
    }
  },
});

/**
 * 监听外部内容变化
 * 当 props.initialContent 变化时更新编辑器
 * 用于同步远程其他用户的修改
 */
watch(() => props.initialContent, (newContent) => {
  if (newContent && editor.value) {
    try {
      const parsed = JSON.parse(newContent);
      // 只有内容不同时才更新
      if (JSON.stringify(editor.value.getJSON()) !== newContent) {
        // 标记为远程更新，阻止 onUpdate 触发广播（避免回环）
        isRemoteUpdate.value = true;
        editor.value.commands.setContent(parsed);
        // 延迟重置标志，确保 onUpdate 已执行
        setTimeout(() => {
          isRemoteUpdate.value = false;
        }, 100);
      }
    } catch {
      // 如果不是 JSON，直接设置为纯文本
      isRemoteUpdate.value = true;
      editor.value.commands.setContent(newContent);
      setTimeout(() => {
        isRemoteUpdate.value = false;
      }, 100);
    }
  }
});

// ====== 键盘事件处理 ======

/**
 * 处理键盘事件（用于斜杠命令）
 * @param event - 键盘事件
 */
function handleKeyDown(event: KeyboardEvent) {
  if (!editor.value) return;

  // 获取光标位置信息
  const { from } = editor.value.state.selection;
  const line = editor.value.state.doc.resolve(from).parent;
  const lineStart = editor.value.state.doc.resolve(from).before();
  const textBefore = editor.value.state.doc.textBetween(lineStart, from);

  // 检查是否触发斜杠命令（在空行输入 /）
  if (event.key === '/' && textBefore.trim() === '') {
    event.preventDefault();
    showSlashMenu.value = true;
    slashFilter.value = '';

    // 计算菜单位置
    const coords = editor.value.view.coordsAtPos(from);
    slashMenuPosition.value = {
      top: coords.bottom + 8,
      left: coords.left,
    };
    return;
  }

  // 处理菜单打开状态
  if (showSlashMenu.value) {
    // ESC 关闭菜单
    if (event.key === 'Escape') {
      showSlashMenu.value = false;
      return;
    }

    // Backspace 删除过滤字符
    if (event.key === 'Backspace' && slashFilter.value) {
      slashFilter.value = slashFilter.value.slice(0, -1);
      return;
    }

    // 方向键导航
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const items = document.querySelectorAll('.slash-command-item');
      const active = document.querySelector('.slash-command-item.active');
      const activeIndex = Array.from(items).indexOf(active as Element);
      const nextIndex = (activeIndex + 1) % items.length;
      (items[nextIndex] as HTMLElement)?.focus();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const items = document.querySelectorAll('.slash-command-item');
      const active = document.querySelector('.slash-command-item.active');
      const activeIndex = Array.from(items).indexOf(active as Element);
      const prevIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
      (items[prevIndex] as HTMLElement)?.focus();
      return;
    }

    // 回车执行命令
    if (event.key === 'Enter') {
      const active = document.querySelector('.slash-command-item.active') as HTMLElement;
      if (active) {
        active.click();
      }
      return;
    }

    // 输入字符时过滤命令
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      slashFilter.value += event.key;
      return;
    }

    // 如果不是命令字符，关闭菜单
    if (!'/'.includes(event.key)) {
      showSlashMenu.value = false;
    }
  }
}

/**
 * 执行斜杠命令
 * @param command - 命令对象
 */
function executeCommand(command: typeof slashCommands[0]) {
  if (!editor.value) return;

  // 删除斜杠字符
  const { from } = editor.value.state.selection;
  const lineStart = editor.value.state.doc.resolve(from).before();

  // 删除该行从行首到光标的所有内容（包括 /）
  editor.value.chain()
    .focus()
    .deleteRange({ from: lineStart, to: from })
    .run();

  // 根据命令类型执行相应操作
  switch (command.command) {
    case 'heading':
      editor.value.chain().focus().toggleHeading(command.args as any).run();
      break;
    case 'bulletList':
      editor.value.chain().focus().toggleBulletList().run();
      break;
    case 'orderedList':
      editor.value.chain().focus().toggleOrderedList().run();
      break;
    case 'taskList':
      editor.value.chain().focus().toggleTaskList().run();
      break;
    case 'blockquote':
      editor.value.chain().focus().toggleBlockquote().run();
      break;
    case 'codeBlock':
      editor.value.chain().focus().toggleCodeBlock().run();
      break;
    case 'horizontalRule':
      editor.value.chain().focus().setHorizontalRule().run();
      break;
  }

  // 关闭菜单并重置过滤
  showSlashMenu.value = false;
  slashFilter.value = '';
}

/**
 * 点击外部关闭斜杠菜单
 * @param event - 点击事件
 */
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  // 如果点击的不是菜单内部
  if (!target.closest('.slash-menu')) {
    showSlashMenu.value = false;
  }
}

// ====== 生命周期 ======

/**
 * 组件挂载时
 * 添加全局键盘和点击监听
 */
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('click', handleClickOutside);
});

/**
 * 组件卸载前
 * 清理监听，销毁编辑器实例
 */
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('click', handleClickOutside);
  editor.value?.destroy();
});

// ====== 暴露给父组件 ======

/**
 * 暴露编辑器实例
 * 让父组件可以直接调用编辑器方法
 * 如：插入内容到编辑器
 */
defineExpose({ editor });
</script>

<template>
  <div class="editor-wrapper relative">
    <!-- Bubble Menu for text selection -->
    <BubbleMenu
      v-if="editor"
      :editor="editor"
      :tippy-options="{ duration: 100 }"
      class="bg-surface-light border border-white/10 rounded-lg shadow-xl flex items-center gap-1 p-1"
    >
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'bg-accent/20': editor.isActive('bold') }"
        class="p-2 hover:bg-white/10 rounded transition-colors text-sm font-medium"
      >
        B
      </button>
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'bg-accent/20': editor.isActive('italic') }"
        class="p-2 hover:bg-white/10 rounded transition-colors text-sm italic"
      >
        I
      </button>
      <button
        @click="editor.chain().focus().toggleHighlight().run()"
        :class="{ 'bg-accent/20': editor.isActive('highlight') }"
        class="p-2 hover:bg-white/10 rounded transition-colors text-sm"
      >
        H
      </button>
      <div class="w-px h-4 bg-white/20 mx-1"></div>
      <button
        @click="aiStore.openPanel()"
        class="px-3 py-1.5 hover:bg-accent/20 rounded transition-colors text-xs text-accent flex items-center gap-1"
      >
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/>
        </svg>
        AI
      </button>
    </BubbleMenu>

    <!-- Editor Content -->
    <EditorContent :editor="editor" class="editor-content" />

    <!-- Slash Command Menu -->
    <Teleport to="body">
      <div
        v-if="showSlashMenu"
        class="slash-menu fixed z-50 bg-surface-light border border-white/10 rounded-xl shadow-2xl w-64 overflow-hidden animate-slide-in"
        :style="{ top: `${slashMenuPosition.top}px`, left: `${slashMenuPosition.left}px` }"
      >
        <div class="p-2 border-b border-white/5">
          <input
            v-model="slashFilter"
            type="text"
            placeholder="搜索命令..."
            class="w-full bg-transparent border-none outline-none text-text-primary placeholder-text-muted text-sm px-2 py-1"
            autofocus
          />
        </div>
        <div class="max-h-64 overflow-y-auto py-1">
          <button
            v-for="(cmd, index) in filteredCommands"
            :key="cmd.id"
            @click="executeCommand(cmd)"
            :class="{ 'active': index === 0 }"
            class="slash-command-item w-full px-3 py-2 flex items-center gap-3 hover:bg-accent/20 transition-colors text-left focus:outline-none focus:bg-accent/20"
          >
            <span class="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-text-secondary font-mono text-sm">
              {{ cmd.icon }}
            </span>
            <span class="text-text-primary text-sm">{{ cmd.label }}</span>
          </button>
          <div v-if="filteredCommands.length === 0" class="px-3 py-4 text-center text-text-muted text-sm">
            No commands found
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.editor-wrapper {
  @apply relative;
}

:deep(.ProseMirror) {
  @apply outline-none;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  @apply text-text-muted float-left h-0 pointer-events-none;
  content: attr(data-placeholder);
}
</style>
