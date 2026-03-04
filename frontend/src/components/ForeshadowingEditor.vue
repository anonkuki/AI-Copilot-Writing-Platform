<script setup lang="ts">
/**
 * ForeshadowingEditor.vue — 伏笔全屏编辑器
 *
 * 支持编辑标题、内容，管理伏笔状态（待回收/已回收/已废弃），AI 辅助。
 */
import { ref, computed, watch } from 'vue';
import { useAgentStore, type Foreshadowing } from '@/stores/agent';

const props = defineProps<{
  foreshadowing: Foreshadowing | null;
  bookId: string;
  chapterId?: string;
}>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const agentStore = useAgentStore();
const isNew = computed(() => !props.foreshadowing);

const form = ref({
  title: '',
  content: '',
  // 扩展字段（AI 可补全）
  purpose: '',
  resolveHint: '',
  relatedCharacters: '',
});

watch(() => props.foreshadowing, (fs) => {
  if (fs) {
    form.value = {
      title: fs.title || '', content: fs.content || '',
      purpose: '', resolveHint: '', relatedCharacters: '',
    };
  } else {
    form.value = { title: '', content: '', purpose: '', resolveHint: '', relatedCharacters: '' };
  }
}, { immediate: true });

// ===== AI =====
const aiLoading = ref(false);
const aiSuggestions = ref<Record<string, string>>({});

async function runAiAssist() {
  if (aiLoading.value) return;
  aiLoading.value = true;
  aiSuggestions.value = {};
  try {
    const result = await agentStore.assistContent(props.bookId, 'outline', {
      type: 'foreshadowing',
      ...form.value,
    });
    aiSuggestions.value = result;
  } finally {
    aiLoading.value = false;
  }
}

function acceptSuggestion(field: string) {
  if (aiSuggestions.value[field]) {
    (form.value as any)[field] = aiSuggestions.value[field];
    delete aiSuggestions.value[field];
    aiSuggestions.value = { ...aiSuggestions.value };
  }
}

function rejectSuggestion(field: string) {
  delete aiSuggestions.value[field];
  aiSuggestions.value = { ...aiSuggestions.value };
}

function acceptAll() {
  for (const [k, v] of Object.entries(aiSuggestions.value)) {
    (form.value as any)[k] = v;
  }
  aiSuggestions.value = {};
}

const hasSuggestions = computed(() => Object.keys(aiSuggestions.value).length > 0);

// ===== 保存 =====
const saving = ref(false);

async function save() {
  if (!form.value.title?.trim()) return;
  saving.value = true;
  try {
    const fullContent = buildFullContent();
    if (props.foreshadowing?.id) {
      await agentStore.updateForeshadowing(props.foreshadowing.id, props.bookId, {
        title: form.value.title,
        content: fullContent,
      });
    } else {
      await agentStore.createForeshadowing(
        props.bookId,
        form.value.title,
        fullContent,
        props.chapterId,
      );
    }
    emit('saved');
    emit('close');
  } finally {
    saving.value = false;
  }
}

function buildFullContent(): string {
  const parts: string[] = [];
  if (form.value.content) parts.push(form.value.content);
  if (form.value.purpose) parts.push(`【伏笔目的】${form.value.purpose}`);
  if (form.value.resolveHint) parts.push(`【回收暗示】${form.value.resolveHint}`);
  if (form.value.relatedCharacters) parts.push(`【关联角色】${form.value.relatedCharacters}`);
  return parts.join('\n\n');
}

// ===== 状态操作 =====
async function resolve() {
  if (!props.foreshadowing?.id) return;
  await agentStore.resolveForeshadowing(props.foreshadowing.id, props.bookId);
  emit('saved');
  emit('close');
}

async function abandon() {
  if (!props.foreshadowing?.id) return;
  if (!confirm('确定废弃此伏笔？')) return;
  await agentStore.abandonForeshadowing(props.foreshadowing.id, props.bookId);
  emit('saved');
  emit('close');
}

async function remove() {
  if (!props.foreshadowing?.id) return;
  if (!confirm('确定删除此伏笔？')) return;
  await agentStore.deleteForeshadowing(props.foreshadowing.id, props.bookId);
  emit('saved');
  emit('close');
}

const statusLabel = computed(() => {
  if (!props.foreshadowing) return '';
  if (props.foreshadowing.status === 'PENDING') return '待回收';
  if (props.foreshadowing.status === 'RESOLVED') return '已回收';
  return '已废弃';
});

const statusColor = computed(() => {
  if (!props.foreshadowing) return '';
  if (props.foreshadowing.status === 'PENDING') return 'bg-amber-100 text-amber-700';
  if (props.foreshadowing.status === 'RESOLVED') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-500';
});
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="emit('close')">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-editor-in">
      <!-- 顶栏 -->
      <div class="flex items-center justify-between px-6 py-3 border-b border-border bg-surface-secondary shrink-0">
        <div class="flex items-center gap-3">
          <button @click="emit('close')" class="text-text-muted hover:text-text-primary transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
          </button>
          <h2 class="text-base font-semibold text-text-primary">
            {{ isNew ? '创建伏笔' : '编辑伏笔' }}
          </h2>
          <span v-if="!isNew && statusLabel" class="px-2 py-0.5 text-[10px] font-medium rounded-full" :class="statusColor">{{ statusLabel }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button @click="runAiAssist" :disabled="aiLoading"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="aiLoading ? 'bg-brand-50 text-brand cursor-wait' : 'bg-gradient-to-r from-brand to-ai-primary text-white hover:shadow-md'">
            <svg v-if="!aiLoading" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
            <svg v-else class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
            {{ aiLoading ? '分析中...' : 'AI 补全' }}
          </button>
          <button v-if="hasSuggestions" @click="acceptAll" class="px-2.5 py-1.5 text-xs text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors font-medium">全部采纳</button>
          <div class="w-px h-5 bg-border"/>
          <!-- 状态操作 -->
          <template v-if="!isNew && foreshadowing?.status === 'PENDING'">
            <button @click="resolve" class="px-2.5 py-1.5 text-xs text-green-600 hover:bg-green-50 rounded-md transition-colors font-medium">标记回收</button>
            <button @click="abandon" class="px-2.5 py-1.5 text-xs text-amber-600 hover:bg-amber-50 rounded-md transition-colors">废弃</button>
          </template>
          <button v-if="!isNew" @click="remove" class="px-2.5 py-1.5 text-xs text-danger hover:bg-red-50 rounded-md transition-colors">删除</button>
          <button @click="save" :disabled="saving || !form.title.trim()" class="px-4 py-1.5 text-xs font-medium text-white bg-brand hover:bg-brand-dark rounded-md transition-colors disabled:opacity-40">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>

      <!-- 主体 -->
      <div class="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        <div>
          <label class="fs-label">伏笔标题</label>
          <input v-model="form.title" class="fs-input" placeholder="例：神秘信件" />
          <div v-if="aiSuggestions.title" class="fs-suggestion">
            <span class="flex-1 text-green-700">{{ aiSuggestions.title }}</span>
            <button @click="acceptSuggestion('title')" class="fs-sug-accept">采纳</button>
            <button @click="rejectSuggestion('title')" class="fs-sug-reject">忽略</button>
          </div>
        </div>

        <div>
          <label class="fs-label">伏笔内容</label>
          <textarea v-model="form.content" rows="4" class="fs-textarea" placeholder="具体描述伏笔的内容、出现的场景..."></textarea>
          <div v-if="aiSuggestions.content" class="fs-suggestion">
            <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.content }}</span>
            <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('content')" class="fs-sug-accept">采纳</button><button @click="rejectSuggestion('content')" class="fs-sug-reject">忽略</button></div>
          </div>
        </div>

        <div>
          <label class="fs-label">伏笔目的</label>
          <textarea v-model="form.purpose" rows="2" class="fs-textarea" placeholder="这个伏笔在故事中要达到什么效果..."></textarea>
          <div v-if="aiSuggestions.purpose" class="fs-suggestion">
            <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.purpose }}</span>
            <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('purpose')" class="fs-sug-accept">采纳</button><button @click="rejectSuggestion('purpose')" class="fs-sug-reject">忽略</button></div>
          </div>
        </div>

        <div>
          <label class="fs-label">回收暗示</label>
          <textarea v-model="form.resolveHint" rows="2" class="fs-textarea" placeholder="伏笔将在什么场景/章节被回收，如何揭示..."></textarea>
          <div v-if="aiSuggestions.resolveHint" class="fs-suggestion">
            <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.resolveHint }}</span>
            <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('resolveHint')" class="fs-sug-accept">采纳</button><button @click="rejectSuggestion('resolveHint')" class="fs-sug-reject">忽略</button></div>
          </div>
        </div>

        <div>
          <label class="fs-label">关联角色</label>
          <input v-model="form.relatedCharacters" class="fs-input" placeholder="涉及的角色，用逗号分隔" />
          <div v-if="aiSuggestions.relatedCharacters" class="fs-suggestion">
            <span class="flex-1 text-green-700">{{ aiSuggestions.relatedCharacters }}</span>
            <button @click="acceptSuggestion('relatedCharacters')" class="fs-sug-accept">采纳</button>
            <button @click="rejectSuggestion('relatedCharacters')" class="fs-sug-reject">忽略</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes editorIn {
  from { opacity: 0; transform: scale(0.96) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-editor-in { animation: editorIn 0.2s ease-out; }
.fs-label { @apply block text-xs font-medium text-text-secondary mb-1.5; }
.fs-input { @apply w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-text-muted transition-colors; }
.fs-textarea { @apply w-full px-3 py-2 text-sm border border-border rounded-lg bg-white resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-text-muted transition-colors; }
.fs-suggestion { @apply mt-1.5 flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs; }
.fs-sug-accept { @apply px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium shrink-0; }
.fs-sug-reject { @apply px-2 py-0.5 text-xs bg-white text-text-muted rounded hover:bg-gray-100 transition-colors shrink-0; }
</style>
