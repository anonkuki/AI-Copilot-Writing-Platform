<script setup lang="ts">
/**
 * RelationshipGraph.vue — 角色关系网 SVG 力导向图
 *
 * 零依赖力导向布局：节点=角色，边=关系，支持拖拽、添加/删除关系。
 * 点击节点打开角色编辑器，点击连线可编辑/删除关系。
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useAgentStore, type CharacterProfile, type CharacterRelationship } from '@/stores/agent';

const props = defineProps<{ bookId: string }>();
const emit = defineEmits<{
  (e: 'openCharacter', char: CharacterProfile): void;
}>();

const agentStore = useAgentStore();

// ===== 画布 =====
const svgRef = ref<SVGSVGElement | null>(null);
const width = ref(600);
const height = ref(400);

// ===== 力导向节点 =====
interface GraphNode {
  id: string;         // characterId or character.id
  characterId: string;
  name: string;
  role: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  description?: string;
  status?: string;
}

const nodes = ref<GraphNode[]>([]);
const edges = ref<GraphEdge[]>([]);

function buildGraph() {
  const chars = agentStore.characters;
  const rels = agentStore.relationships;
  const cx = width.value / 2, cy = height.value / 2;

  // 保持已有位置
  const oldPositions = new Map<string, { x: number; y: number }>();
  for (const n of nodes.value) oldPositions.set(n.id, { x: n.x, y: n.y });

  nodes.value = chars.map((c, i) => {
    const id = c.characterId || c.id;
    const old = oldPositions.get(id);
    const angle = (2 * Math.PI * i) / Math.max(chars.length, 1);
    const r = Math.min(width.value, height.value) * 0.3;
    return {
      id,
      characterId: c.characterId || c.id,
      name: c.name,
      role: c.role || '',
      x: old?.x ?? cx + r * Math.cos(angle),
      y: old?.y ?? cy + r * Math.sin(angle),
      vx: 0, vy: 0, fx: null, fy: null,
    };
  });

  edges.value = rels.map(r => ({
    id: r.id,
    source: r.fromId,
    target: r.toId,
    type: r.type,
    description: r.description,
    status: r.status,
  }));
}

// ===== 力模拟 =====
let animFrame = 0;
let running = false;

function simulate() {
  if (!running) return;
  const ns = nodes.value;
  const es = edges.value;
  const alpha = 0.3;
  const nodeMap = new Map(ns.map(n => [n.id, n]));

  // 斥力 (Coulomb)
  for (let i = 0; i < ns.length; i++) {
    for (let j = i + 1; j < ns.length; j++) {
      let dx = ns[j].x - ns[i].x;
      let dy = ns[j].y - ns[i].y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const repulse = 8000 / (dist * dist);
      const fx = (dx / dist) * repulse;
      const fy = (dy / dist) * repulse;
      ns[i].vx -= fx; ns[i].vy -= fy;
      ns[j].vx += fx; ns[j].vy += fy;
    }
  }

  // 引力 (弹簧)
  const idealLen = 140;
  for (const e of es) {
    const s = nodeMap.get(e.source);
    const t = nodeMap.get(e.target);
    if (!s || !t) continue;
    let dx = t.x - s.x;
    let dy = t.y - s.y;
    let dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = (dist - idealLen) * 0.05;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    s.vx += fx; s.vy += fy;
    t.vx -= fx; t.vy -= fy;
  }

  // 居中力
  const cx = width.value / 2, cy = height.value / 2;
  for (const n of ns) {
    n.vx += (cx - n.x) * 0.005;
    n.vy += (cy - n.y) * 0.005;
  }

  // 应用速度
  for (const n of ns) {
    if (n.fx !== null) { n.x = n.fx; n.vx = 0; }
    else { n.vx *= 0.6; n.x += n.vx * alpha; }
    if (n.fy !== null) { n.y = n.fy; n.vy = 0; }
    else { n.vy *= 0.6; n.y += n.vy * alpha; }
    // 边界约束
    n.x = Math.max(40, Math.min(width.value - 40, n.x));
    n.y = Math.max(40, Math.min(height.value - 40, n.y));
  }

  animFrame = requestAnimationFrame(simulate);
}

function startSimulation() {
  if (running) return;
  running = true;
  animFrame = requestAnimationFrame(simulate);
}

function stopSimulation() {
  running = false;
  cancelAnimationFrame(animFrame);
}

// ===== 拖拽 =====
const dragging = ref<GraphNode | null>(null);

function onNodeMouseDown(node: GraphNode, ev: MouseEvent) {
  ev.preventDefault();
  dragging.value = node;
  node.fx = node.x;
  node.fy = node.y;
  startSimulation();
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(ev: MouseEvent) {
  if (!dragging.value || !svgRef.value) return;
  const rect = svgRef.value.getBoundingClientRect();
  dragging.value.fx = ev.clientX - rect.left;
  dragging.value.fy = ev.clientY - rect.top;
}

function onMouseUp() {
  if (dragging.value) {
    dragging.value.fx = null;
    dragging.value.fy = null;
    dragging.value = null;
  }
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  // 让它继续收敛一会
  setTimeout(stopSimulation, 2000);
}

// ===== 节点颜色 =====
function nodeColor(role: string): string {
  if (role === '主角') return '#ef4444';
  if (role === '配角') return '#3b82f6';
  if (role === '反派') return '#8b5cf6';
  return '#9ca3af';
}

// ===== 边颜色 =====
function edgeColor(status?: string): string {
  if (status === 'POSITIVE') return '#22c55e';
  if (status === 'NEGATIVE') return '#ef4444';
  if (status === 'COMPLEX') return '#f59e0b';
  return '#94a3b8';
}

// ===== 连线路径（曲线，避免重叠） =====
function edgePath(e: GraphEdge): string {
  const s = nodes.value.find(n => n.id === e.source);
  const t = nodes.value.find(n => n.id === e.target);
  if (!s || !t) return '';
  // 检查是否有反向边
  const hasReverse = edges.value.some(
    other => other.id !== e.id && other.source === e.target && other.target === e.source
  );
  if (!hasReverse) return `M${s.x},${s.y} L${t.x},${t.y}`;
  // 有双向边，用曲线
  const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
  const dx = t.x - s.x, dy = t.y - s.y;
  const offset = 20;
  const cx1 = mx - dy / Math.sqrt(dx*dx+dy*dy) * offset;
  const cy1 = my + dx / Math.sqrt(dx*dx+dy*dy) * offset;
  return `M${s.x},${s.y} Q${cx1},${cy1} ${t.x},${t.y}`;
}

// ===== 边标签位置 =====
function edgeLabelPos(e: GraphEdge): { x: number; y: number } {
  const s = nodes.value.find(n => n.id === e.source);
  const t = nodes.value.find(n => n.id === e.target);
  if (!s || !t) return { x: 0, y: 0 };
  return { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 - 6 };
}

// ===== 选中状态 =====
const selectedEdge = ref<GraphEdge | null>(null);
const selectedNode = ref<GraphNode | null>(null);

function onNodeClick(node: GraphNode) {
  if (dragging.value) return;
  selectedNode.value = node;
  selectedEdge.value = null;
}

function onNodeDblClick(node: GraphNode) {
  const char = agentStore.characters.find(c => (c.characterId || c.id) === node.id);
  if (char) emit('openCharacter', char);
}

function onEdgeClick(edge: GraphEdge) {
  selectedEdge.value = edge;
  selectedNode.value = null;
}

function onBgClick() {
  selectedEdge.value = null;
  selectedNode.value = null;
}

// ===== 添加关系 =====
const showAddRelModal = ref(false);
const addRelForm = ref({ fromId: '', toId: '', type: '', description: '', status: 'POSITIVE' });
const relationTypes = ['朋友', '恋人', '敌人', '师生', '亲人', '同伴', '上下级', '对手', '盟友'];

function openAddRelModal() {
  addRelForm.value = { fromId: '', toId: '', type: '', description: '', status: 'POSITIVE' };
  if (selectedNode.value) addRelForm.value.fromId = selectedNode.value.id;
  showAddRelModal.value = true;
}

async function createRel() {
  const f = addRelForm.value;
  if (!f.fromId || !f.toId || !f.type) return;
  await agentStore.createRelationship(props.bookId, f.fromId, f.toId, f.type, f.description || undefined, f.status);
  showAddRelModal.value = false;
  buildGraph();
  startSimulation();
  setTimeout(stopSimulation, 2000);
}

// ===== 删除关系 =====
async function deleteSelectedEdge() {
  if (!selectedEdge.value) return;
  if (!confirm(`确定删除「${edgeLabel(selectedEdge.value)}」关系？`)) return;
  await agentStore.deleteRelationship(selectedEdge.value.id, props.bookId);
  selectedEdge.value = null;
  buildGraph();
}

function edgeLabel(e: GraphEdge): string {
  const s = nodes.value.find(n => n.id === e.source);
  const t = nodes.value.find(n => n.id === e.target);
  return `${s?.name || '?'} → ${e.type} → ${t?.name || '?'}`;
}

// ===== AI 建议 =====
interface RelSuggestion {
  fromName: string; toName: string; type: string; description: string; status: string;
  accepted?: boolean;
}
const aiLoading = ref(false);
const aiSuggestions = ref<RelSuggestion[]>([]);

async function runAiSuggest() {
  if (aiLoading.value || agentStore.characters.length < 2) return;
  aiLoading.value = true;
  aiSuggestions.value = [];
  try {
    const result = await agentStore.suggestRelationships(props.bookId);
    aiSuggestions.value = result.map(r => ({ ...r, accepted: false }));
  } finally {
    aiLoading.value = false;
  }
}

async function acceptSuggestion(sug: RelSuggestion) {
  // 从角色名找 ID
  const fromChar = agentStore.characters.find(c => c.name === sug.fromName);
  const toChar = agentStore.characters.find(c => c.name === sug.toName);
  if (!fromChar || !toChar) return;
  const fromId = fromChar.characterId || fromChar.id;
  const toId = toChar.characterId || toChar.id;
  await agentStore.createRelationship(props.bookId, fromId, toId, sug.type, sug.description, sug.status);
  sug.accepted = true;
  aiSuggestions.value = [...aiSuggestions.value];
  buildGraph();
  startSimulation();
  setTimeout(stopSimulation, 2000);
}

function dismissSuggestion(idx: number) {
  aiSuggestions.value.splice(idx, 1);
  aiSuggestions.value = [...aiSuggestions.value];
}

async function acceptAllSuggestions() {
  for (const sug of aiSuggestions.value) {
    if (sug.accepted) continue;
    await acceptSuggestion(sug);
  }
}

// ===== 响应式 =====
let resizeObs: ResizeObserver | null = null;

onMounted(() => {
  if (svgRef.value) {
    const rect = svgRef.value.parentElement?.getBoundingClientRect();
    if (rect) { width.value = rect.width; height.value = rect.height; }
  }
  buildGraph();
  startSimulation();
  setTimeout(stopSimulation, 3000);

  resizeObs = new ResizeObserver(entries => {
    for (const entry of entries) {
      width.value = entry.contentRect.width;
      height.value = entry.contentRect.height;
    }
  });
  if (svgRef.value?.parentElement) resizeObs.observe(svgRef.value.parentElement);
});

onUnmounted(() => {
  stopSimulation();
  resizeObs?.disconnect();
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
});

watch([() => agentStore.characters, () => agentStore.relationships], () => {
  buildGraph();
  startSimulation();
  setTimeout(stopSimulation, 2000);
}, { deep: true });
</script>

<template>
  <div class="relative w-full h-full min-h-[300px] bg-white rounded-lg border border-border overflow-hidden">
    <!-- 工具栏 -->
    <div class="absolute top-2 right-2 z-10 flex gap-1.5">
      <button @click="runAiSuggest" :disabled="aiLoading || agentStore.characters.length < 2"
        class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md transition-all font-medium shadow-sm"
        :class="aiLoading ? 'bg-purple-50 text-purple-500 cursor-wait' : 'bg-gradient-to-r from-brand to-ai-primary text-white hover:shadow-md'">
        <svg v-if="!aiLoading" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
        <svg v-else class="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
        {{ aiLoading ? '分析中...' : 'AI 建议' }}
      </button>
      <button @click="openAddRelModal" class="px-2.5 py-1 text-[11px] bg-brand text-white rounded-md hover:bg-brand-dark transition-colors font-medium shadow-sm">
        + 添加
      </button>
      <button v-if="selectedEdge" @click="deleteSelectedEdge" class="px-2.5 py-1 text-[11px] bg-red-50 text-danger rounded-md hover:bg-red-100 transition-colors font-medium">
        删除
      </button>
    </div>

    <!-- 提示 -->
    <div v-if="nodes.length === 0" class="absolute inset-0 flex items-center justify-center text-sm text-text-muted">
      暂无角色，请先添加角色
    </div>

    <!-- SVG 画布 -->
    <svg ref="svgRef" :width="width" :height="height" class="w-full h-full" @click="onBgClick">
      <defs>
        <marker id="arrow-pos" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
          <path d="M0,0 L6,2 L0,4" fill="#22c55e" />
        </marker>
        <marker id="arrow-neg" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
          <path d="M0,0 L6,2 L0,4" fill="#ef4444" />
        </marker>
        <marker id="arrow-neutral" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
          <path d="M0,0 L6,2 L0,4" fill="#94a3b8" />
        </marker>
      </defs>

      <!-- 连线 -->
      <g v-for="e in edges" :key="e.id">
        <path
          :d="edgePath(e)"
          :stroke="selectedEdge?.id === e.id ? '#4F7CFF' : edgeColor(e.status)"
          :stroke-width="selectedEdge?.id === e.id ? 2.5 : 1.8"
          fill="none"
          stroke-linecap="round"
          class="cursor-pointer transition-colors"
          :marker-end="`url(#arrow-${e.status === 'POSITIVE' ? 'pos' : e.status === 'NEGATIVE' ? 'neg' : 'neutral'})`"
          @click.stop="onEdgeClick(e)"
        />
        <text
          :x="edgeLabelPos(e).x"
          :y="edgeLabelPos(e).y"
          text-anchor="middle"
          class="text-[10px] fill-text-muted pointer-events-none select-none"
        >{{ e.type }}</text>
      </g>

      <!-- 节点 -->
      <g v-for="n in nodes" :key="n.id"
        class="cursor-grab active:cursor-grabbing"
        @mousedown="onNodeMouseDown(n, $event)"
        @click.stop="onNodeClick(n)"
        @dblclick.stop="onNodeDblClick(n)"
      >
        <!-- 选中光环 -->
        <circle v-if="selectedNode?.id === n.id"
          :cx="n.x" :cy="n.y" :r="26"
          fill="none" stroke="#4F7CFF" stroke-width="2" stroke-dasharray="4,3" opacity="0.6"
        />
        <!-- 节点主体 -->
        <circle
          :cx="n.x" :cy="n.y" :r="22"
          :fill="nodeColor(n.role)"
          stroke="white" stroke-width="2"
          class="drop-shadow-sm"
        />
        <!-- 名字 -->
        <text
          :x="n.x" :y="n.y + 1"
          text-anchor="middle"
          dominant-baseline="central"
          class="text-[11px] fill-white font-medium pointer-events-none select-none"
        >{{ n.name.length > 3 ? n.name.slice(0,3) : n.name }}</text>
        <!-- 全名（超过3字） -->
        <text v-if="n.name.length > 3"
          :x="n.x" :y="n.y + 36"
          text-anchor="middle"
          class="text-[9px] fill-text-muted pointer-events-none select-none"
        >{{ n.name }}</text>
        <!-- 角色标签 -->
        <text
          :x="n.x" :y="n.y - 30"
          text-anchor="middle"
          class="text-[9px] fill-text-muted pointer-events-none select-none"
        >{{ n.role || '未设定' }}</text>
      </g>
    </svg>

    <!-- 选中边信息浮窗 -->
    <div v-if="selectedEdge && aiSuggestions.length === 0" class="absolute bottom-2 left-2 right-2 bg-white border border-border rounded-lg p-3 shadow-lg z-10">
      <div class="flex items-center gap-2 text-xs">
        <span class="font-medium text-text-primary">{{ edgeLabel(selectedEdge) }}</span>
        <span v-if="selectedEdge.status" :class="{
          'text-green-600': selectedEdge.status === 'POSITIVE',
          'text-red-500': selectedEdge.status === 'NEGATIVE',
          'text-amber-500': selectedEdge.status === 'COMPLEX',
          'text-gray-500': selectedEdge.status === 'NEUTRAL',
        }">{{ selectedEdge.status }}</span>
      </div>
      <div v-if="selectedEdge.description" class="text-[11px] text-text-muted mt-1">{{ selectedEdge.description }}</div>
    </div>

    <!-- AI 建议面板 -->
    <div v-if="aiSuggestions.length > 0" class="absolute bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg z-20 max-h-[50%] overflow-y-auto">
      <div class="flex items-center justify-between px-3 py-2 border-b border-border bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0">
        <span class="text-xs font-medium text-ai-primary">AI 关系建议 ({{ aiSuggestions.filter(s => !s.accepted).length }} 条)</span>
        <div class="flex gap-1.5">
          <button @click="acceptAllSuggestions" class="px-2 py-0.5 text-[10px] bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium">全部采纳</button>
          <button @click="aiSuggestions = []" class="px-2 py-0.5 text-[10px] bg-gray-100 text-text-muted rounded hover:bg-gray-200 transition-colors">关闭</button>
        </div>
      </div>
      <div class="divide-y divide-border/50">
        <div v-for="(sug, idx) in aiSuggestions" :key="idx"
          class="px-3 py-2 flex items-start gap-2 transition-colors"
          :class="sug.accepted ? 'bg-green-50/50 opacity-60' : 'hover:bg-gray-50'">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 text-xs">
              <span class="font-medium text-text-primary">{{ sug.fromName }}</span>
              <span class="text-text-muted">→</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                :class="{
                  'bg-green-100 text-green-700': sug.status === 'POSITIVE',
                  'bg-red-100 text-red-600': sug.status === 'NEGATIVE',
                  'bg-amber-100 text-amber-700': sug.status === 'COMPLEX',
                  'bg-gray-100 text-gray-600': sug.status === 'NEUTRAL',
                }">{{ sug.type }}</span>
              <span class="text-text-muted">→</span>
              <span class="font-medium text-text-primary">{{ sug.toName }}</span>
              <span v-if="sug.accepted" class="text-green-600 text-[10px]">已采纳</span>
            </div>
            <div v-if="sug.description" class="text-[10px] text-text-muted mt-0.5 leading-relaxed">{{ sug.description }}</div>
          </div>
          <div v-if="!sug.accepted" class="flex gap-1 shrink-0 pt-0.5">
            <button @click="acceptSuggestion(sug)" class="px-2 py-0.5 text-[10px] bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium">采纳</button>
            <button @click="dismissSuggestion(idx)" class="px-2 py-0.5 text-[10px] bg-gray-100 text-text-muted rounded hover:bg-gray-200 transition-colors">忽略</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加关系弹窗 -->
    <div v-if="showAddRelModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" @click.self="showAddRelModal = false">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-5 animate-editor-in">
        <h3 class="text-sm font-semibold text-text-primary mb-4">添加角色关系</h3>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-text-secondary mb-1">角色 A</label>
              <select v-model="addRelForm.fromId" class="rel-input">
                <option value="" disabled>选择角色</option>
                <option v-for="c in agentStore.characters" :key="c.characterId || c.id" :value="c.characterId || c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1">角色 B</label>
              <select v-model="addRelForm.toId" class="rel-input">
                <option value="" disabled>选择角色</option>
                <option v-for="c in agentStore.characters" :key="c.characterId || c.id" :value="c.characterId || c.id" :disabled="c.characterId === addRelForm.fromId || c.id === addRelForm.fromId">{{ c.name }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-text-secondary mb-1">关系类型</label>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="rt in relationTypes" :key="rt"
                  @click="addRelForm.type = rt"
                  class="px-2 py-0.5 text-[11px] rounded-full border transition-colors"
                  :class="addRelForm.type === rt ? 'bg-brand text-white border-brand' : 'bg-white text-text-secondary border-border hover:border-brand/40'"
                >{{ rt }}</button>
              </div>
            </div>
            <div>
              <label class="block text-xs text-text-secondary mb-1">关系性质</label>
              <select v-model="addRelForm.status" class="rel-input">
                <option value="POSITIVE">正面 (友好)</option>
                <option value="NEGATIVE">负面 (敌对)</option>
                <option value="NEUTRAL">中性</option>
                <option value="COMPLEX">复杂</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs text-text-secondary mb-1">关系描述 (可选)</label>
            <textarea v-model="addRelForm.description" rows="2" class="rel-input resize-none" placeholder="描述两者之间的关系..."></textarea>
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button @click="showAddRelModal = false" class="flex-1 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-gray-50 transition-colors">取消</button>
          <button @click="createRel" :disabled="!addRelForm.fromId || !addRelForm.toId || !addRelForm.type"
            class="flex-1 px-3 py-1.5 text-xs text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-40">
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes editorIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-editor-in { animation: editorIn 0.2s ease-out; }
.rel-input { @apply w-full px-2.5 py-1.5 text-xs border border-border rounded-lg bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors; }
</style>
