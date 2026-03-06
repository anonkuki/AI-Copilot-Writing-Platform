import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ERROR_CODES } from '../constants/error-codes';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode: number = ERROR_CODES.INTERNAL_ERROR.code;
    let message: string | string[] = '服务器内部错误';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        message = resp.message || exception.message;
        error = resp.error || this.httpStatusToErrorText(status);
        // 支持 BusinessException 传递的 errorCode
        if (resp.errorCode) {
          errorCode = resp.errorCode;
        } else {
          errorCode = this.httpStatusToErrorCode(status);
        }
      } else {
        message = String(exceptionResponse);
        error = this.httpStatusToErrorText(status);
        errorCode = this.httpStatusToErrorCode(status);
      }
    } else if (this.isPrismaError(exception)) {
      // Prisma 已知错误处理
      const prismaError = exception as any;
      switch (prismaError.code) {
        case 'P2025': // Record not found
          status = HttpStatus.NOT_FOUND;
          errorCode = ERROR_CODES.NOT_FOUND.code;
          message = '请求的资源不存在';
          error = 'Not Found';
          break;
        case 'P2002': // Unique constraint violation
          status = HttpStatus.CONFLICT;
          errorCode = ERROR_CODES.INVALID_PARAMETER.code;
          message = '数据重复，违反唯一约束';
          error = 'Conflict';
          break;
        default:
          message = '数据库操作失败';
          error = 'Database Error';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // 对 AI 服务超时做特殊处理
      if (exception.message.includes('timeout') || exception.message.includes('ETIMEDOUT')) {
        status = HttpStatus.GATEWAY_TIMEOUT;
        errorCode = ERROR_CODES.AI_TIMEOUT.code;
        message = 'AI 服务响应超时';
        error = 'Gateway Timeout';
      }
    }

    // 错误日志
    const logMessage = `[${errorCode}] ${status} ${request.method} ${request.url} - ${Array.isArray(message) ? message.join('; ') : message}`;
    if (status >= 500) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : '');
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode,
      error,
      message: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private isPrismaError(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      (exception as any).code.startsWith('P')
    );
  }

  private httpStatusToErrorCode(status: number): number {
    switch (status) {
      case 400:
        return ERROR_CODES.INVALID_PARAMETER.code;
      case 401:
        return ERROR_CODES.UNAUTHORIZED.code;
      case 403:
        return ERROR_CODES.FORBIDDEN.code;
      case 404:
        return ERROR_CODES.NOT_FOUND.code;
      case 429:
        return ERROR_CODES.RATE_LIMIT_EXCEEDED.code;
      default:
        return ERROR_CODES.INTERNAL_ERROR.code;
    }
  }

  private httpStatusToErrorText(status: number): string {
    switch (status) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 409:
        return 'Conflict';
      case 422:
        return 'Unprocessable Entity';
      case 429:
        return 'Too Many Requests';
      case 504:
        return 'Gateway Timeout';
      default:
        return 'Internal Server Error';
    }
  }
}
