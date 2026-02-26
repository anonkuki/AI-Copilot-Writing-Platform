/**
 * AI 数据传输对象（DTO）
 * ============================================
 * 本文件定义了 AI 相关 API 的数据格式，类似于填写 AI 服务申请表的模板
 *
 * 包含两个 DTO：
 * 1. AiAskDto - AI 问答请求的数据格式
 * 2. AiSuggestDto - AI 建议请求的数据格式
 */

import { IsString, IsOptional } from 'class-validator';

/**
 * AI 问答请求 DTO
 * 用于 POST /ai/ask 接口
 */
export class AiAskDto {
  /**
   * 文档 ID
   * 必填字段，用于获取文档上下文
   */
  @IsString()
  documentId: string;

  /**
   * 用户问题
   * 必填字段，用户想要询问的问题
   */
  @IsString()
  question: string;

  /**
   * 选中的文本
   * 可选字段，用户选中的部分文本
   * 用于让 AI 更好地理解上下文
   */
  @IsString()
  @IsOptional()
  selectedText?: string;
}

/**
 * AI 建议请求 DTO
 * 用于 POST /ai/suggest 接口
 */
export class AiSuggestDto {
  /**
   * 文档 ID
   * 必填字段
   */
  @IsString()
  documentId: string;

  /**
   * 文档内容或选中文本
   * 必填字段，AI 建议的基础内容
   */
  @IsString()
  content: string;

  /**
   * 命令类型
   * 可选字段，指定 AI 做什么
   * - continue: 续写内容
   * - improve: 改进内容
   * - fix: 语法纠错
   * - summarize: 总结内容
   */
  @IsString()
  @IsOptional()
  command?: string;
}
