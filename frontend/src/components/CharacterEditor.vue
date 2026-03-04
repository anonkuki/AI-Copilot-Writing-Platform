<script setup lang="ts">
/**
 * CharacterEditor.vue — VS Code 风格的全屏角色编辑器
 *
 * 点击角色列表中的角色后弹出此浮层，
 * 类似 VS Code 打开文件的体验。
 */
import { ref, computed, watch } from 'vue';
import { useAgentStore, type CharacterProfile } from '@/stores/agent';

const props = defineProps<{
  character: CharacterProfile | null;
  bookId: string;
}>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const agentStore = useAgentStore();
const isNew = computed(() => !props.character);

// ===== 表单 =====
const form = ref({
  name: '', role: '', personality: '', background: '', motivation: '', fear: '',
  strength: '', weakness: '', currentGoal: '', longTermGoal: '', arc: '',
  appearance: '', catchphrase: '',
});

watch(() => props.character, (c) => {
  if (c) {
    form.value = {
      name: c.name || '', role: c.role || '', personality: c.personality || '',
      background: c.background || '', motivation: c.motivation || '', fear: c.fear || '',
      strength: c.strength || '', weakness: c.weakness || '',
      currentGoal: c.currentGoal || '', longTermGoal: c.longTermGoal || '',
      arc: c.arc || '', appearance: c.appearance || '', catchphrase: c.catchphrase || '',
    };
  } else {
    form.value = { name: '', role: '', personality: '', background: '', motivation: '', fear: '', strength: '', weakness: '', currentGoal: '', longTermGoal: '', arc: '', appearance: '', catchphrase: '' };
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
    const result = await agentStore.assistContent(props.bookId, 'character', { ...form.value });
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
  if (!form.value.name.trim()) return;
  saving.value = true;
  try {
    if (props.character?.characterId) {
      await agentStore.updateCharacterProfile(props.character.characterId, form.value);
    } else {
      await agentStore.createCharacter(props.bookId, {
        name: form.value.name,
        role: form.value.role,
        personality: form.value.personality,
        background: form.value.background,
        goal: form.value.currentGoal,
        strength: form.value.strength,
        weakness: form.value.weakness,
      });
    }
    await agentStore.loadContext(props.bookId);
    emit('saved');
    emit('close');
  } finally {
    saving.value = false;
  }
}

// ===== 删除 =====
async function remove() {
  if (!props.character) return;
  if (!confirm(`确定删除角色「${props.character.name}」？此操作不可撤销。`)) return;
  await agentStore.deleteCharacter(props.character.characterId, props.bookId);
  emit('saved');
  emit('close');
}

// ===== 分区导航 =====
const sections = [
  { id: 'basic', label: '基本信息' },
  { id: 'personality', label: '性格心理' },
  { id: 'ability', label: '能力成长' },
  { id: 'story', label: '背景故事' },
];
const activeSection = ref('basic');

function scrollToSection(id: string) {
  activeSection.value = id;
  document.getElementById(`char-section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 字段 label 映射
const fieldLabels: Record<string, string> = {
  name: '名称', role: '定位', personality: '性格', background: '背景', motivation: '动机',
  fear: '恐惧', strength: '优势', weakness: '劣势', currentGoal: '当前目标',
  longTermGoal: '长期目标', arc: '角色弧光', appearance: '外貌', catchphrase: '口头禅',
};

const roleOptions = ['主角', '配角', '反派', '龙套', '导师', '盟友'];
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="emit('close')">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-editor-in">
      <!-- 顶栏 -->
      <div class="flex items-center justify-between px-6 py-3 border-b border-border bg-surface-secondary shrink-0">
        <div class="flex items-center gap-3 min-w-0">
          <button @click="emit('close')" class="text-text-muted hover:text-text-primary transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
          </button>
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="{
              'bg-red-400': form.role === '主角', 'bg-blue-400': form.role === '配角',
              'bg-purple-400': form.role === '反派', 'bg-gray-400': !form.role || form.role === '龙套',
              'bg-amber-400': form.role === '导师', 'bg-green-400': form.role === '盟友',
            }"></span>
            <h2 class="text-base font-semibold text-text-primary truncate">
              {{ isNew ? '创建角色' : `编辑 · ${form.name || '未命名'}` }}
            </h2>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="runAiAssist"
            :disabled="aiLoading"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="aiLoading ? 'bg-brand-50 text-brand cursor-wait' : 'bg-gradient-to-r from-brand to-ai-primary text-white hover:shadow-md'"
          >
            <svg v-if="!aiLoading" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
            <svg v-else class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
            {{ aiLoading ? 'AI 分析中...' : 'AI 补全' }}
          </button>
          <button v-if="hasSuggestions" @click="acceptAllSuggestions" class="px-2.5 py-1.5 text-xs text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors font-medium">
            全部采纳
          </button>
          <div class="w-px h-5 bg-border"/>
          <button v-if="!isNew" @click="remove" class="px-2.5 py-1.5 text-xs text-danger hover:bg-red-50 rounded-md transition-colors">删除</button>
          <button @click="save" :disabled="saving || !form.name.trim()" class="px-4 py-1.5 text-xs font-medium text-white bg-brand hover:bg-brand-dark rounded-md transition-colors disabled:opacity-40">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>

      <!-- 主体 -->
      <div class="flex flex-1 min-h-0">
        <!-- 左侧导航 -->
        <nav class="w-36 shrink-0 border-r border-border bg-surface-secondary/50 py-3 px-2 space-y-0.5">
          <button
            v-for="sec in sections" :key="sec.id"
            @click="scrollToSection(sec.id)"
            class="w-full text-left px-3 py-2 rounded-md text-xs transition-colors"
            :class="activeSection === sec.id ? 'bg-brand-50 text-brand font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'"
          >{{ sec.label }}</button>
        </nav>

        <!-- 右侧编辑区 -->
        <div class="flex-1 overflow-y-auto px-8 py-6 space-y-8">

          <!-- 基本信息 -->
          <section id="char-section-basic">
            <h3 class="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span class="w-1 h-4 bg-brand rounded-full"></span>基本信息
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="ce-label">角色名称 <span class="text-danger">*</span></label>
                <input v-model="form.name" class="ce-input" placeholder="输入角色名称" />
                <div v-if="aiSuggestions.name" class="ce-suggestion">
                  <span class="flex-1 truncate text-green-700">{{ aiSuggestions.name }}</span>
                  <button @click="acceptSuggestion('name')" class="ce-sug-accept">采纳</button>
                  <button @click="rejectSuggestion('name')" class="ce-sug-reject">忽略</button>
                </div>
              </div>
              <div>
                <label class="ce-label">角色定位</label>
                <select v-model="form.role" class="ce-input">
                  <option value="" disabled>选择定位</option>
                  <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
                </select>
                <div v-if="aiSuggestions.role" class="ce-suggestion">
                  <span class="flex-1 truncate text-green-700">{{ aiSuggestions.role }}</span>
                  <button @click="acceptSuggestion('role')" class="ce-sug-accept">采纳</button>
                  <button @click="rejectSuggestion('role')" class="ce-sug-reject">忽略</button>
                </div>
              </div>
            </div>
            <div class="mt-4">
              <label class="ce-label">外貌描述</label>
              <textarea v-model="form.appearance" rows="2" class="ce-textarea" placeholder="描述角色外貌特征..."></textarea>
              <div v-if="aiSuggestions.appearance" class="ce-suggestion">
                <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.appearance }}</span>
                <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('appearance')" class="ce-sug-accept">采纳</button><button @click="rejectSuggestion('appearance')" class="ce-sug-reject">忽略</button></div>
              </div>
            </div>
            <div class="mt-4">
              <label class="ce-label">口头禅</label>
              <input v-model="form.catchphrase" class="ce-input" placeholder="角色标志性口头禅" />
              <div v-if="aiSuggestions.catchphrase" class="ce-suggestion">
                <span class="flex-1 truncate text-green-700">{{ aiSuggestions.catchphrase }}</span>
                <button @click="acceptSuggestion('catchphrase')" class="ce-sug-accept">采纳</button>
                <button @click="rejectSuggestion('catchphrase')" class="ce-sug-reject">忽略</button>
              </div>
            </div>
          </section>

          <!-- 性格心理 -->
          <section id="char-section-personality">
            <h3 class="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span class="w-1 h-4 bg-purple-500 rounded-full"></span>性格与心理
            </h3>
            <div>
              <label class="ce-label">性格描述</label>
              <textarea v-model="form.personality" rows="3" class="ce-textarea" placeholder="详细描述角色的性格特点..."></textarea>
              <div v-if="aiSuggestions.personality" class="ce-suggestion">
                <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.personality }}</span>
                <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('personality')" class="ce-sug-accept">采纳</button><button @click="rejectSuggestion('personality')" class="ce-sug-reject">忽略</button></div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label class="ce-label">核心动机</label>
                <textarea v-model="form.motivation" rows="2" class="ce-textarea" placeholder="推动角色行动的核心驱动力..."></textarea>
                <div v-if="aiSuggestions.motivation" class="ce-suggestion">
                  <span class="flex-1 text-green-700 text-xs">{{ aiSuggestions.motivation }}</span>
                  <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('motivation')" class="ce-sug-accept">采纳</button><button @click="rejectSuggestion('motivation')" class="ce-sug-reject">忽略</button></div>
                </div>
              </div>
              <div>
                <label class="ce-label">内心恐惧</label>
                <textarea v-model="form.fear" rows="2" class="ce-textarea" placeholder="角色最深层的恐惧..."></textarea>
                <div v-if="aiSuggestions.fear" class="ce-suggestion">
                  <span class="flex-1 text-green-700 text-xs">{{ aiSuggestions.fear }}</span>
                  <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('fear')" class="ce-sug-accept">采纳</button><button @click="rejectSuggestion('fear')" class="ce-sug-reject">忽略</button></div>
                </div>
              </div>
            </div>
          </section>

          <!-- 能力成长 -->
          <section id="char-section-ability">
            <h3 class="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span class="w-1 h-4 bg-green-500 rounded-full"></span>能力与成长
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="ce-label">优势与能力</label>
                <textarea v-model="form.strength" rows="2" class="ce-textarea" placeholder="角色的核心优势..."></textarea>
                <div v-if="aiSuggestions.strength" class="ce-suggestion">
                  <span class="flex-1 text-green-700 text-xs">{{ aiSuggestions.strength }}</span>
                  <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('strength')" class="ce-sug-accept">采纳</button><button @click="rejectSuggestion('strength')" class="ce-sug-reject">忽略</button></div>
                </div>
              </div>
              <div>
                <label class="ce-label">劣势与短板</label>
                <textarea v-model="form.weakness" rows="2" class="ce-textarea" placeholder="角色的弱点..."></textarea>
                <div v-if="aiSuggestions.weakness" class="ce-suggestion">
                  <span class="flex-1 text-green-700 text-xs">{{ aiSuggestions.weakness }}</span>
                  <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('weakness')" class="ce-sug-accept">采纳</button><button @click="rejectSuggestion('weakness')" class="ce-sug-reject">忽略</button></div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label class="ce-label">当前目标</label>
                <input v-model="form.currentGoal" class="ce-input" placeholder="角色当前追求的目标" />
                <div v-if="aiSuggestions.currentGoal" class="ce-suggestion">
                  <span class="flex-1 truncate text-green-700">{{ aiSuggestions.currentGoal }}</span>
                  <button @click="acceptSuggestion('currentGoal')" class="ce-sug-accept">采纳</button>
                  <button @click="rejectSuggestion('currentGoal')" class="ce-sug-reject">忽略</button>
                </div>
              </div>
              <div>
                <label class="ce-label">长期目标</label>
                <input v-model="form.longTermGoal" class="ce-input" placeholder="角色的终极目标" />
                <div v-if="aiSuggestions.longTermGoal" class="ce-suggestion">
                  <span class="flex-1 truncate text-green-700">{{ aiSuggestions.longTermGoal }}</span>
                  <button @click="acceptSuggestion('longTermGoal')" class="ce-sug-accept">采纳</button>
                  <button @click="rejectSuggestion('longTermGoal')" class="ce-sug-reject">忽略</button>
                </div>
              </div>
            </div>
            <div class="mt-4">
              <label class="ce-label">角色弧光</label>
              <textarea v-model="form.arc" rows="3" class="ce-textarea" placeholder="角色在故事中的成长变化轨迹..."></textarea>
              <div v-if="aiSuggestions.arc" class="ce-suggestion">
                <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.arc }}</span>
                <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('arc')" class="ce-sug-accept">采纳</button><button @click="rejectSuggestion('arc')" class="ce-sug-reject">忽略</button></div>
              </div>
            </div>
          </section>

          <!-- 背景故事 -->
          <section id="char-section-story">
            <h3 class="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span class="w-1 h-4 bg-amber-500 rounded-full"></span>背景故事
            </h3>
            <div>
              <label class="ce-label">背景描述</label>
              <textarea v-model="form.background" rows="6" class="ce-textarea" placeholder="角色的成长经历、家庭环境、过往事件..."></textarea>
              <div v-if="aiSuggestions.background" class="ce-suggestion">
                <span class="flex-1 text-green-700 text-xs leading-relaxed">{{ aiSuggestions.background }}</span>
                <div class="flex gap-1 shrink-0"><button @click="acceptSuggestion('background')" class="ce-sug-accept">采纳</button><button @click="rejectSuggestion('background')" class="ce-sug-reject">忽略</button></div>
              </div>
            </div>
          </section>

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

.ce-label {
  @apply block text-xs font-medium text-text-secondary mb-1.5;
}
.ce-input {
  @apply w-full px-3 py-2 text-sm border border-border rounded-lg bg-white
    focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30
    placeholder:text-text-muted transition-colors;
}
.ce-textarea {
  @apply w-full px-3 py-2 text-sm border border-border rounded-lg bg-white resize-none
    focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30
    placeholder:text-text-muted transition-colors;
}
.ce-suggestion {
  @apply mt-1.5 flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs animate-fade-in;
}
.ce-sug-accept {
  @apply px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium shrink-0;
}
.ce-sug-reject {
  @apply px-2 py-0.5 text-xs bg-white text-text-muted rounded hover:bg-gray-100 transition-colors shrink-0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fadeIn 0.15s ease-out; }
</style>
