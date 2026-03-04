export const ERROR_CODES = {
  // 通用错误 (1xxx)
  INVALID_PARAMETER: { code: 1001, message: '参数错误' },
  UNAUTHORIZED: { code: 1002, message: '未授权' },
  FORBIDDEN: { code: 1003, message: '禁止访问' },
  NOT_FOUND: { code: 1004, message: '资源不存在' },
  INTERNAL_ERROR: { code: 1005, message: '服务器内部错误' },
  SERVICE_UNAVAILABLE: { code: 1006, message: '服务不可用' },
  RATE_LIMIT_EXCEEDED: { code: 1007, message: '请求频率过高，请稍后再试' },
  VALIDATION_FAILED: { code: 1008, message: '数据校验失败' },

  // 认证错误 (2xxx)
  INVALID_TOKEN: { code: 2001, message: 'Token 无效' },
  TOKEN_EXPIRED: { code: 2002, message: 'Token 已过期' },
  INVALID_CREDENTIALS: { code: 2003, message: '用户名或密码错误' },
  USER_EXISTS: { code: 2004, message: '用户已存在' },
  USER_NOT_FOUND: { code: 2005, message: '用户不存在' },

  // 文档错误 (3xxx)
  DOCUMENT_NOT_FOUND: { code: 3001, message: '文档不存在' },
  DOCUMENT_FORBIDDEN: { code: 3002, message: '无权限操作此文档' },
  DOCUMENT_LOCKED: { code: 3003, message: '文档已被锁定' },
  VERSION_CONFLICT: { code: 3004, message: '版本冲突' },

  // 团队错误 (4xxx)
  TEAM_NOT_FOUND: { code: 4001, message: '团队不存在' },
  TEAM_FULL: { code: 4002, message: '团队成员已满' },
  ALREADY_MEMBER: { code: 4003, message: '已是团队成员' },
  INVITE_EXPIRED: { code: 4004, message: '邀请已过期' },

  // AI/Agent 错误 (5xxx)
  AI_SERVICE_ERROR: { code: 5001, message: 'AI 服务调用失败' },
  AI_QUOTA_EXCEEDED: { code: 5002, message: 'AI 调用次数超限' },
  AI_TIMEOUT: { code: 5003, message: 'AI 服务响应超时' },
  AI_PARSE_ERROR: { code: 5004, message: 'AI 响应解析失败' },
  AGENT_SESSION_FAILED: { code: 5005, message: 'Agent 会话执行失败' },
  CONSISTENCY_CHECK_FAILED: { code: 5006, message: '一致性检查执行失败' },

  // 书籍/章节错误 (6xxx)
  BOOK_NOT_FOUND: { code: 6001, message: '书籍不存在' },
  CHAPTER_NOT_FOUND: { code: 6002, message: '章节不存在' },
  SCENE_NOT_FOUND: { code: 6003, message: '场景不存在' },
  CHARACTER_NOT_FOUND: { code: 6004, message: '角色不存在' },
  FORESHADOWING_NOT_FOUND: { code: 6005, message: '伏笔不存在' },
  WORLD_SETTING_NOT_FOUND: { code: 6006, message: '世界观设定不存在' },
  PLOT_LINE_NOT_FOUND: { code: 6007, message: '剧情线不存在' },

  // RAG/Embedding 错误 (7xxx)
  EMBEDDING_FAILED: { code: 7001, message: '向量嵌入生成失败' },
  RAG_INDEX_FAILED: { code: 7002, message: 'RAG 索引构建失败' },
  RAG_RETRIEVE_FAILED: { code: 7003, message: 'RAG 检索失败' },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

/**
 * 创建带业务错误码的 HttpException
 */
import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    errorCode: ErrorCode,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    detail?: string,
  ) {
    const { code, message } = ERROR_CODES[errorCode];
    super(
      {
        errorCode: code,
        error: errorCode,
        message: detail || message,
      },
      httpStatus,
    );
  }
}
