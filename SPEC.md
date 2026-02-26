# AI+ 文档系统 - 技术规格文档

## 项目概述
- **项目名称**: AI+ 文档系统 (类 Notion)
- **项目类型**: 全栈 Web 应用
- **核心功能**: 实时协作文档编辑 + AI 辅助写作
- **目标用户**: 需要智能文档编辑的开发者和内容创作者

---

## 技术栈

### 后端
- **框架**: NestJS
- **数据库 ORM**: Prisma + SQLite
- **实时通信**: Socket.io
- **AI 集成**: DeepSeek API

### 前端
- **框架**: Vue 3.5 (Composition API + `<script setup>`)
- **编辑器**: TipTap (支持 Markdown)
- **状态管理**: Pinia
- **样式**: Tailwind CSS
- **HTTP 客户端**: Axios
- **Socket 客户端**: socket.io-client

---

## 阶段一：数据契约与实时通信

### 1.1 Document 实体模型

```typescript
// Prisma Schema
model Document {
  id        String   @id @default(uuid())
  title     String   @default("Untitled")
  content   Json     @default("{}")
  ownerId   String
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 1.2 Socket.io Gateway
- **命名空间**: `/documents`
- **房间格式**: `document:{document_id}`
- **事件**:
  - `join` - 用户加入房间
  - `leave` - 用户离开房间
  - `content-update` - 内容更新广播
  - `user-joined` - 用户加入通知
  - `user-left` - 用户离开通知

---

## 阶段二：编辑器前端架构

### 2.1 编辑器组件功能
- **Slash Command**: 输入 `/` 弹出菜单
  - 标题 (H1, H2, H3)
  - 无序列表
  - 有序列表
  - 代码块
  - 引用块
- **Markdown 快捷键**: `#` 标题, `-` 列表, `` ` `` 代码块等

### 2.2 状态管理 (Pinia)
- `currentDocument` - 当前文档数据
- `socketStatus` - Socket 连接状态
- `collaborators` - 当前房间用户列表
- `isSyncing` - 同步状态

---

## 阶段三：AI RAG 功能

### 3.1 后端接口
- **POST** `/ai/ask`
  - 请求体: `{ documentId: string, question: string, selectedText?: string }`
  - 响应: `{ answer: string, suggestions: string[] }`

### 3.2 AI 功能
- 根据文档上下文生成后续段落
- 语法纠错建议
- 内容润色

### 3.3 前端交互
- 选中文本后显示浮动 AI 按钮
- 弹出式 AI 建议面板

---

## UI/UX 设计规格

### 配色方案
- **主色**: `#1a1a2e` (深蓝黑)
- **次色**: `#16213e` (深蓝)
- **强调色**: `#0f3460` (中蓝)
- **高亮色**: `#e94560` (玫红)
- **文字色**: `#eaeaea` (浅灰白)
- **次级文字**: `#a0a0a0` (中灰)
- **成功色**: `#4ade80` (绿色)
- **警告色**: `#fbbf24` (黄色)

### 布局
- **侧边栏**: 240px 宽度，深色背景
- **主编辑区**: 自适应宽度，最大 900px 居中
- **AI 面板**: 右侧滑出式，320px 宽度

### 字体
- **主字体**: Inter, system-ui, sans-serif
- **代码字体**: JetBrains Mono, monospace

---

## 目录结构

```
ai+/
├── backend/                 # NestJS 后端
│   ├── src/
│   │   ├── document/       # 文档模块
│   │   ├── ai/             # AI 模块
│   │   ├── gateway/        # Socket Gateway
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── frontend/               # Vue 前端
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── stores/        # Pinia stores
│   │   ├── views/         # 页面
│   │   ├── composables/   # 组合式函数
│   │   └── App.vue
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```
