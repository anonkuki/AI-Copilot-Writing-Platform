/**
 * AI+ 前端应用入口文件
 * ============================================
 * 本文件是前端 Vue 应用的启动入口，类似于整车装配的起点
 *
 * 核心功能：
 * 1. 创建 Vue 应用实例 - 整个前端应用的大脑
 * 2. 配置路由 - 决定用户访问不同 URL 时显示什么页面
 * 3. 安装状态管理 - 让应用的不同部分可以共享数据
 * 4. 挂载应用到 DOM - 将应用渲染到网页上
 *
 * 关键技术点：
 * - Vue 3: 前端框架，用于构建用户界面
 * - Pinia: Vue 3 的状态管理库（类似 Vuex 但更简单）
 * - Vue Router: Vue 官方路由管理器
 * - 路由懒加载: () => import() 语法，按需加载页面组件
 *
 * 路由配置说明：
 * - / : 首页，显示文档列表
 * - /document/:id : 文档编辑页面，:id 是动态参数
 *
 * 启动流程：
 * 1. 定义路由规则
 * 2. 创建 Vue 应用实例
 * 3. 安装 Pinia 状态管理
 * 4. 安装 Vue Router 路由
 * 5. 将应用挂载到 #app 元素上
 */

// 引入 Vue 框架的核心函数
import { createApp } from 'vue';
// 引入 Pinia，用于状态管理（管理全局共享数据）
import { createPinia } from 'pinia';
// 引入 Vue Router，用于管理页面路由
import { createRouter, createWebHistory } from 'vue-router';
// 引入根组件（App.vue），应用的顶层组件
import App from './App.vue';
// 引入全局样式文件
import './assets/main.css';

/**
 * 创建路由实例
 * 路由决定了 URL 和页面的对应关系
 *
 * history: createWebHistory() - 使用 HTML5 History API
 * 让 URL 更美观，不像传统网页有 # 号
 */
const router = createRouter({
  history: createWebHistory(),
  /**
   * 路由规则数组
   * 每个对象定义一个路由
   */
  routes: [
    {
      // 根路径，显示首页
      path: '/',
      // 路由名称，方便在代码中引用
      name: 'home',
      // 懒加载首页组件（只有访问时才加载）
      component: () => import('./views/HomeView.vue'),
    },
    {
      // 动态路由，:id 是变量
      // 例如：/document/abc-123 会匹配到这个路由
      path: '/document/:id',
      name: 'document',
      // 懒加载文档页面组件
      component: () => import('./views/DocumentView.vue'),
    },
  ],
});

/**
 * 创建 Vue 应用实例
 * 所有的 Vue 功能都基于这个实例
 */
const app = createApp(App);

// 安装 Pinia 状态管理
// 之后可以在任何组件中使用 useXxxStore() 来管理状态
app.use(createPinia());

// 安装路由
// 之后可以在组件中使用 $router 和 $route
app.use(router);

/**
 * 挂载应用
 * 将 Vue 应用渲染到 HTML 中的 #app 元素
 * #app 在 index.html 中定义
 */
app.mount('#app');
