/**
 * 更新文档数据传输对象（DTO）
 * ============================================
 * 本文件定义了更新文档时需要接收的数据格式，类似于修改表单的模板
 *
 * 与 CreateDocumentDto 的区别：
 * - 创建时所有字段都是可选的（因为可以使用默认值）
 * - 更新时所有字段也都是可选的（因为只需要更新部分字段）
 *
 * 字段说明：
 * - title: 文档标题（可选，只更新提供的字段）
 * - content: 文档内容（可选，用于保存编辑器内容）
 * - version: 文档版本号（可选，但通常由服务端自动管理）
 *
 * 注意：
 * - version 字段在服务层会自动递增，这里标记为可选
 * - 前端不需要手动传入 version，服务会自动处理
 */

import { IsString, IsOptional, IsNumber } from 'class-validator';

/**
 * 更新文档 DTO 类
 * 当前端发送 PUT /documents/:id 请求时，会将 JSON 数据映射到这个类
 */
export class UpdateDocumentDto {
  /**
   * 文档标题
   * 前端可以只更新标题，不更新内容
   */
  @IsString()
  @IsOptional()
  title?: string;

  /**
   * 文档内容
   * 存储 TipTap 编辑器生成的 JSON 内容
   */
  @IsString()
  @IsOptional()
  content?: string;

  /**
   * 文档版本号
   * @IsNumber() - 必须是数字类型
   * 注意：通常不需要前端手动传入，服务会自动递增
   */
  @IsNumber()
  @IsOptional()
  version?: number;
}
