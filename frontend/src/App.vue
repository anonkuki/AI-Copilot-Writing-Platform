<script setup lang="ts">
/**
 * 根组件（App.vue）
 * ============================================
 * 这是 Vue 应用的根组件，所有的页面都作为它的子组件
 * 类似于公司的董事长，虽然不具体做业务，但管理着整个公司
 *
 * 核心功能：
 * 1. 作为应用的入口点 - 所有其他组件都嵌套在这里
 * 2. 路由出口 - 根据 URL 显示不同的页面
 *
 * <script setup> 语法：
 * - Vue 3.2+ 引入的简化写法
 * - 不需要写 data()、methods() 等选项
 * - 直接在顶层写变量和函数
 */

import { RouterView } from 'vue-router';
</script>

<template>
  <!--
    RouterView 是 Vue Router 提供的组件
    它会根据当前路由规则，自动渲染对应的页面组件
    例如：
    - 当访问 / 时，渲染 HomeView
    - 当访问 /document/:id 时，渲染 DocumentView
  -->
  <RouterView />
</template>

<style>
/*
 * 全局样式在 main.css 中定义
 * 这里不需要写额外的样式，保持简洁
 */
</style>
