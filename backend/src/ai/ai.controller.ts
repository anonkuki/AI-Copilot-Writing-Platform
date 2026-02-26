/**
 * AI 控制器
 * ============================================
 * 本文件是 AI 相关 API 请求的入口点，类似于 AI 部门的接待员
 *
 * 核心功能：
 * 1. 处理 AI 问答请求 - 用户询问关于文档的问题
 * 2. 处理 AI 建议请求 - 获取智能写作建议
 *
 * API 路由设计：
 * - POST /ai/ask - AI 问答接口
 *   参数：documentId（文档ID）、question（问题）、selectedText（选中文本）
 *   返回：AI 的回答和建议列表
 *
 * - POST /ai/suggest - AI 建议接口
 *   参数：documentId（文档ID）、content（内容）、command（命令类型）
 *   命令类型包括：
 *   - continue: 续写
 *   - improve: 改进建议
 *   - fix: 语法纠错
 *   - summarize: 总结
 */

import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiAskDto, AiSuggestDto } from './dto/ai-ask.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * AI 控制器
 * @Controller('ai') 定义基础路由为 /ai
 */
@Controller('ai')
export class AiController {
  /**
   * 构造函数
   * 注入 AiService 用于处理 AI 业务逻辑
   */
  constructor(private readonly aiService: AiService) {}

  /**
   * AI 问答接口
   * POST /ai/ask
   *
   * @Body() aiAskDto - 接收前端传来的问答请求数据
   *
   * 流程：
   * 1. 接收用户的问题和选中的文本
   * 2. 根据文档 ID 获取文档内容作为上下文
   * 3. 调用 AI 服务获取回答
   * 4. 返回回答和建议
   */
  @Post('ask')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async ask(@Body() aiAskDto: AiAskDto) {
    return this.aiService.ask(
      aiAskDto.documentId,
      aiAskDto.question,
      aiAskDto.selectedText,
    );
  }

  /**
   * AI 建议接口
   * POST /ai/suggest
   *
   * 根据不同的命令类型提供不同的 AI 功能：
   * - continue: 根据当前内容续写
   * - improve: 改进选中的文本
   * - fix: 纠错选中的文本
   * - summarize: 总结文档
   */
  @Post('suggest')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async suggest(@Body() aiSuggestDto: AiSuggestDto) {
    return this.aiService.suggest(
      aiSuggestDto.documentId,
      aiSuggestDto.content,
      aiSuggestDto.command,
    );
  }
}
