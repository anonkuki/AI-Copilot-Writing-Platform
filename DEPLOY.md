# AI+ 作家助手 - 部署指南

本项目是一个前后端分离的 AI 写作助手应用，包含：
- **前端**: Vue 3 + Vite + TailwindCSS
- **后端**: NestJS + Prisma + Socket.io
- **数据库**: PostgreSQL
- **缓存**: Redis (可选)

---

## 快速部署 (免费层)

### 1. 数据库 - Neon (免费 PostgreSQL)

1. 访问 https://neon.tech 注册账号
2. 创建新项目，选择免费套餐
3. 获取连接字符串，格式如下：
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/aiplus?sslmode=require
   ```

### 2. Redis - Upstash (免费)

1. 访问 https://upstash.com 注册账号
2. 创建 Redis 数据库，获取连接 URL：
   ```
   redis://default:password@xxx.upstash.io
   ```

### 3. 后端部署 - Railway

1. 访问 https://railway.app 注册账号 (用 GitHub 登录)
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择 `ai-writer-assistant` 仓库
4. 在 Variables 标签页添加环境变量：

```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://... (Neon 的连接字符串)
REDIS_URL=redis://... (Upstash 的连接字符串)
CORS_ORIGIN=https://你的vercel域名.vercel.app
JWT_SECRET=生成一个随机字符串
SILICONFLOW_API_KEY=你的API密钥 (可选)
```

5. 部署完成后， Railway 会提供后端 URL，例如：`https://ai-plus-backend-production-xxx.up.railway.app`

### 4. 前端部署 - Vercel

1. 访问 https://vercel.com 注册账号 (用 GitHub 登录)
2. 点击 "Add New..." → "Project"
3. 选择 `ai-writer-assistant` 仓库
4. 配置：
   - Framework Preset: `Vue.js`
   - Build Command: `npm run build` 或留空
   - Output Directory: `dist`

5. 在 Environment Variables 添加：

```
VITE_API_BASE_URL=https://你的railway后端URL
```

6. 点击 Deploy

### 5. 验证部署

部署完成后：
- 前端: `https://你的项目名.vercel.app`
- 后端 API: `https://你的railway域名/api/...`

---

## 本地开发运行

### 前端

```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:5173
```

### 后端

```bash
cd backend
npm install
# 复制 .env.example 为 .env，配置数据库等
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
# API 运行在 http://localhost:3001
```

---

## 所需服务账号

| 服务 | 免费额度 | 注册地址 |
|------|---------|---------|
| Neon (PostgreSQL) | 512MB | https://neon.tech |
| Upstash (Redis) | 10K 命令/天 | https://upstash.com |
| Railway | $5/月 | https://railway.app |
| Vercel | 免费 | https://vercel.com |
| SiliconFlow (可选) | 免费 API | https://siliconflow.cn |

---

## 面试展示建议

1. **演示前**：确保所有服务都已部署完成并正常运行
2. **展示重点**：
   - 登录注册功能
   - AI 写作助手交互
   - 角色管理、场景管理等业务功能
   - 实时协作 (Socket.io)
3. **备用方案**：如果服务不稳定，可以准备本地运行的录屏作为备份
