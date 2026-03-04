/**
 * AI 模块
 * ============================================
 * 本模块负责 AI 智能功能的集成，类似于公司的 AI 顾问部门
 *
 * 核心功能：
 * 1. AI 对话功能 - 回答用户关于文档的问题
 * 2. 智能建议功能 - 根据上下文提供写作建议
 * 3. 续写功能 - 帮用户继续写作
 * 4. 语法纠错 - 检查并修正文本错误
 * 5. 文本总结 - 概括文档主要内容
 *
 * 外部 API：
 * - 使用硅基流动（SiliconFlow）API
 * - 模型：DeepSeek-V3.2（深度求索大模型）
 * - API 地址：https://api.siliconflow.cn/v1/chat/completions
 *
 * 依赖说明：
 * - DocumentModule: 导入文档模块，以便 AI 可以读取文档内容
 *   这是一个跨模块依赖，AI 模块需要访问文档数据
 */

import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { DocumentModule } from '../document/document.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [DocumentModule],
  providers: [AiService, PrismaService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
