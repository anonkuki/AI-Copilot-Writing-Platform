<template>
  <div class="promo-bg min-h-screen flex flex-col">
    <!-- 顶部导航 -->
    <header class="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div class="flex items-center gap-2">
        <img src="/logo.svg" alt="作家助手" class="w-8 h-8" />
        <span class="text-xl font-bold text-brand tracking-wide">作家助手</span>
      </div>
      <div>
        <button @click="goRegister" class="px-5 py-2 bg-brand text-white rounded-lg font-medium shadow hover:bg-brand-dark transition-colors">立即注册</button>
      </div>
    </header>

    <!-- 宣传内容 -->
    <main class="flex-1 flex flex-col items-center justify-center px-4 pt-8 pb-20">
      <h1 class="text-3xl md:text-4xl font-extrabold text-center mb-8 mt-8 text-text-primary">专业纯粹，成神利器</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mb-16">
        <div class="rounded-2xl bg-white/90 shadow-lg p-8 flex flex-col items-start">
          <h2 class="text-lg font-bold text-brand mb-2">创作有章法</h2>
          <p class="text-sm text-text-secondary mb-4">支持多种创作方法，让你灵感不断</p>
          <img src="/promo-1.svg" alt="创作有章法" class="rounded-lg w-full" />
        </div>
        <div class="rounded-2xl bg-white/90 shadow-lg p-8 flex flex-col items-start">
          <h2 class="text-lg font-bold text-blue-500 mb-2">灵感无死角</h2>
          <p class="text-sm text-text-secondary mb-4">全文极速检索，伏笔心中有数</p>
          <img src="/promo-2.svg" alt="灵感无死角" class="rounded-lg w-full" />
        </div>
        <div class="rounded-2xl bg-white/90 shadow-lg p-8 flex flex-col items-start">
          <h2 class="text-lg font-bold text-purple-500 mb-2">文字没毛病</h2>
          <p class="text-sm text-text-secondary mb-4">专为网文而生的精准纠错</p>
          <img src="/promo-3.svg" alt="文字没毛病" class="rounded-lg w-full" />
        </div>
        <div class="rounded-2xl bg-white/90 shadow-lg p-8 flex flex-col items-start">
          <h2 class="text-lg font-bold text-sky-500 mb-2">妙笔一点通</h2>
          <p class="text-sm text-text-secondary mb-4">你的智能创作助手，让每一次执笔都引燃星火</p>
          <img src="/promo-4.svg" alt="妙笔一点通" class="rounded-lg w-full" />
        </div>
      </div>

      <h2 class="text-2xl font-bold text-center mb-8 mt-12 text-text-primary">通人达事，证道不孤</h2>
      <div class="w-full max-w-4xl mb-16">
        <img src="/promo-5.svg" alt="通人达事，证道不孤" class="rounded-2xl w-full" />
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 text-center">
          <div>
            <div class="text-lg font-bold text-brand mb-1">平台直达</div>
            <div class="text-xs text-text-secondary">省时省力，便捷连接阅读平台</div>
          </div>
          <div>
            <div class="text-lg font-bold text-blue-500 mb-1">读者互动</div>
            <div class="text-xs text-text-secondary">汇聚动态，回应每一次支持</div>
          </div>
          <div>
            <div class="text-lg font-bold text-purple-500 mb-1">作家交流</div>
            <div class="text-xs text-text-secondary">以文会友，创作路上结伴同行</div>
          </div>
          <div>
            <div class="text-lg font-bold text-sky-500 mb-1">编辑相伴</div>
            <div class="text-xs text-text-secondary">专业服务，成长少走弯路</div>
          </div>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-center mb-8 mt-12 text-text-primary">安全可靠，金身不败</h2>
      <div class="w-full max-w-4xl mb-16">
        <img src="/promo-6.svg" alt="安全可靠，金身不败" class="rounded-2xl w-full" />
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 text-center">
          <div>
            <div class="text-lg font-bold text-brand mb-1">本地保存</div>
            <div class="text-xs text-text-secondary">本地实时保存，离线创作也安心</div>
          </div>
          <div>
            <div class="text-lg font-bold text-blue-500 mb-1">多端同步</div>
            <div class="text-xs text-text-secondary">内容秒级同步，多端创作更顺滑</div>
          </div>
          <div>
            <div class="text-lg font-bold text-purple-500 mb-1">历史版本</div>
            <div class="text-xs text-text-secondary">20个历史版本，多重兜底保内容</div>
          </div>
          <div>
            <div class="text-lg font-bold text-sky-500 mb-1">冲突备份</div>
            <div class="text-xs text-text-secondary">冲突智能提醒，自主选择不丢失</div>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-center mt-16 mb-8">
        <button @click="goRegister" class="px-8 py-3 bg-brand text-white rounded-xl text-lg font-bold shadow-lg hover:bg-brand-dark transition-colors">欢迎注册使用作家助手</button>
        <div class="text-xs text-text-muted mt-2">纯净流畅可信赖，一款专业网文创作工具</div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
function goRegister() {
  router.push('/auth?from=promo');
}
</script>

<style scoped>
.promo-bg {
  background: linear-gradient(180deg, #f6faff 0%, #eaf2fb 100%);
}
</style>
