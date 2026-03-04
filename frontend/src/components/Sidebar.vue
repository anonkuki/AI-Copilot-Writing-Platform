<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: string;
  badge?: boolean;
}

const mainNav: NavItem[] = [
  { id: 'books', label: '全部书籍', path: '/', icon: 'book' },
  { id: 'stats', label: '码字统计', path: '/stats', icon: 'chart' },
  { id: 'templates', label: '模板中心', icon: 'grid', badge: true },
  { id: 'friends', label: '码字好友', icon: 'users', badge: true },
  { id: 'learn', label: '阅创学堂', icon: 'school' },
];

const bottomNav: NavItem[] = [
  { id: 'help', label: '帮助中心', icon: 'help' },
  { id: 'feedback', label: '故障反馈', icon: 'bug' },
  { id: 'update', label: '检查更新', icon: 'refresh' },
];

const activeItem = computed(() => {
  if (route.path === '/') return 'books';
  if (route.path === '/stats') return 'stats';
  if (route.path.startsWith('/editor')) return 'books';
  return '';
});

function handleNav(item: NavItem) {
  if (item.path) {
    router.push(item.path);
  } else {
    // 未开放功能提示
    alert(`「${item.label}」功能即将上线，敬请期待！`);
  }
}

function handleLogout() {
  authStore.logout();
  router.push('/auth');
}
</script>

<template>
  <aside class="w-[140px] h-full bg-white border-r border-border flex flex-col shrink-0">
    <!-- 用户头像区 -->
    <div class="flex flex-col items-center pt-5 pb-3 px-3">
      <div class="w-14 h-14 rounded-full bg-brand-50 border-2 border-brand/20 flex items-center justify-center overflow-hidden mb-2">
        <svg v-if="!authStore.user?.avatar" class="w-7 h-7 text-brand" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <img v-else :src="authStore.user.avatar" class="w-full h-full object-cover" />
      </div>
      <span class="text-xs text-text-secondary truncate w-full text-center">{{ authStore.user?.name || '未登录' }}</span>
    </div>

    <!-- 主导航 -->
    <nav class="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
      <button
        v-for="item in mainNav"
        :key="item.id"
        @click="handleNav(item)"
        class="w-full flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs transition-all duration-150 relative"
        :class="activeItem === item.id
          ? 'bg-brand-50 text-brand font-medium shadow-sm'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'"
      >
        <!-- 书籍图标 -->
        <svg v-if="item.icon === 'book'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
        <!-- 统计图标 -->
        <svg v-else-if="item.icon === 'chart'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 13h4v8H3v-8zm7-8h4v16h-4V5zm7 4h4v12h-4V9z"/>
        </svg>
        <!-- 模板图标 -->
        <svg v-else-if="item.icon === 'grid'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
        </svg>
        <!-- 好友图标 -->
        <svg v-else-if="item.icon === 'users'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
        </svg>
        <!-- 学堂图标 -->
        <svg v-else-if="item.icon === 'school'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"/>
        </svg>
        <!-- 帮助图标 -->
        <svg v-else-if="item.icon === 'help'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
        </svg>
        <!-- 反馈图标 -->
        <svg v-else-if="item.icon === 'bug'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
        </svg>
        <!-- 刷新图标 -->
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"/>
        </svg>
        {{ item.label }}
        <!-- 红点 badge -->
        <span v-if="item.badge" class="absolute top-1.5 right-3 w-2 h-2 bg-danger rounded-full"></span>
      </button>
    </nav>

    <!-- 底部菜单 -->
    <div class="border-t border-border px-2 py-2">
      <button
        v-for="item in bottomNav"
        :key="item.id"
        @click="alert(`${item.label}：即将上线`)"
        class="w-full flex flex-col items-center gap-1 py-2 rounded-lg text-xs text-text-muted hover:bg-surface-hover hover:text-text-secondary transition-colors duration-150"
      >
        <svg v-if="item.icon === 'help'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
        </svg>
        <svg v-else-if="item.icon === 'bug'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"/>
        </svg>
        {{ item.label }}
      </button>
    </div>

    <!-- 退出 -->
    <div class="border-t border-border px-2 py-2">
      <button @click="handleLogout" class="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-text-muted hover:text-danger transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
        </svg>
        退出登录
      </button>
    </div>
  </aside>
</template>
