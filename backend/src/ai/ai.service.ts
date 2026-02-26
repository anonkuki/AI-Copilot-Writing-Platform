import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DocumentService } from '../document/document.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  // 硅基流动 API 配置
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.siliconflow.cn/v1/chat/completions';
  private readonly model = 'deepseek-ai/DeepSeek-V3.2';  // DeepSeek Pro 模型

  constructor(
    private documentService: DocumentService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('SILICONFLOW_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('⚠️ SILICONFLOW_API_KEY 环境变量未设置，AI 功能将不可用');
    }
  }

  async ask(documentId: string, question: string, selectedText?: string) {
    // Get document content
    const document = await this.documentService.findOne(documentId);

    // Build context from document
    const context = this.buildContext(document.content, selectedText);

    // Build prompt with prompt engineering
    const prompt = this.buildAskPrompt(context, question, selectedText);

    try {
      console.log('🤖 正在调用硅基流动 API...');
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `你是一个专业的AI写作助手，专门帮助用户编辑文档。你可以根据文档上下文提供有帮助的建议。
请用中文回复，保持文档的风格和语气。`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('✅ API 调用成功！');
      return {
        answer: response.data.choices[0].message.content,
        suggestions: this.extractSuggestions(response.data.choices[0].message.content),
      };
    } catch (error: any) {
      this.logger.error('SiliconFlow API 调用失败', error.response?.data || error.message);
      throw new Error(`AI 服务调用失败: ${error.message}`);
    }
  }

  async suggest(documentId: string, content: string, command?: string) {
    // Get full document for context
    const document = await this.documentService.findOne(documentId);

    const prompt = this.buildSuggestPrompt(document.content, content, command);

    try {
      console.log('🤖 正在调用硅基流动 API (suggest)...');
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `你是一个AI写作助手。根据文档上下文和用户操作，生成适当的内容建议。请用中文回复，简洁实用。`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('✅ API suggest 调用成功！');
      return {
        suggestion: response.data.choices[0].message.content,
        command: command || 'continue',
      };
    } catch (error: any) {
      this.logger.error('SiliconFlow API suggest 调用失败', error.response?.data || error.message);
      throw new Error(`AI 建议服务调用失败: ${error.message}`);
    }
  }

  private buildContext(documentContent: string, selectedText?: string): string {
    try {
      const parsed = JSON.parse(documentContent);
      // Extract text from TipTap JSON content
      return this.extractTextFromTipTap(parsed);
    } catch {
      return documentContent || '';
    }
  }

  private extractTextFromTipTap(content: any): string {
    if (typeof content === 'string') return content;
    if (!content || !content.content) return '';

    let text = '';
    const extract = (node: any) => {
      if (node.type === 'text' && node.text) {
        text += node.text;
      }
      if (node.content) {
        node.content.forEach(extract);
      }
    };

    content.content.forEach(extract);
    return text;
  }

  private buildAskPrompt(context: string, question: string, selectedText?: string): string {
    let prompt = `Document Context:\n${context.substring(0, 2000)}\n\n`;

    if (selectedText) {
      prompt += `Selected Text: "${selectedText}"\n\n`;
    }

    prompt += `User Question: ${question}\n\n`;
    prompt += `Please provide a helpful response based on the document context.`;

    return prompt;
  }

  private buildSuggestPrompt(documentContent: string, selectedText: string, command?: string): string {
    const context = this.buildContext(documentContent);

    let prompt = `Document so far:\n${context.substring(0, 1500)}\n\n`;

    switch (command) {
      case 'continue':
        prompt += `The user wants to continue writing. Provide the next logical paragraph or section.`;
        break;
      case 'improve':
        prompt += `The user selected: "${selectedText}". Suggest improvements for clarity, style, and grammar.`;
        break;
      case 'fix':
        prompt += `The user selected: "${selectedText}". Fix any grammatical errors and improve readability.`;
        break;
      case 'summarize':
        prompt += `Summarize the main points of the document in 2-3 sentences.`;
        break;
      default:
        prompt += `Based on the selected text: "${selectedText}", provide a helpful suggestion.`;
    }

    return prompt;
  }

  private extractSuggestions(answer: string): string[] {
    // Extract bullet points or numbered items from the response
    const lines = answer.split('\n').filter((line) => {
      const trimmed = line.trim();
      return trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed);
    });

    if (lines.length > 0) {
      return lines.map((line) => line.replace(/^[-*\d.]+\s*/, '').trim());
    }

    // If no bullet points, split by sentences
    const sentences = answer.split(/(?<=[.!?])\s+/).filter((s) => s.length > 10);
    return sentences.slice(0, 3);
  }

  private getMockResponse(question: string, selectedText?: string): any {
    const responses: Record<string, string> = {
      default: '我理解您的问题。根据文档内容，我建议您可以进一步完善当前的段落，使表达更加清晰。',
      'grammar': '语法检查完成。选中的文本没有明显的语法错误，但可以考虑使用更简洁的表达方式。',
      'improve': '建议将长句拆分为短句，并使用更具描述性的词汇来增强可读性。',
    };

    const key = question.toLowerCase().includes('语法') ? 'grammar' :
                question.toLowerCase().includes('改进') ? 'improve' : 'default';

    return {
      answer: responses[key],
      suggestions: [
        '添加更多细节描述',
        '使用更具体的例子',
        '简化复杂句子',
      ],
    };
  }

  private getMockSuggestion(command?: string): any {
    const suggestions: Record<string, string> = {
      continue: '基于当前文档内容，您可以继续阐述下一个要点，或者添加一个实际应用场景来增强说服力。',
      improve: '建议使用更生动的描述性语言，并适当加入数据或案例来支撑观点。',
      fix: '已检查并修正了语法错误。现在句子更加清晰流畅。',
      summarize: '本文档主要讨论了核心主题，涵盖了主要观点和关键细节。',
    };

    return {
      suggestion: suggestions[command || 'continue'],
      command: command || 'continue',
    };
  }
}
