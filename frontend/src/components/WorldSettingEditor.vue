<script setup lang="ts">
/**
 * WorldSettingEditor.vue — 世界观设定全屏编辑器
 *
 * 点击世界观卡片后弹出此浮层，支持 AI 辅助补全。
 */
import { ref, computed, watch } from 'vue';
import { useAgentStore, type WorldSetting } from '@/stores/agent';

const props = defineProps<{
  setting: WorldSetting | null;
  bookId: string;
}>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const agentStore = useAgentStore();
const isNew = computed(() => !props.setting);

const form = ref({
  genre: '',
  theme: '',
  tone: '',
  targetWordCount: 0,
  // 扩展字段（从 AI 补全中获取）
  powerSystem: '',
  geography: '',
  history: '',
  society: '',
  rules: '',
});

watch(() => props.setting, (s) => {
  if (s) {
    form.value = {
      genre: s.genre || '', theme: s.theme || '', tone: s.tone || '',
      targetWordCount: s.targetWordCount || 0,
      powerSystem: '', geography: '', history: '', society: '', rules: '',
    };
  } else {
    form.value = { genre: '', theme: '', tone: '', targetWordCount: 0, powerSystem: '', geography: '', history: '', society: '', rules: '' };
  }
}, { immediate: true });

// ===== AI 补全 =====
const aiLoading = ref(false);
const aiSuggestions = ref<Record<string, string>>({});

async function runAiAssist() {
  if (aiLoading.value) return;
  aiLoading.value = true;
  aiSuggestions.value = {};
  try {
    const result = await agentStore.assistContent(props.bookId, 'world_setting', { ...form.value });
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

function acceptAllSuggestions() {
  for (const [key, val] of Object.entries(aiSuggestions.value)) {
    (form.value as any)[key] = val;
  }
  aiSuggestions.value = {};
}

const hasSuggestions = computed(() => Object.keys(aiSuggestions.value).length > 0);

// ===== 保存 =====
const saving = ref(false);

async function save() {
  saving.value = true;
  try {
    if (props.setting?.id) {
      await agentStore.updateWorldSetting(props.setting.id, props.bookId, {
        genre: form.value.genre,
        theme: form.value.theme,
        tone: form.value.tone,
        targetWordCount: form.value.targetWordCount || undefined,
      });
    } else {
      await agentStore.createWorldSetting(props.bookId, {
        genre: form.value.genre,
        theme: form.value.theme,
        tone: form.value.tone,
        targetWordCount: form.value.targetWordCount || undefined,
      });
    }
    emit('saved');
    emit('close');
  } finally {
    saving.value = false;
  }
}

// ===== 删除 =====
async function remove() {
  if (!props.setting?.id) return;
  if (!confirm('确定删除此世界观设定？')) return;
  await agentStore.deleteWorldSetting(props.setting.id, props.bookId);
  emit('saved');
  emit('close');
}

const genreOptions = ['玄幻', '仙侠', '都市', '科幻', '游戏', '历史', '悬疑', '奇幻', '军事', '言情', '末世', '其他'];
const toneOptions = ['热血', '轻松', '沉重', '黑暗', '温馨', '讽刺', '幽默', '悬疑', '史诗'];
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="emit('close')">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-editor-in">
      <!-- 顶栏 -->
      <div class="flex items-center justify-between px-6 py-3 border-b border-border bg-surface-secondary shrink-0">
        <div class="flex items-center gap-3">
          <button @click="emit('close')" class="text-text-muted hover:text-text-primary transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
          </button>
          <h2 class="text-base font-semibold text-text-primary">
            {{ isNew ? '创建世界观设定' : '编辑世界观设定' }}
          </h2>
        </div>
        <div class="flex items-center gap-2">
          <button @click="runAiAssist" :disabled="aiLoading"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="aiLoading ? 'bg-brand-50 text-brand cursor-wait' : 'bg-gradient-to-r from-brand to-ai-primary text-white hover:shadow-md'">
            <svg v-if="!aiLoading" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
            <svg v-else class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
            {{ aiLoading ? '分析中...' : 'AI 补全' }}
          </button>
          <button v-if="hasSuggestions" @click="acceptAllSuggestions" class="px-2.5 py-1.5 text-xs text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors font-medium">全部采纳</button>
          <div class="w-px h-5 bg-border"/>
          <button v-if="!isNew" @click="remove" class="px-2.5 py-1.5 text-xs text-danger hover:bg-red-50 rounded-md transition-colors">删除</button>
          <button @click="save" :disabled="saving" class="px-4 py-1.5 text-xs font-medium text-white bg-brand hover:bg-brand-dark rounded-md transition-colors disabled:opacity-40">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>

      <!-- 主体 -->
      <div class="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        <!-- 核心设定 -->
        <section>
          <h3 class="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span class="w-1 h-4 bg-brand rounded-full"></span>核心设定
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="ws-label">题材类型</label>
              <select v-model="form.genre" class="ws-input">
                <option value="" disabled>选择题材</option>
                <option v-for="g in genreOptions" :key="g" :value="g">{{ g }}</option>
              </select>
              <div v-if="aiSuggestions.genre" class="ws-suggestion">
                <span class="flex-1 text-green-700">{{ aiSuggestions.genre }}</span>
                <button @click="acceptSuggestion('genre')" class="ws-sug-accept">采纳</button>
                <button @click="rejectSuggestion('genre')" class="ws-sug-reject">忽略</button>
              </div>
            </div>
            <div>
              <label class="ws-label">叙事风格</label>
              <select v-model="form.tone" class="ws-input">
                <option value="" disabled>选择风格</option>
                <option v-for="t in toneOptions" :key="t" :value="t">{{ t }}</option>
              </select>
              <div v-if="aiSuggestions.tone" class="ws-suggestion">
                <span class="flex-1 text-green-700">{{ aiSuggestions.tone }}</span>
                <button @click="acceptSuggestion('tone')" class="ws-sug-accept">采纳</button>
                <button @click="rejectSuggestion('tone')" class="ws-sug-reject">忽略</button>
              </div>
            </div>
          </div>
          <div class="mt-4">
            <label class="ws-label">主题思想</label>
            <textarea v-model="form.theme" rows="3" class="ws-textarea" placeholder="作品的核心主题和思想内涵..."></textarea>
            <div v-if="aiSuggestions.theme" class="ws-suggestion">
              <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.theme }}</span>
              <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('theme')" class="ws-sug-accept">采纳</button><button @click="rejectSuggestion('theme')" class="ws-sug-reject">忽略</button></div>
            </div>
          </div>
          <div class="mt-4">
            <label class="ws-label">目标总字数</label>
            <input v-model.number="form.targetWordCount" type="number" class="ws-input w-48" placeholder="0" min="0" step="10000" />
          </div>
        </section>

        <!-- 世界架构（AI 可补全这些扩展字段） -->
        <section>
          <h3 class="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span class="w-1 h-4 bg-purple-500 rounded-full"></span>世界架构
            <span class="text-[10px] text-text-muted font-normal ml-1">点击「AI 补全」自动生成</span>
          </h3>
          <div>
            <label class="ws-label">力量体系</label>
            <textarea v-model="form.powerSystem" rows="3" class="ws-textarea" placeholder="描述世界中的力量/修炼/科技体系..."></textarea>
            <div v-if="aiSuggestions.powerSystem" class="ws-suggestion">
              <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.powerSystem }}</span>
              <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('powerSystem')" class="ws-sug-accept">采纳</button><button @click="rejectSuggestion('powerSystem')" class="ws-sug-reject">忽略</button></div>
            </div>
          </div>
          <div class="mt-4">
            <label class="ws-label">地理环境</label>
            <textarea v-model="form.geography" rows="3" class="ws-textarea" placeholder="世界的地理格局、重要地点..."></textarea>
            <div v-if="aiSuggestions.geography" class="ws-suggestion">
              <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.geography }}</span>
              <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('geography')" class="ws-sug-accept">采纳</button><button @click="rejectSuggestion('geography')" class="ws-sug-reject">忽略</button></div>
            </div>
          </div>
          <div class="mt-4">
            <label class="ws-label">社会结构</label>
            <textarea v-model="form.society" rows="3" class="ws-textarea" placeholder="世界的政治体制、社会阶层..."></textarea>
            <div v-if="aiSuggestions.society" class="ws-suggestion">
              <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.society }}</span>
              <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('society')" class="ws-sug-accept">采纳</button><button @click="rejectSuggestion('society')" class="ws-sug-reject">忽略</button></div>
            </div>
          </div>
          <div class="mt-4">
            <label class="ws-label">历史背景</label>
            <textarea v-model="form.history" rows="3" class="ws-textarea" placeholder="世界的重大历史事件..."></textarea>
            <div v-if="aiSuggestions.history" class="ws-suggestion">
              <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.history }}</span>
              <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('history')" class="ws-sug-accept">采纳</button><button @click="rejectSuggestion('history')" class="ws-sug-reject">忽略</button></div>
            </div>
          </div>
          <div class="mt-4">
            <label class="ws-label">特殊规则</label>
            <textarea v-model="form.rules" rows="2" class="ws-textarea" placeholder="世界中的特殊规则或禁忌..."></textarea>
            <div v-if="aiSuggestions.rules" class="ws-suggestion">
              <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.rules }}</span>
              <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('rules')" class="ws-sug-accept">采纳</button><button @click="rejectSuggestion('rules')" class="ws-sug-reject">忽略</button></div>
            </div>
          </div>
        </section>
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

.ws-label { @apply block text-xs font-medium text-text-secondary mb-1.5; }
.ws-input { @apply w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-text-muted transition-colors; }
.ws-textarea { @apply w-full px-3 py-2 text-sm border border-border rounded-lg bg-white resize-none focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-text-muted transition-colors; }
.ws-suggestion { @apply mt-1.5 flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs; }
.ws-sug-accept { @apply px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium shrink-0; }
.ws-sug-reject { @apply px-2 py-0.5 text-xs bg-white text-text-muted rounded hover:bg-gray-100 transition-colors shrink-0; }
</style>
