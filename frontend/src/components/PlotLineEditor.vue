<script setup lang="ts">
/**
 * PlotLineEditor.vue — 剧情线全屏编辑器
 *
 * 支持编辑标题、描述、类型，AI 辅助优化剧情设定。
 */
import { ref, computed, watch } from 'vue';
import { useAgentStore, type PlotLine } from '@/stores/agent';

const props = defineProps<{
  plotLine: PlotLine | null;
  bookId: string;
}>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const agentStore = useAgentStore();
const isNew = computed(() => !props.plotLine);

const form = ref({
  title: '',
  description: '',
  type: 'MAIN' as 'MAIN' | 'SUB' | 'CHARACTER',
  // 扩展字段（AI 可补全）
  conflict: '',
  climax: '',
  resolution: '',
  relatedCharacters: '',
});

watch(() => props.plotLine, (pl) => {
  if (pl) {
    form.value = {
      title: pl.title || '', description: pl.description || '', type: pl.type || 'MAIN',
      conflict: '', climax: '', resolution: '', relatedCharacters: '',
    };
  } else {
    form.value = { title: '', description: '', type: 'MAIN', conflict: '', climax: '', resolution: '', relatedCharacters: '' };
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
    const result = await agentStore.assistContent(props.bookId, 'outline', { ...form.value });
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
    if (props.plotLine?.id) {
      await agentStore.updatePlotLine(props.plotLine.id, props.bookId, {
        title: form.value.title,
        description: buildFullDescription(),
        type: form.value.type,
      });
    } else {
      await agentStore.createPlotLine(
        props.bookId,
        form.value.title,
        buildFullDescription(),
        form.value.type,
      );
    }
    emit('saved');
    emit('close');
  } finally {
    saving.value = false;
  }
}

function buildFullDescription(): string {
  const parts: string[] = [];
  if (form.value.description) parts.push(form.value.description);
  if (form.value.conflict) parts.push(`【核心冲突】${form.value.conflict}`);
  if (form.value.climax) parts.push(`【高潮】${form.value.climax}`);
  if (form.value.resolution) parts.push(`【结局走向】${form.value.resolution}`);
  if (form.value.relatedCharacters) parts.push(`【关联角色】${form.value.relatedCharacters}`);
  return parts.join('\n\n');
}

// ===== 删除 =====
async function remove() {
  if (!props.plotLine?.id) return;
  if (!confirm('确定删除此剧情线？')) return;
  await agentStore.deletePlotLine(props.plotLine.id, props.bookId);
  emit('saved');
  emit('close');
}

const typeOptions = [
  { value: 'MAIN', label: '主线', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'SUB', label: '副线', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'CHARACTER', label: '角色线', color: 'bg-purple-100 text-purple-700 border-purple-200' },
];
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
            {{ isNew ? '创建剧情线' : '编辑剧情线' }}
          </h2>
          <!-- 类型标签 -->
          <div class="flex gap-1.5">
            <button v-for="opt in typeOptions" :key="opt.value" @click="form.type = opt.value as any"
              class="px-2.5 py-0.5 text-[11px] rounded-full border transition-all font-medium"
              :class="form.type === opt.value ? opt.color : 'bg-white text-text-muted border-border hover:border-brand/30'">
              {{ opt.label }}
            </button>
          </div>
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
          <button v-if="!isNew" @click="remove" class="px-2.5 py-1.5 text-xs text-danger hover:bg-red-50 rounded-md transition-colors">删除</button>
          <button @click="save" :disabled="saving || !form.title.trim()" class="px-4 py-1.5 text-xs font-medium text-white bg-brand hover:bg-brand-dark rounded-md transition-colors disabled:opacity-40">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>

      <!-- 主体 -->
      <div class="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        <div>
          <label class="pl-label">剧情线标题</label>
          <input v-model="form.title" class="pl-input" placeholder="例：主角复仇之路" />
          <div v-if="aiSuggestions.title" class="pl-suggestion">
            <span class="flex-1 text-green-700">{{ aiSuggestions.title }}</span>
            <button @click="acceptSuggestion('title')" class="pl-sug-accept">采纳</button>
            <button @click="rejectSuggestion('title')" class="pl-sug-reject">忽略</button>
          </div>
        </div>

        <div>
          <label class="pl-label">剧情概述</label>
          <textarea v-model="form.description" rows="4" class="pl-textarea" placeholder="描述这条剧情线的整体走向..."></textarea>
          <div v-if="aiSuggestions.description" class="pl-suggestion">
            <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.description }}</span>
            <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('description')" class="pl-sug-accept">采纳</button><button @click="rejectSuggestion('description')" class="pl-sug-reject">忽略</button></div>
          </div>
        </div>

        <!-- 核心冲突 -->
        <div>
          <label class="pl-label">核心冲突</label>
          <textarea v-model="form.conflict" rows="3" class="pl-textarea" placeholder="这条剧情线的核心矛盾/冲突是什么..."></textarea>
          <div v-if="aiSuggestions.conflict" class="pl-suggestion">
            <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.conflict }}</span>
            <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('conflict')" class="pl-sug-accept">采纳</button><button @click="rejectSuggestion('conflict')" class="pl-sug-reject">忽略</button></div>
          </div>
        </div>

        <!-- 高潮 -->
        <div>
          <label class="pl-label">高潮设计</label>
          <textarea v-model="form.climax" rows="3" class="pl-textarea" placeholder="这条剧情线的高潮部分如何设计..."></textarea>
          <div v-if="aiSuggestions.climax" class="pl-suggestion">
            <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.climax }}</span>
            <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('climax')" class="pl-sug-accept">采纳</button><button @click="rejectSuggestion('climax')" class="pl-sug-reject">忽略</button></div>
          </div>
        </div>

        <!-- 结局走向 -->
        <div>
          <label class="pl-label">结局走向</label>
          <textarea v-model="form.resolution" rows="2" class="pl-textarea" placeholder="这条剧情线最终如何收束..."></textarea>
          <div v-if="aiSuggestions.resolution" class="pl-suggestion">
            <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.resolution }}</span>
            <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('resolution')" class="pl-sug-accept">采纳</button><button @click="rejectSuggestion('resolution')" class="pl-sug-reject">忽略</button></div>
          </div>
        </div>

        <!-- 关联角色 -->
        <div>
          <label class="pl-label">关联角色</label>
          <input v-model="form.relatedCharacters" class="pl-input" placeholder="涉及的主要角色，用逗号分隔" />
          <div v-if="aiSuggestions.relatedCharacters" class="pl-suggestion">
            <span class="flex-1 text-green-700">{{ aiSuggestions.relatedCharacters }}</span>
            <button @click="acceptSuggestion('relatedCharacters')" class="pl-sug-accept">采纳</button>
            <button @click="rejectSuggestion('relatedCharacters')" class="pl-sug-reject">忽略</button>
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
.pl-label { @apply block text-xs font-medium text-text-secondary mb-1.5; }
.pl-input { @apply w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-text-muted transition-colors; }
.pl-textarea { @apply w-full px-3 py-2 text-sm border border-border rounded-lg bg-white resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-text-muted transition-colors; }
.pl-suggestion { @apply mt-1.5 flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs; }
.pl-sug-accept { @apply px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium shrink-0; }
.pl-sug-reject { @apply px-2 py-0.5 text-xs bg-white text-text-muted rounded hover:bg-gray-100 transition-colors shrink-0; }
</style>
