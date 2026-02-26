/**
 * Prisma 数据库服务
 * ============================================
 * 本文件是数据库连接管理器，类似于餐厅的服务员负责点餐和上菜
 *
 * 核心功能：
 * 1. 连接数据库 - 应用启动时建立与 SQLite 数据库的连接
 * 2. 管理连接生命周期 - 在应用启动时连接，关闭时断开
 * 3. 提供数据库操作接口 - 让其他服务可以方便地操作数据库
 *
 * 关键技术点：
 * - Prisma: 一个现代化的 ORM（对象关系映射）工具
 *   ORM 就像翻译器，将代码翻译中的操作成 SQL 语句操作数据库
 * - SQLite: 轻量级数据库，适合开发和中小型项目
 * - extends PrismaClient: 继承 Prisma 提供的客户端类，获得数据库操作能力
 * - OnModuleInit/OnModuleDestroy: 生命周期接口，在模块初始化/销毁时自动调用
 *
 * 生命周期钩子：
 * - onModuleInit(): 应用启动时调用，用于建立数据库连接
 * - onModuleDestroy(): 应用关闭时调用，用于断开数据库连接，防止资源泄漏
 */

// 引入 NestJS 的装饰器，用于标记这是一个可注入的服务
// 引入生命周期接口，用于在模块初始化和销毁时执行特定操作
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// 引入 Prisma 客户端，这是 Prisma 框架提供的数据库操作类
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService 服务类
 * @Injectable() 装饰器表示这个类可以被其他类依赖注入使用
 * 继承 PrismaClient 以获得数据库操作能力
 * 实现 OnModuleInit 和 OnModuleDestroy 接口来处理生命周期
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * 模块初始化时调用
   * 相当于餐厅开门时服务员开始工作
   * 这里建立与数据库的连接
   */
  async onModuleInit() {
    // $connect() 是 Prisma 提供的方法，用于建立数据库连接
    await this.$connect();
  }

  /**
   * 模块销毁时调用
   * 相当于餐厅关门时服务员结束工作
   * 这里断开与数据库的连接，释放资源
   */
  async onModuleDestroy() {
    // $disconnect() 是 Prisma 提供的方法，用于断开数据库连接
    await this.$disconnect();
  }
}
