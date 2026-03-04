/**
 * AI 控制器
 * ============================================
 * 本文件是 AI 相关 API 请求的入口点
 *
 * 核心功能：
 * 1. 文档 AI 问答和建议
 * 2. 书籍写作 AI 辅助（生成章节、润色、大纲、角色等）
 *
 * API 路由设计：
 * - POST /ai/ask - AI 问答接口
 * - POST /ai/suggest - AI 建议接口
 * - POST /ai/write - 写作辅助接口（书籍）
 * - POST /ai/edit - 文本编辑接口
 * - POST /ai/outline - 大纲生成接口
 * - POST /ai/character - 角色生成接口
 */

import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiAskDto, AiSuggestDto } from './dto/ai-ask.dto';
import { AiWriteDto, AiEditTextDto, AiGenerateOutlineDto, AiCharacterDto } from './dto/ai-write.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * AI 控制器
 * @Controller('ai') 定义基础路由为 /ai
 */
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * AI 问答接口
   * POST /ai/ask
   */
  @Post('ask')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async ask(@Body() aiAskDto: AiAskDto, @Request() req: any) {
    return this.aiService.ask(
      req.user.userId,
      aiAskDto.documentId,
      aiAskDto.question,
      aiAskDto.selectedText,
    );
  }

  /**
   * AI 建议接口
   * POST /ai/suggest
   */
  @Post('suggest')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async suggest(@Body() aiSuggestDto: AiSuggestDto, @Request() req: any) {
    return this.aiService.suggest(
      req.user.userId,
      aiSuggestDto.documentId,
      aiSuggestDto.content,
      aiSuggestDto.command,
    );
  }

  /**
   * 写作辅助接口
   * POST /ai/write
   *
   * 命令类型：
   * - generate: 根据大纲生成章节
   * - continue: 续写内容
   * - improve: 改进内容
   * - expand: 扩展内容
   * - summarize: 总结内容
   * - outline: 生成章节大纲
   * - character: 生成角色设定
   * - plot: 生成情节建议
   */
  @Post('write')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async write(@Body() dto: AiWriteDto, @Request() req: any) {
    return this.aiService.write(
      req.user.userId,
      dto.bookId,
      dto.chapterId,
      dto.content,
      dto.command,
      dto.options,
    );
  }

  /**
   * 文本编辑接口
   * POST /ai/edit
   *
   * 编辑动作：
   * - improve: 改进表达
   * - polish: 润色
   * - shorten: 精简
   * - expand: 扩展
   * - fix: 纠错
   * - change_style: 改变风格
   */
  @Post('edit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async edit(@Body() dto: AiEditTextDto, @Request() req: any) {
    return this.aiService.editText(
      req.user.userId,
      dto.bookId,
      dto.text,
      dto.action,
      dto.style,
    );
  }

  /**
   * 大纲生成接口
   * POST /ai/outline
   */
  @Post('outline')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async generateOutline(@Body() dto: AiGenerateOutlineDto, @Request() req: any) {
    return this.aiService.generateOutline(
      req.user.userId,
      dto.bookId,
      dto.title,
      dto.genre,
      dto.chapterCount,
      dto.existingOutline,
    );
  }

  /**
   * 角色生成接口
   * POST /ai/character
   */
  @Post('character')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async generateCharacter(@Body() dto: AiCharacterDto, @Request() req: any) {
    return this.aiService.generateCharacter(
      req.user.userId,
      dto.bookId,
      dto.name,
      dto.role,
      dto.description,
    );
  }
}
