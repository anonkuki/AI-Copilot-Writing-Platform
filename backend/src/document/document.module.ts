/**
 * 文档模块
 * ============================================
 * 本模块负责文档的完整生命周期管理，类似于图书馆的图书管理系统
 *
 * 核心功能：
 * 1. 处理文档的 CRUD 操作 - 创建、读取、更新、删除文档
 * 2. 定义 API 路由 - 接收前端请求的入口
 * 3. 封装业务逻辑 - 处理文档相关的各种业务需求
 *
 * 模块组成部分：
 * - DocumentController: 控制器，负责接收 HTTP 请求并返回响应
 * - DocumentService: 服务类，负责处理具体的业务逻辑
 * - PrismaService: 数据库服务，负责与数据库交互
 *
 * 什么是 CRUD？
 * - C: Create（创建）- 创建新文档
 * - R: Read（读取）- 获取文档列表或单个文档
 * - U: Update（更新）- 修改文档内容
 * - D: Delete（删除）- 删除文档
 *
 * 依赖注入说明：
 * - 在 NestJS 中，模块的 providers 中的类可以被其他类通过构造函数注入
 * - 例如 DocumentController 构造函数中注入 DocumentService
 */

import { Module } from '@nestjs/common';
// 引入文档服务，处理文档的业务逻辑
import { DocumentService } from './document.service';
// 引入文档控制器，处理 HTTP 请求
import { DocumentController } from './document.controller';
// 引入 Prisma 服务，提供数据库操作能力
import { PrismaService } from '../prisma.service';

/**
 * 文档模块定义
 * @Module 装饰器标记这是一个 NestJS 模块
 */
@Module({
  // providers: 在这个模块中提供的服务
  // DocumentService: 处理文档的业务逻辑
  // PrismaService: 提供数据库操作能力（被 DocumentService 依赖）
  providers: [DocumentService, PrismaService],

  // controllers: 在这个模块中注册的控制器
  // 控制器负责接收特定路由的 HTTP 请求
  controllers: [DocumentController],

  // exports: 允许其他模块使用这个模块中的哪些服务
  // 导出 DocumentService，使得 AiModule 等其他模块可以使用它
  exports: [DocumentService],
})
export class DocumentModule {}
