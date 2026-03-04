# AI+ 智能写作平台

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Vue%203.5-42b883" alt="Vue" />
  <img src="https://img.shields.io/badge/Backend-NestJS%2010-e0234e" alt="NestJS" />
  <img src="https://img.shields.io/badge/Database-Prisma%20%2B%20SQLite-2D3748" alt="Prisma" />
  <img src="https://img.shields.io/badge/Realtime-Socket.io-010101" alt="Socket.io" />
  <img src="https://img.shields.io/badge/AI-DeepSeek%20V3-FF6C37" alt="AI" />
  <img src="https://img.shields.io/badge/Desktop-Electron%2028-47848F" alt="Electron" />
</p>

> 面向网文 / 长篇小说创作场景的全栈 AI 辅助写作系统：提供书籍-卷-章结构化管理、实时协作编辑、三层 AI 写作代理（战略-战术-执行）、角色关系网络、Copilot 风格行内润色与一致性检查。支持 Web 部署与 Electron 桌面应用打包。

---

## 目录

- [项目定位](#项目定位)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [系统架构](#系统架构)
- [数据模型](#数据模型)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [常用命令](#常用命令)
- [API 与模块说明](#api-与模块说明)
- [部署指南](#部署指南)
- [Electron 桌面应用](#electron-桌面应用)
- [工程化与安全](#工程化与安全)
- [常见问题](#常见问题)

---

## 项目定位

AI+ 面向 **可持续长篇写作生产** 而非一次性对话：

- 以 **Book → Volume → Chapter → Document** 层级组织创作资产
- 通过 **三层 AI 代理架构**（L3 大纲层 → L2 角色层 → L1 执行层）系统化辅助创作
- 用 **Socket.io 协作网关** 支持多人实时编辑
- 用 **一致性检查 + RAG 检索增强** 保障内容逻辑与质量

适合个人创作者、小型内容团队的私有化部署。

---

## 核心功能

### 结构化写作管理
- 书籍 / 卷 / 章节 全链路 CRUD
- 章节版本快照与回滚
- 字数统计与写作日历

### AI 辅助创作
- **续写 / 改写 / 摘要**：基于上下文的 SSE 流式生成
- **Copilot 行内润色**：选中文本后获取红绿 Diff 对比建议，逐条接受/拒绝
- **角色/大纲/世界观 AI 补全**：字段级智能建议，一键采纳
- **关系网络 AI 建议**：自动分析角色并推荐缺失关系

### 全屏编辑器
- **角色编辑器**：基本信息 / 性格心理 / 能力成长 / 背景故事 四维管理
- **世界观编辑器**：流派 / 基调 / 力量体系 / 地理 / 社会 / 历史 / 规则
- **剧情线编辑器**：主线 / 副线 / 角色线，含冲突-高潮-结局结构
- **伏笔编辑器**：创建 / 回收 / 废弃状态管理

### 角色关系网络
- SVG 力导向图（零依赖）
- 节点按角色着色（主角/配角/反派）
- 边按关系状态着色（正面/负面/复杂）
- 双向贝塞尔曲线、拖拽交互、双击打开角色编辑

### 实时协作
- WebSocket 房间机制 + 内容增量同步
- 在线协作者感知

### 安全与运维
- JWT 鉴权 + 用户维度资源隔离
- 全局限流 + AI 专用限流
- Helmet 安全头 + 压缩中间件
- 统一环境变量启动校验

---

## 技术栈

### 前端

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Vue 3 | 3.5+ | Composition API + `<script setup>` |
| 状态管理 | Pinia | 2.1 | 响应式 Store |
| 编辑器 | TipTap | 2.2 | 基于 ProseMirror 的富文本编辑器 |
| 样式 | Tailwind CSS | 3.4 | 自定义设计令牌 |
| 构建工具 | Vite | 5.0 | HMR + 开发代理 |
| 类型检查 | TypeScript | 5.3 | Strict 模式 |
| HTTP | Axios | 1.6 | API 请求 |
| 实时通信 | Socket.io-client | 4.7 | WebSocket 协作 |
| 桌面 | Electron | 28 | 可选桌面应用打包 |
| 路由 | Vue Router | 4.2 | SPA 路由 |

### 后端

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | NestJS | 10.3 | 模块化企业级框架 |
| ORM | Prisma | 5.9 | 类型安全数据库访问 |
| 数据库 | SQLite | — | 默认轻量数据库（可迁移 PostgreSQL） |
| 实时通信 | Socket.io | 4.7 | WebSocket 网关 |
| 认证 | Passport + JWT | — | 无状态令牌鉴权 |
| 校验 | class-validator | 0.14 | DTO 输入校验 |
| AI 调用 | Axios | 1.6 | SiliconFlow API 请求 |
| 安全 | Helmet | 8.1 | HTTP 安全头 |
| 压缩 | compression | 1.8 | Gzip 响应压缩 |
| 限流 | @nestjs/throttler | 6.5 | 全局 + AI 专用限流 |
| 缓存 | cache-manager + Redis | — | 可选 Redis 缓存层 |
| 文档 | @nestjs/swagger | 11.2 | 自动生成 API 文档 |
| 测试 | Jest | 29.7 | 单元测试 |

### AI 模型

| 提供商 | 模型 | API |
|--------|------|-----|
| SiliconFlow | DeepSeek-V3.2 | `https://api.siliconflow.cn/v1/chat/completions` |

支持 SSE 流式输出（续写/润色）与常规 JSON 响应（角色/大纲/关系建议）。

---

## 系统架构

```
┌─────────────┐     HTTP/WS      ┌──────────────┐     Prisma     ┌──────────┐
│  Vue 3 SPA  │ ◄──────────────► │  NestJS API  │ ◄────────────► │  SQLite  │
│  (or Electron)                 │              │                │(可替换PG)│
└─────────────┘                  │  ┌─────────┐ │                └──────────┘
       │                         │  │ Socket  │ │
       │    /socket.io           │  │ Gateway │ │     REST       ┌──────────┐
       └─────────────────────────┤  └─────────┘ │ ◄────────────► │SiliconFlow│
                                 │              │                │ DeepSeek │
                                 │  ┌─────────┐ │                └──────────┘
                                 │  │  Agent  │ │
                                 │  │Orchestr.│ │     Optional   ┌──────────┐
                                 │  └─────────┘ │ ◄────────────► │  Redis   │
                                 └──────────────┘                └──────────┘
```

### 三层 AI 代理架构

| 层级 | 名称 | 职责 | 数据模型 |
|------|------|------|----------|
| L3 | 战略层 | 世界观、剧情线、时间线、伏笔 | WorldSetting, PlotLine, TimelineEvent, Foreshadowing |
| L2 | 战术层 | 角色档案、关系网络、情绪轨迹、成长记录 | CharacterProfile, CharacterRelationship, EmotionLog, GrowthRecord |
| L1 | 执行层 | 场景、事件日志、章节摘要、AI 会话 | Scene, EventLog, ChapterSummary, AgentSession |

### 关键流程

1. 用户登录获取 JWT
2. 前端调用 REST API 管理书籍与章节
3. 进入编辑器后连接 Socket 命名空间并加入文档房间
4. 用户触发 AI 操作，后端拼接上下文并调用 SiliconFlow 模型
5. 结果回写文档，并向协作者广播更新

---

## 数据模型

项目使用 Prisma + SQLite，共 **31 个数据模型**：

```
用户与团队       文档协作             书籍结构              AI 三层架构
─────────      ─────────            ─────────            ──────────
User           Document             Book                 L3: WorldSetting
Team           DocumentVersion      Volume                   PlotLine
TeamMember     Folder               Chapter                  TimelineEvent
TeamInvite     Tag / DocumentTag    ChapterVersion           Foreshadowing
               Share                Outline              L2: CharacterProfile
               Favorite             Character                CharacterRelationship
               Comment              Inspiration              EmotionLog
               Notification         WritingStat              GrowthRecord
               AuditLog                                  L1: Scene
                                                             EventLog
                                                             ChapterSummary
                                                             AgentSession

辅助: Embedding (向量存储), ConsistencyRule, ConsistencyReport
```

完整 Schema 见 `backend/prisma/schema.prisma`。

---

## 快速开始

### 环境要求

- **Node.js** >= 18
- **npm** >= 9
- （可选）Redis — 用于缓存增强

### 1. 克隆项目

```bash
git clone <your-repo-url> ai-plus
cd ai-plus
```

### 2. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 3. 配置环境变量

```bash
# 后端
cd backend
cp .env.example .env
# 编辑 .env，至少配置 JWT_SECRET 和 SILICONFLOW_API_KEY

# 前端
cd ../frontend
cp .env.example .env
# 本地开发通常无需修改
```

> **Windows PowerShell**: 使用 `Copy-Item .env.example .env`

### 4. 初始化数据库

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 5. 启动开发环境

```bash
# 终端 1：后端（端口 3001）
cd backend
npm run start:dev

# 终端 2：前端（端口 5173）
cd frontend
npm run dev
```

打开浏览器访问 **http://localhost:5173**

- Swagger API 文档（开发环境）：**http://localhost:3001/api/docs**

---

## 环境变量

### 后端 `backend/.env`

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `JWT_SECRET` | **是** | — | JWT 签名密钥，生产请使用强随机值 |
| `SILICONFLOW_API_KEY` | **是**（AI功能） | — | SiliconFlow API 密钥 |
| `NODE_ENV` | 否 | `development` | 环境标识（development / production） |
| `PORT` | 否 | `3001` | 后端服务端口 |
| `CORS_ORIGIN` | 否 | `http://localhost:5173` | 允许跨域来源，逗号分隔 |
| `DATABASE_URL` | 否 | `file:./dev.db` | 数据库连接字符串 |
| `REDIS_URL` | 否 | — | Redis 连接（可选缓存层） |
| `SILICONFLOW_API_URL` | 否 | `https://api.siliconflow.cn/v1/chat/completions` | AI API 地址 |
| `SILICONFLOW_MODEL` | 否 | `deepseek-ai/DeepSeek-V3.2` | AI 模型标识 |
| `SILICONFLOW_TIMEOUT_MS` | 否 | `30000` | AI 调用超时（毫秒） |
| `THROTTLE_TTL` | 否 | `60000` | 限流时间窗口（毫秒） |
| `THROTTLE_LIMIT` | 否 | `60` | 全局每窗口最大请求数 |
| `AI_THROTTLE_LIMIT` | 否 | `15` | AI 接口每窗口最大请求数 |

> 后端启动时会执行环境变量校验，缺少必填项会直接报错阻断启动。

### 前端 `frontend/.env`

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_URL` | 空（走 Vite 代理） | API 基地址。留空 = 本地开发自动代理到 3001 |
| `VITE_SOCKET_URL` | 空（自动推导） | Socket 命名空间地址 |

---

## 常用命令

### 后端

```bash
npm run start:dev       # 开发模式（自动重载）
npm run build           # 构建到 dist/
npm run start:prod      # 生产运行 (node dist/main)
npm run test            # 单元测试
npm run test:cov        # 测试覆盖率
npm run prisma:generate # 生成 Prisma Client
npm run prisma:migrate  # 开发环境数据库迁移
npm run prisma:deploy   # 生产环境迁移（不交互）
npm run prisma:studio   # 数据库可视化管理界面
npm run prisma:reset    # 重置数据库（仅开发用）
```

### 前端

```bash
npm run dev             # Vite 开发服务器（端口 5173）
npm run build           # 生产构建（vue-tsc 类型检查 + Vite 打包）
npm run preview         # 预览构建产物
npm run electron:start  # 本地启动 Electron 桌面应用
npm run electron:build  # 打包 Electron 安装包（Windows NSIS）
```

---

## API 与模块说明

### 后端核心模块

| 模块 | 路径 | 职责 |
|------|------|------|
| `auth/` | `/auth` | 用户注册、登录、JWT 签发与守卫 |
| `users/` | `/users` | 用户信息管理 |
| `book/` | `/books` | 书籍 CRUD |
| `volume/` | `/volumes` | 卷管理 |
| `chapter/` | `/chapters` | 章节管理（含写作者视角接口） |
| `document/` | `/documents` | 文档内容管理 |
| `gateway/` | Socket.io | 协作编辑 WebSocket 网关 |
| `ai/` | `/ai` | AI 通用对话与辅助 |
| `agent/` | `/ai` | 写作智能体编排（三层架构核心） |
| `assistant/` | `/assistant` | 对话助手 |
| `consistency/` | — | 一致性检查服务 |
| `rag/` | — | 检索增强（embedding / 向量化） |
| `planner/` | — | 大纲规划服务 |
| `stats/` | `/stats` | 统计与写作日历 |
| `upload/` | `/upload` | 文件上传 |

### AI 核心接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/ai/ask` | 基于文档上下文问答 |
| `POST` | `/ai/suggest` | 基于命令给出写作建议（SSE 流） |
| `POST` | `/ai/polish/inline` | Copilot 行内润色（SSE 流） |
| `POST` | `/ai/assist-content` | 字段级 AI 补全（角色/世界观/大纲） |
| `POST` | `/ai/suggest-relationships` | AI 角色关系建议 |

### 世界观/剧情线/伏笔/角色 CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/ai/world-settings` | 创建世界观设定 |
| `PUT` | `/ai/world-settings/:id` | 更新世界观设定 |
| `DELETE` | `/ai/world-settings/:id` | 删除世界观设定 |
| `POST` | `/ai/plot-lines` | 创建剧情线 |
| `PUT` | `/ai/plot-lines/:id` | 更新剧情线 |
| `DELETE` | `/ai/plot-lines/:id` | 删除剧情线 |
| `POST` | `/ai/foreshadowings` | 创建伏笔 |
| `PUT` | `/ai/foreshadowings/:id` | 更新伏笔 |
| `PUT` | `/ai/foreshadowings/:id/resolve` | 回收伏笔 |
| `PUT` | `/ai/foreshadowings/:id/abandon` | 废弃伏笔 |
| `DELETE` | `/ai/foreshadowings/:id` | 删除伏笔 |
| `POST` | `/ai/characters` | 创建角色 |
| `DELETE` | `/ai/characters/:id` | 删除角色 |
| `POST` | `/ai/relationships` | 创建角色关系 |
| `PUT` | `/ai/relationships/:id` | 更新角色关系 |
| `DELETE` | `/ai/relationships/:id` | 删除角色关系 |

> 完整接口文档在开发环境可通过 Swagger 查看：**http://localhost:3001/api/docs**

---

## 部署指南

### 方案一：Nginx + Node.js（推荐）

最简单的生产部署方式，适合 VPS / 云服务器。

#### 1. 服务器准备

```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2（进程守护）
npm install -g pm2

# 安装 Nginx
sudo apt-get install -y nginx
```

#### 2. 构建项目

```bash
# 克隆并进入项目
git clone <your-repo-url> /opt/ai-plus
cd /opt/ai-plus

# 后端构建
cd backend
npm install --production
npm run prisma:generate
npm run prisma:deploy     # 生产迁移（不交互）
npm run build

# 前端构建
cd ../frontend
npm install
npm run build             # 产物输出到 frontend/dist/
```

#### 3. 配置后端环境变量

```bash
cd /opt/ai-plus/backend
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
JWT_SECRET=<替换为64位随机字符串>
CORS_ORIGIN=https://your-domain.com
DATABASE_URL=file:./prod.db
SILICONFLOW_API_KEY=<你的API密钥>
SILICONFLOW_TIMEOUT_MS=60000
THROTTLE_LIMIT=120
AI_THROTTLE_LIMIT=20
EOF
```

> 生成强随机密钥：`openssl rand -base64 48`

#### 4. 用 PM2 启动后端

```bash
cd /opt/ai-plus/backend
pm2 start dist/main.js --name ai-plus-api
pm2 save
pm2 startup    # 设置开机自启
```

#### 5. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/ai-plus`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /opt/ai-plus/frontend/dist;
    index index.html;

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE 支持（AI 流式响应必需）
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }

    # WebSocket 代理
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }

    # 静态资源长缓存
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/ai-plus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. HTTPS（强烈推荐）

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### 7. 前端环境变量说明

如果前端和后端通过 Nginx 部署在**同一域名**下（上述配置），`VITE_API_URL` 和 `VITE_SOCKET_URL` 可留空，前端会自动走 `/api` 前缀。

如果前端和后端在**不同域名**，构建前需配置：

```bash
cd /opt/ai-plus/frontend
cat > .env << 'EOF'
VITE_API_URL=https://api.your-domain.com
VITE_SOCKET_URL=https://api.your-domain.com
EOF
npm run build
```

---

### 方案二：Docker 容器化

#### 后端 Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

#### 前端 Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_SOCKET_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET}
      - SILICONFLOW_API_KEY=${SILICONFLOW_API_KEY}
      - CORS_ORIGIN=${CORS_ORIGIN:-http://localhost}
      - DATABASE_URL=file:./data/prod.db
    volumes:
      - backend-data:/app/data
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: ${VITE_API_URL:-}
        VITE_SOCKET_URL: ${VITE_SOCKET_URL:-}
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  backend-data:
```

启动：

```bash
# 创建 .env 文件
cat > .env << 'EOF'
JWT_SECRET=<your-strong-secret>
SILICONFLOW_API_KEY=<your-api-key>
CORS_ORIGIN=http://localhost
EOF

# 启动所有服务
docker-compose up -d
```

---

### 方案三：云平台

| 平台 | 前端 | 后端 | 注意事项 |
|------|------|------|----------|
| **Vercel** | 直接部署 `frontend/` | 不支持 | 需单独部署后端 |
| **Railway** | 静态站点 | 一键部署 | 自动检测 Prisma |
| **Fly.io** | Dockerfile | Dockerfile | 需持久化卷存 SQLite |
| **阿里云 ECS** | 方案一 | 方案一 | 最灵活 |
| **腾讯云轻量** | 方案一 | 方案一 | 性价比高 |

> **重要**：SQLite 依赖本地文件系统，Serverless 平台（Vercel Functions / AWS Lambda）不适合运行后端。如需无服务器架构，请将数据库切换为 PostgreSQL。

---

### 数据库迁移到 PostgreSQL

如需支持更高并发或使用云数据库：

1. 修改 `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. 更新环境变量:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/aiplus
   ```

3. 重新生成并迁移:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init-pg
   ```

---

## Electron 桌面应用

项目内置 Electron 28 支持，可打包为 Windows 桌面安装程序。

### 桌面应用特性
- **无边框自定义窗口**（1400×900 默认，1000×700 最小）
- **系统托盘**（最小化到托盘，右键菜单）
- **原生菜单栏**（文件/编辑/视图/帮助）
- **IPC 通信**（窗口控制、文件对话框、版本查询）
- **安全隔离**（contextIsolation + preload 桥接）

### 本地开发

```bash
cd frontend

# 终端 1：启动 Vite 开发服务器
npm run dev

# 终端 2：启动 Electron（会加载 localhost:5173）
npm run electron:start
```

### 打包发布

```bash
cd frontend

# 一键构建 + 打包（Windows NSIS 安装包）
npm run electron:build

# 安装包输出到 frontend/release/
```

### 桌面应用配置

打包前需在 `frontend/.env` 中指定后端地址：

```bash
VITE_API_URL=https://your-api-domain.com
VITE_SOCKET_URL=https://your-api-domain.com
```

打包参数在 `frontend/package.json` → `build` 字段中配置：

```json
{
  "build": {
    "appId": "com.aiplus.writer",
    "productName": "AI+作家助手",
    "win": { "target": "nsis", "icon": "public/icon.ico" },
    "nsis": { "oneClick": false, "allowToChangeInstallationDirectory": true }
  }
}
```

> 桌面应用**不内嵌后端**，需要单独部署后端服务。

---

## 工程化与安全

### 已落地

| 类别 | 措施 |
|------|------|
| 输入校验 | 全局 `ValidationPipe`（whitelist + forbidNonWhitelisted） |
| 安全头 | Helmet（生产环境启用 CSP） |
| 响应压缩 | compression（Gzip） |
| 异常处理 | 全局 AllExceptionsFilter + TransformInterceptor |
| 限流 | 全局限流 + AI 专用限流（@nestjs/throttler） |
| 配置治理 | 启动时环境变量校验，缺失即阻断 |
| AI 稳健性 | 统一封装、超时控制、错误语义化 |
| 请求体限制 | JSON / URLEncoded 均限制 10MB |
| 类型安全 | 前后端均使用 TypeScript Strict 模式 |
| API 文档 | Swagger 自动生成（仅开发环境） |

### 建议后续增强

- 结构化日志（pino + traceId）
- OpenTelemetry 指标与链路追踪
- E2E 测试（Playwright / Cypress）
- CI/CD 流水线（lint → test → build → deploy）
- 数据库定时备份策略
- AI Provider 抽象层（支持多模型切换）

---

## 常见问题

### Q: 启动报 `JWT_SECRET 未配置`
检查 `backend/.env` 是否存在且配置了 `JWT_SECRET`。重启后端。

### Q: AI 接口返回 502 或超时
1. 检查 `SILICONFLOW_API_KEY` 是否正确
2. 确认网络可访问 `api.siliconflow.cn`
3. 增大 `SILICONFLOW_TIMEOUT_MS`（建议生产 60000+）

### Q: 前端请求 404 / 跨域失败
- **本地开发**：确保 `VITE_API_URL` 为空（自动走 Vite 代理）
- **生产部署**：检查 Nginx `/api/` 反代配置 + 后端 `CORS_ORIGIN`

### Q: WebSocket 连接失败
- 检查 Nginx 配置是否包含 `proxy_http_version 1.1` + `Upgrade` 头
- 检查 `VITE_SOCKET_URL` 或 `VITE_API_URL`

### Q: SQLite 并发性能不足
迁移到 PostgreSQL — 见 [数据库迁移](#数据库迁移到-postgresql) 章节。

### Q: Electron 打包后连不上后端
桌面应用不内嵌后端，需单独部署后端并在 `VITE_API_URL` 中指定地址后重新打包。

### Q: 构建产物体积偏大
主编辑器 chunk (~560KB min / ~170KB gzip) 较大，可通过以下方式优化：
- `vite.config.ts` 中配置 `build.rollupOptions.output.manualChunks` 拆分 TipTap
- 已启用路由懒加载
- 部署时启用 Nginx Gzip 压缩即可

---

## 项目结构

```
ai+/
├── README.md                        # 本文档
├── SPEC.md                          # 技术规格文档
│
├── backend/                         # NestJS 后端
│   ├── prisma/
│   │   ├── schema.prisma            # 数据模型定义（31 个表）
│   │   └── migrations/              # 数据库迁移文件
│   ├── src/
│   │   ├── main.ts                  # 启动入口
│   │   ├── app.module.ts            # 根模块
│   │   ├── prisma.service.ts        # Prisma 数据库服务
│   │   ├── agent/                   # AI 智能体编排（核心）
│   │   │   ├── orchestrator.service.ts  # 编排器：续写/润色/补全/关系建议
│   │   │   ├── agent.controller.ts      # AI 相关全部接口
│   │   │   └── dto/                     # 数据传输对象
│   │   ├── ai/                      # AI 通用服务
│   │   ├── assistant/               # 对话助手
│   │   ├── auth/                    # JWT 认证（Passport）
│   │   ├── book/                    # 书籍管理
│   │   ├── chapter/                 # 章节管理
│   │   ├── character/               # 角色服务
│   │   ├── common/                  # 公共模块
│   │   │   ├── filters/             # 全局异常过滤器
│   │   │   ├── interceptors/        # 日志 + 响应格式化拦截器
│   │   │   └── redis/               # Redis 缓存模块
│   │   ├── config/                  # 环境变量校验
│   │   ├── consistency/             # 一致性检查服务
│   │   ├── document/                # 文档管理
│   │   ├── gateway/                 # Socket.io 协作网关
│   │   ├── planner/                 # 大纲规划服务
│   │   ├── rag/                     # 检索增强（向量化）
│   │   ├── scene/                   # 场景服务
│   │   ├── stats/                   # 统计
│   │   ├── upload/                  # 文件上传
│   │   ├── users/                   # 用户管理
│   │   └── volume/                  # 卷管理
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── .env.example                 # 环境变量模板
│
├── frontend/                        # Vue 3 前端
│   ├── electron/                    # Electron 桌面应用
│   │   ├── main.cjs                 # 主进程（窗口/托盘/菜单/IPC）
│   │   └── preload.cjs              # 安全预加载脚本
│   ├── src/
│   │   ├── main.ts                  # Vue 应用入口
│   │   ├── App.vue                  # 根组件
│   │   ├── assets/
│   │   │   └── main.css             # 全局样式 + TipTap + 润色动画
│   │   ├── components/
│   │   │   ├── Sidebar.vue              # 侧边导航栏
│   │   │   ├── ThreeLayerPanel.vue      # AI 三层面板（战略/战术/执行）
│   │   │   ├── CharacterEditor.vue      # 角色全屏编辑器（4 维管理）
│   │   │   ├── WorldSettingEditor.vue   # 世界观全屏编辑器
│   │   │   ├── PlotLineEditor.vue       # 剧情线全屏编辑器
│   │   │   ├── ForeshadowingEditor.vue  # 伏笔全屏编辑器
│   │   │   ├── RelationshipGraph.vue    # SVG 力导向关系图
│   │   │   └── InlinePolishPlugin.ts    # TipTap Copilot 行内润色插件
│   │   ├── composables/
│   │   │   └── useSocket.ts         # Socket.io 组合式函数
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios HTTP 封装
│   │   │   └── textToHtml.ts        # 文本 → HTML 转换
│   │   ├── stores/
│   │   │   ├── agent.ts             # AI 代理 Store（~1800行，核心状态）
│   │   │   ├── ai.ts                # AI 通用 Store
│   │   │   ├── auth.ts              # 认证 Store
│   │   │   ├── book.ts              # 书籍 Store
│   │   │   └── document.ts          # 文档 Store
│   │   └── views/
│   │       └── BookEditorView.vue   # 主编辑器视图（TipTap + 行内润色）
│   ├── package.json
│   ├── vite.config.ts               # Vite 配置（代理/别名）
│   ├── tailwind.config.js           # Tailwind 自定义设计令牌
│   ├── tsconfig.json
│   └── .env.example                 # 前端环境变量模板
```

---

## License

MIT
