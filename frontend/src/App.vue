<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, RouterView } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';

const route = useRoute();
const showSidebar = computed(() => route.path !== '/auth' && !route.path.startsWith('/editor'));
const isDesktop = computed(() => !!window.electronAPI);
const isMaximized = ref(false);

async function checkMaximized() {
  if (window.electronAPI) {
    isMaximized.value = await window.electronAPI.isMaximized();
  }
}

onMounted(() => {
  checkMaximized();
  window.addEventListener('resize', checkMaximized);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMaximized);
});

async function handleMinimize() { window.electronAPI?.minimize(); }
async function handleMaximize() {
  if (window.electronAPI) isMaximized.value = await window.electronAPI.maximize();
}
async function handleClose() { window.electronAPI?.close(); }
</script>

<template>
  <div class="h-screen flex flex-col bg-surface-secondary overflow-hidden">
    <!-- Electron 标题栏 -->
    <div v-if="isDesktop" class="h-8 bg-white border-b border-border flex items-center px-3 shrink-0" style="-webkit-app-region: drag">
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 rounded bg-brand flex items-center justify-center">
          <span class="text-white text-xs font-bold">A</span>
        </div>
        <span class="text-xs text-text-secondary font-medium">AI+ 写作助手</span>
      </div>
      <div class="ml-auto flex items-center gap-1" style="-webkit-app-region: no-drag">
        <button @click="handleMinimize" class="w-8 h-6 flex items-center justify-center hover:bg-surface-hover rounded text-text-muted">
          <svg width="10" height="1" viewBox="0 0 10 1"><rect fill="currentColor" width="10" height="1"/></svg>
        </button>
        <button @click="handleMaximize" class="w-8 h-6 flex items-center justify-center hover:bg-surface-hover rounded text-text-muted">
          <svg width="10" height="10" viewBox="0 0 10 10"><rect fill="none" stroke="currentColor" width="9" height="9" x="0.5" y="0.5"/></svg>
        </button>
        <button @click="handleClose" class="w-8 h-6 flex items-center justify-center hover:bg-danger hover:text-white rounded text-text-muted">
          <svg width="10" height="10" viewBox="0 0 10 10"><line stroke="currentColor" stroke-width="1.2" x1="1" y1="1" x2="9" y2="9"/><line stroke="currentColor" stroke-width="1.2" x1="9" y1="1" x2="1" y2="9"/></svg>
        </button>
      </div>
    </div>

    <!-- 主布局 -->
    <div class="flex-1 flex min-h-0">
      <Sidebar v-if="showSidebar" />
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-secondary">
        <RouterView />
      </main>
    </div>
  </div>
</template>
