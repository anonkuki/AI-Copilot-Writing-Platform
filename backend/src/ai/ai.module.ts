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
// 引入 AI 服务，处理 AI 相关的业务逻辑
import { AiService } from './ai.service';
// 引入 AI 控制器，处理 AI 相关的 HTTP 请求
import { AiController } from './ai.controller';
// 引入文档模块，因为 AI 需要读取文档内容
import { DocumentModule } from '../document/document.module';

/**
 * AI 模块定义
 */
@Module({
  // 导入其他模块
  // DocumentModule 提供了读取文档的服务
  // AI 需要访问文档内容来提供智能建议
  imports: [DocumentModule],

  // 提供当前模块的服务
  // AiService 处理所有 AI 相关的业务逻辑
  providers: [AiService],

  // 注册控制器
  // AiController 处理 AI 相关的 API 请求
  controllers: [AiController],

  // 导出服务，允许其他模块使用
  exports: [AiService],
})
export class AiModule {}
