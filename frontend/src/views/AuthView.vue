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
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl bg-brand mx-auto flex items-center justify-center shadow-lg">
          <span class="text-white text-2xl font-bold">A+</span>
        </div>
        <h1 class="text-xl font-bold text-text-primary mt-4">AI+ 智能写作助手</h1>
        <p class="text-sm text-text-secondary mt-1">AI 加持的网文创作平台</p>
      </div>

      <!-- 表单卡片 -->
      <div class="bg-white rounded-xl shadow-modal p-6 animate-slide-up">
        <h2 class="text-lg font-semibold text-text-primary mb-5">
          {{ isLoginMode ? '登录' : '注册' }}
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="!isLoginMode">
            <label class="form-label">昵称</label>
            <input v-model="name" type="text" class="form-input" placeholder="请输入昵称" />
          </div>

          <div>
            <label class="form-label">邮箱</label>
            <input v-model="email" type="email" class="form-input" placeholder="请输入邮箱地址" required />
          </div>

          <div>
            <label class="form-label">密码</label>
            <input v-model="password" type="password" class="form-input" placeholder="请输入密码" required />
          </div>

          <div v-if="error" class="text-sm text-danger bg-red-50 px-3 py-2 rounded-lg">{{ error }}</div>

          <button type="submit" :disabled="loading" class="w-full btn-primary py-2.5 disabled:opacity-50">
            {{ loading ? '请稍候...' : (isLoginMode ? '登 录' : '注 册') }}
          </button>
        </form>

        <div class="mt-4 text-center">
          <button @click="toggleMode" class="text-sm text-brand hover:text-brand-dark transition-colors">
            {{ isLoginMode ? '没有账号？注册' : '已有账号？登录' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
