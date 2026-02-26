/**
 * 创建文档数据传输对象（DTO）
 * ============================================
 * 本文件定义了创建文档时需要接收的数据格式，类似于填写表单的模板
 *
 * 什么是 DTO（Data Transfer Object）？
 * - DTO 是一种设计模式，用于在不同层之间传输数据
 * - 在这里定义了前端创建文档时需要传递哪些字段
 * - 同时使用 class-validator 进行数据验证，确保数据符合要求
 *
 * 字段说明：
 * - title: 文档标题（可选，不提供则使用默认值）
 * - content: 文档内容（可选，默认为空 JSON 对象）
 * - ownerId: 文档所有者 ID（可选，默认为 'default-user'）
 *
 * 验证装饰器说明：
 * - @IsString() - 必须是字符串类型
 * - @IsOptional() - 该字段是可选的，不强制要求提供
 * - 问号 ? 表示该属性是可选的（TypeScript 语法）
 */

// 从 class-validator 库引入验证装饰器
import { IsString, IsOptional, IsObject } from 'class-validator';

/**
 * 创建文档 DTO 类
 * 当前端发送 POST /documents 请求时，会将 JSON 数据映射到这个类
 */
export class CreateDocumentDto {
  /**
   * 文档标题
   * @IsString() - 必须是字符串
   * @IsOptional() - 可选字段
   * ? - TypeScript 中表示可选属性
   */
  @IsString()
  @IsOptional()
  title?: string;

  /**
   * 文档内容
   * 以 JSON 字符串形式存储 TipTap 编辑器的内容
   */
  @IsString()
  @IsOptional()
  content?: string;

  /**
   * 文档所有者 ID
   * 用于标识文档的创建者（目前简化为单用户）
   */
  @IsString()
  @IsOptional()
  ownerId?: string;
}
