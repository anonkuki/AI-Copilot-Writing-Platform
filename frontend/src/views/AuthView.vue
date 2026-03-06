<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isLoginMode = ref(true);
const email = ref('');
const password = ref('');
const name = ref('');
const error = ref('');
const loading = ref(false);

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    if (isLoginMode.value) {
      await authStore.login(email.value, password.value);
    } else {
      await authStore.register(email.value, password.value, name.value);
    }
    router.push('/');
  } catch (err: any) {
    error.value = err?.response?.data?.message?.[0] || err?.message || '操作失败';
  } finally {
    loading.value = false;
  }
}

function toggleMode() {
  isLoginMode.value = !isLoginMode.value;
  error.value = '';
}
</script>

<template>
  <!-- Vercel / Linear 全新极简线框科技风 (Wireframe & Minimalist Tech) -->
  <div class="min-h-screen bg-slate-50 relative font-sans text-slate-900 overflow-hidden flex items-center justify-center selection:bg-brand/20">
    
    <!-- 全局纯净网格背景 & 径向渐变遮罩 (凸显中间亮四周暗的聚焦效应) -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_10%,transparent_100%)] opacity-60"></div>

    <!-- 背景光效点盖缀 (加入柔和缓慢的浮动动画) -->
    <div class="absolute top-[10%] left-[20%] w-[30rem] h-[30rem] bg-brand/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply animate-float-slow"></div>
    <div class="absolute bottom-[10%] right-[15%] w-[40rem] h-[40rem] bg-indigo-400/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply animate-float-delayed"></div>

    <div class="relative w-full max-w-[1300px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-24 z-10 py-10">

      <!-- 左侧：硬核排版与特性网格 -->
      <div class="flex-1 w-full">
        <!-- 标签 Badge -->
        <div class="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-fade-in-up">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand"></span>
          </span>
          <span class="text-[11px] font-bold text-slate-700 tracking-widest uppercase">Zhiwen Engine v1.0</span>
        </div>

        <!-- 巨型标题 -->
        <h1 class="text-[2.75rem] lg:text-[4rem] font-black leading-[1.05] tracking-tighter mb-6 text-slate-900 animate-fade-in-up delay-100">
          重构长篇创作的<br class="hidden md:block"/>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand via-blue-600 to-indigo-600">结构与逻辑。</span>
        </h1>

        <p class="text-lg text-slate-500 mb-12 max-w-xl leading-relaxed font-medium animate-fade-in-up delay-200">
          告别碎片与混乱。智文写作助手由三层代理网络、私有RAG与严格的大纲版本控制驱动，专为构建宏大史诗量身定制。
        </p>

        <!-- 特性 2x2 线框矩阵 (错落入场) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <!-- 卡片 1 -->
          <div class="group bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up delay-300">
            <div class="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-50 group-hover:text-brand transition-colors text-slate-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
            </div>
            <h3 class="font-bold text-slate-800 text-[15px] mb-1.5 group-hover:text-brand transition-colors">结构化大纲引擎</h3>
            <p class="text-[13px] text-slate-500 leading-relaxed">代码库般清晰的卷章树状管理，大纲不仅是参考，更是强约束逻辑。</p>
          </div>
          <!-- 卡片 2 -->
          <div class="group bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-indigo-400/40 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up delay-400">
            <div class="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors text-slate-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <h3 class="font-bold text-slate-800 text-[15px] mb-1.5 group-hover:text-indigo-600 transition-colors">三层 AI 规划网络</h3>
            <p class="text-[13px] text-slate-500 leading-relaxed">主线战略、分卷战役、章节战术。分工明确的无缝接力协作。</p>
          </div>
          <!-- 卡片 3 -->
          <div class="group bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-violet-400/40 hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up delay-500">
            <div class="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-50 group-hover:text-violet-500 transition-colors text-slate-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
            </div>
            <h3 class="font-bold text-slate-800 text-[15px] mb-1.5 group-hover:text-violet-600 transition-colors">万物关联 RAG 图谱</h3>
            <p class="text-[13px] text-slate-500 leading-relaxed">一键索引所有角色羁绊、特殊道具。拒绝 AI 无脑幻觉与战力崩坏。</p>
          </div>
          <!-- 卡片 4 -->
          <div class="group bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-teal-400/40 hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up delay-600">
            <div class="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors text-slate-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            </div>
            <h3 class="font-bold text-slate-800 text-[15px] mb-1.5 group-hover:text-teal-600 transition-colors">逐行 Diff 审阅体验</h3>
            <p class="text-[13px] text-slate-500 leading-relaxed">像极了 Code Review，采纳或打回 AI 润色的每一处字词调整。</p>
          </div>
        </div>
      </div>

      <!-- 右侧：厚白悬浮登录中心 (带有侧滑入场动画) -->
      <div class="w-full max-w-[440px] shrink-0 animate-slide-in-right delay-200">
        <div class="bg-white rounded-[2rem] border border-slate-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.08)] relative overflow-hidden transition-transform duration-500 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)]">
          
          <!-- 极简渐变顶条 -->
          <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand via-blue-500 to-indigo-500"></div>

          <div class="p-8 sm:p-10">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-11 h-11 rounded-xl bg-brand border-2 border-white flex items-center justify-center p-2 shadow-md ring-1 ring-slate-900/5 group">
                <img src="/logo.png" alt="Logo" class="w-full h-full object-contain filter brightness-0 invert group-hover:scale-110 transition-transform duration-500" />
              </div>
              <span class="text-xl font-bold text-slate-900 tracking-tight">智文 <span class="font-medium text-slate-400 text-sm">写作助手</span></span>
            </div>

            <h2 class="text-2xl font-black text-slate-900 tracking-tight mb-2">
              {{ isLoginMode ? '欢迎回来' : '接入创作枢纽' }}
            </h2>
            <p class="text-slate-500 text-sm mb-8">
              {{ isLoginMode ? '系统服务全线绿灯，可以继续工作。' : '现在注册，获得完整的工程级长篇写作赋能。' }}
            </p>

            <form @submit.prevent="handleSubmit" class="space-y-4">
              <div v-if="!isLoginMode" class="animate-fade-in">
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">创作者代号</label>
                <input v-model="name" type="text" class="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-[15px] font-medium" placeholder="输入笔名" />
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">系统凭证 (邮箱)</label>
                <input v-model="email" type="email" class="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-[15px] font-medium" placeholder="name@domain.com" required />
              </div>

              <div>
                <div class="flex justify-between items-center mb-1.5">
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">安全密钥 (密码)</label>
                  <a href="#" v-if="isLoginMode" class="text-[12px] font-semibold text-brand hover:text-blue-700 transition-colors">找回密钥</a>
                </div>
                <input v-model="password" type="password" class="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-[15px] font-medium" placeholder="••••••••" required />
              </div>

              <div v-if="error" class="text-[13px] font-semibold text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100 flex items-start gap-2.5 animate-fade-in mt-2">
                <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                {{ error }}
              </div>

              <!-- 提交按钮：加入 active 点击反馈 -->
              <button type="submit" :disabled="loading" class="w-full bg-slate-900 hover:bg-brand text-white font-bold py-4 text-[15px] rounded-xl shadow-lg shadow-slate-900/10 hover:shadow-brand/25 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 mt-6 group">
                <span>{{ loading ? '权限校验中...' : (isLoginMode ? '连接枢纽 ⟶' : '激活档案 ⟶') }}</span>
                <svg v-if="loading" class="animate-spin -mr-1 ml-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </button>
            </form>
          </div>

          <!-- Bottom Toggle Area -->
          <div class="bg-slate-50 border-t border-slate-100 p-6 text-center">
            <span class="text-slate-500 text-[13px] font-medium">{{ isLoginMode ? '未建立连接？' : '已持有通行证？' }}</span>
            <button @click="toggleMode" class="text-[13px] font-bold text-slate-800 hover:text-brand transition-colors ml-2 underline decoration-2 underline-offset-4 decoration-slate-300 hover:decoration-brand py-1">
              {{ isLoginMode ? '建立全新档案' : '返回登录界面' }}
            </button>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes floatSlow {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.02);
  }
}

/* 基础进场动画 */
.animate-fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-slide-in-right {
  opacity: 0;
  animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* 背景呼吸浮动 */
.animate-float-slow {
  animation: floatSlow 12s ease-in-out infinite;
}
.animate-float-delayed {
  animation: floatSlow 14s ease-in-out infinite;
  animation-delay: -6s; /* 负延迟，使两个球起伏错开 */
}

/* 延迟序列，打造错落有致的加载感 */
.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-400 { animation-delay: 400ms; }
.delay-500 { animation-delay: 500ms; }
.delay-600 { animation-delay: 600ms; }
</style>
