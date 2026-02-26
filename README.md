# AI+ 智能文档系统

<p align="center">
  <img src="https://img.shields.io/badge/版本-1.0.0-blue" alt="版本">
  <img src="https://img.shields.io/badge/前端-Vue3.5+-42b883" alt="Vue">
  <img src="https://img.shields.io/badge/后端-NestJS-e0234e" alt="NestJS">
  <img src="https://img.shields.io/badge/AI-DeepSeek_V3.2-FF6C37" alt="AI">
</p>

> 🤖 一个类似 Notion 的智能文档编辑器，支持实时协作和 AI 智能辅助写作

## ✨ 特性

- 📝 **富文本编辑** - 基于 TipTap 的现代编辑器，支持标题、列表、代码块等
- ⌨️ **斜杠命令** - 输入 `/` 快速唤起命令菜单
- 🤖 **AI 智能助手** - 基于 DeepSeek 大模型，提供续写、改进、纠错、总结等功能
- 👥 **实时协作** - 基于 WebSocket，多人同时编辑同一文档
- 💾 **自动保存** - 内容自动同步到后端数据库

## 🛠️ 技术栈

### 前端
- **Vue 3.5** - 渐进式前端框架
- **TypeScript** - 类型安全的 JavaScript
- **Pinia** - 状态管理
- **TipTap** - 富文本编辑器
- **Tailwind CSS** - 原子化 CSS 框架

### 后端
- **NestJS** - 企业级 Node.js 框架
- **Prisma** - 现代 ORM
- **Socket.io** - 实时通信
- **SQLite** - 轻量级数据库

### AI
- **SiliconFlow API** - AI 服务提供商
- **DeepSeek-V3.2** - 大语言模型

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- npm 或 yarn

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd ai+

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动

#### 1. 启动后端

```bash
cd backend
npm run start:dev
```

后端服务将在 http://localhost:3001 启动

#### 2. 启动前端

```bash
cd frontend
npm run dev
```

前端应用将在 http://localhost:5173 启动

### 使用

1. 打开浏览器访问 http://localhost:5173
2. 点击"新建文档"创建新文档
3. 在编辑器中输入内容
4. 输入 `/` 唤起命令菜单
5. 选中文本后点击 AI 按钮获取智能建议

## 📁 项目结构

```
ai+
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── ai/            # AI 模块
│   │   │   ├── ai.controller.ts
│   │   │   ├── ai.module.ts
│   │   │   ├── ai.service.ts
│   │   │   └── dto/       # 数据传输对象
│   │   ├── document/       # 文档模块
│   │   │   ├── document.controller.ts
│   │   │   ├── document.module.ts
│   │   │   ├── document.service.ts
│   │   │   └── dto/       # 数据传输对象
│   │   ├── gateway/       # WebSocket 网关
│   │   ├── app.module.ts  # 根模块
│   │   └── main.ts        # 入口文件
│   └── prisma/            # 数据库模型
│
└── frontend/              # 前端项目
    ├── src/
    │   ├── components/    # 组件
    │   │   ├── AiPanel.vue        # AI 面板
    │   │   └── TipTapEditor.vue    # 编辑器
    │   ├── views/         # 页面
    │   │   ├── HomeView.vue       # 首页
    │   │   └── DocumentView.vue   # 文档页
    │   ├── stores/        # 状态管理
    │   │   ├── ai.ts     # AI 状态
    │   │   └── document.ts # 文档状态
    │   ├── composables/   # 组合式函数
    │   │   └── useSocket.ts # Socket 连接
    │   ├── App.vue       # 根组件
    │   └── main.ts       # 入口文件
    └── ...
```

## 🔧 配置说明

### AI API 配置

后端默认使用 SiliconFlow API，配置文件位于：

```
backend/src/ai/ai.service.ts
```

```typescript
private readonly apiKey = 'your-api-key';
private readonly apiUrl = 'https://api.siliconflow.cn/v1/chat/completions';
private readonly model = 'deepseek-ai/DeepSeek-V3.2';
```

如需更换 API 或模型，请修改此文件。

### 端口配置

- 后端默认端口: `3001`
- 前端默认端口: `5173`

如需修改，请编辑对应配置文件。

## 📖 核心概念

### 什么是 Pinia？

Pinia 是 Vue 3 的状态管理库，类似于 Vuex但更简单、更类型安全。它用于在组件之间共享数据。

### 什么是 TipTap？

TipTap 是一个基于 ProseMirror 的富文本编辑器，Notion 也在使用。它支持块状内容、实时协作等高级功能。

### 什么是 Socket.io？

Socket.io 是一个 WebSocket 库，实现了实时双向通信。在本项目中用于多人协作编辑。

### 什么是 NestJS？

NestJS 是一个用于构建企业级 Node.js 应用的框架，使用 TypeScript 开发，提供了模块化架构、依赖注入等特性。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
