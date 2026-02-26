/**
 * AI+ 文档系统后端入口文件
 * ============================================
 * 本文件是整个后端应用的启动入口，类似于汽车发动机的点火开关
 *
 * 核心功能：
 * 1. 创建 NestJS 应用实例 - 整个后端服务的大脑
 * 2. 配置 CORS 跨域资源共享 - 允许前端能够访问后端接口
 * 3. 启动 HTTP 服务器 - 在指定端口监听客户端请求
 *
 * 关键技术点：
 * - NestFactory: NestJS 框架的核心工厂类，用于创建应用实例
 * - CORS: 跨域资源共享，允许不同域名的前后端进行通信
 * - 端口 3001: 后端服务监听的网络端口，前端通过这个端口连接后端
 *
 * 启动流程：
 * 1. bootstrap() 函数被调用
 * 2. 创建 NestJS 应用实例
 * 3. 启用 CORS 支持
 * 4. 开始监听 3001 端口
 * 5. 输出启动成功信息到控制台
 */

// 引入 NestJS 核心模块，用于创建应用实例
import { NestFactory } from '@nestjs/core';
// 引入验证管道，用于验证请求数据
import { ValidationPipe } from '@nestjs/common';
// 引入根模块，定义应用的整体结构
import { AppModule } from './app.module';

/**
 * 启动引导函数
 * 这是后端应用的入口点，当运行 npm run start:dev 时会首先执行此函数
 * async/await 用于处理异步操作 - 等待应用创建完成后再继续
 */
async function bootstrap() {
  // 使用 NestFactory.create() 创建 NestJS 应用实例
  // 这会根据 AppModule 的配置初始化整个应用
  const app = await NestFactory.create(AppModule);

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剥离非白名单属性
      forbidNonWhitelisted: true, // 非白名单属性抛出错误
      transform: true, // 自动转换请求数据为 DTO 类型
    }),
  );

  // 启用 CORS（跨域资源共享）
  // 允许指定的前端域名访问后端 API
  // origin: 允许的前端域名列表，这里是本地开发环境
  // credentials: 允许发送 Cookie 等凭证信息
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // 让应用监听 3001 端口，开始接收客户端请求
  // 端口号就像建筑物的门牌号，客户端通过这个号码找到服务器
  await app.listen(3001);

  // 在控制台输出启动信息，告知开发者服务已就绪
  console.log('🚀 AI+ Backend running on http://localhost:3001');
}

// 调用 bootstrap 函数启动应用
bootstrap();
