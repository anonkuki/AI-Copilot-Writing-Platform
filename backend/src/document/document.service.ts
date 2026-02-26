/**
 * 文档服务
 * ============================================
 * 本文件是文档业务逻辑的核心处理层，类似于餐厅的厨师负责烹饪菜品
 *
 * 核心功能：
 * 1. 实现文档的 CRUD 业务逻辑 - 具体的数据操作都在这里完成
 * 2. 与数据库交互 - 通过 PrismaService 操作 SQLite 数据库
 * 3. 数据验证和异常处理 - 确保数据的完整性和正确性
 *
 * 什么是服务（Service）？
 * - 在 NestJS 中，服务是处理业务逻辑的主要类
 * - 它通常被控制器调用，控制器负责接收请求，服务负责处理请求
 * - 类似于餐厅中，顾客点餐后由厨师负责制作菜品
 *
 * Prisma 数据库操作：
 * - findMany: 查询多条记录（类似 SELECT * FROM documents）
 * - findUnique: 查询单条记录（通过唯一字段如 ID）
 * - create: 创建新记录
 * - update: 更新记录
 * - delete: 删除记录
 *
 * 异常处理：
 * - NotFoundException: 当查询的文档不存在时抛出 404 错误
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

/**
 * 文档服务类
 * @Injectable() 装饰器表示这个类可以被依赖注入到其他类中
 * 所有的业务逻辑都写在这个类里面
 */
@Injectable()
export class DocumentService {
  /**
   * 构造函数
   * 注入 PrismaService，用于数据库操作
   * private 表示这个属性是私有的，只能在类内部使用
   */
  constructor(private prisma: PrismaService) {}

  /**
   * 创建文档
   * @param createDocumentDto - 创建文档的数据传输对象
   * @returns 创建完成的文档对象
   *
   * 逻辑说明：
   * 1. 接收前端传来的创建数据
   * 2. 设置默认值（如未提供标题则使用 'Untitled'）
   * 3. 调用 Prisma 的 create 方法将数据存入数据库
   */
  async create(createDocumentDto: CreateDocumentDto & { ownerId: string }) {
    return this.prisma.document.create({
      data: {
        title: createDocumentDto.title || 'Untitled',
        content: createDocumentDto.content || '{}',
        ownerId: createDocumentDto.ownerId,
      },
    });
  }

  /**
   * 获取用户的所有文档
   * @param userId - 用户ID
   * @returns 文档数组，按更新时间倒序排列
   *
   * 逻辑说明：
   * 1. 调用 Prisma 的 findMany 方法查询用户文档
   * 2. orderBy: { updatedAt: 'desc' } 表示按更新时间降序排列
   *    最新的文档会排在最前面
   */
  async findAllByUser(userId: string) {
    return this.prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * 获取单个文档
   * @param id - 文档的唯一标识符（UUID）
   * @param userId - 用户ID，用于权限验证
   * @returns 文档对象
   *
   * 逻辑说明：
   * 1. 使用 findUnique 方法通过 ID 查询文档
   * 2. 如果文档不存在，抛出 NotFoundException（404 错误）
   * 3. 如果找到，返回文档对象
   */
  async findOne(id: string, userId?: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    // 如果没有找到文档，抛出 404 异常
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // 如果提供了 userId，验证权限
    if (userId && document.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to access this document');
    }

    return document;
  }

  /**
   * 更新文档
   * @param id - 文档的唯一标识符
   * @param updateDocumentDto - 更新文档的数据传输对象
   * @param userId - 用户ID，用于权限验证
   * @returns 更新后的文档对象
   *
   * 逻辑说明：
   * 1. 先调用 findOne 验证文档是否存在
   * 2. 使用 update 方法更新文档
   * 3. version: { increment: 1 } 表示每次更新版本号自动加 1
   *    这在多人协作时很重要，可以追踪文档的修改历史
   */
  async update(id: string, updateDocumentDto: UpdateDocumentDto, userId: string) {
    // 先验证文档是否存在且用户有权限
    await this.findOne(id, userId);

    return this.prisma.document.update({
      where: { id },
      data: {
        ...updateDocumentDto,
        // 每次更新版本号自动加 1
        version: { increment: 1 },
      },
    });
  }

  /**
   * 删除文档
   * @param id - 文档的唯一标识符
   * @param userId - 用户ID，用于权限验证
   * @returns 删除操作的结果
   *
   * 逻辑说明：
   * 1. 先调用 findOne 验证文档是否存在
   * 2. 使用 delete 方法从数据库中删除文档
   * 3. 删除成功通常返回 204 状态码
   */
  async remove(id: string, userId: string) {
    // 先验证文档是否存在且用户有权限
    await this.findOne(id, userId);

    return this.prisma.document.delete({
      where: { id },
    });
  }
}
