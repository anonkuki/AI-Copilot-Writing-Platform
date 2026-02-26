/**
 * 文档控制器
 * ============================================
 * 本文件是文档相关 API 请求的入口点，类似于公司前台接待员
 *
 * 核心功能：
 * 1. 接收前端发来的 HTTP 请求 - 像是接待员接收客户的请求
 * 2. 验证请求参数 - 检查请求数据是否符合要求
 * 3. 调用业务逻辑处理 - 将请求交给服务层处理
 * 4. 返回响应给前端 - 将处理结果返回给客户端
 *
 * RESTful API 路由设计：
 * - POST /documents   - 创建新文档（对应 create 方法）
 * - GET /documents     - 获取所有文档列表（对应 findAll 方法）
 * - GET /documents/:id - 获取单个文档（对应 findOne 方法）
 * - PUT /documents/:id - 更新文档（对应 update 方法）
 * - DELETE /documents/:id - 删除文档（对应 remove 方法）
 *
 * 路由参数说明：
 * - @Controller('documents') - 定义基础路由为 /documents
 * - @Param('id') - 提取 URL 中的 :id 参数
 * - @Body() - 获取请求体中的数据（JSON 格式）
 *
 * 装饰器说明：
 * - @Get, @Post, @Put, @Delete - HTTP 方法装饰器
 * - @HttpCode - 指定响应的 HTTP 状态码
 * - @Param - 提取 URL 参数
 * - @Body - 提取请求体数据
 */

// 引入 NestJS 常用的装饰器和类型
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
// 引入 JWT 鉴权 Guard
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// 引入文档服务，用于处理业务逻辑
import { DocumentService } from './document.service';
// 引入创建文档的数据传输对象（DTO）
import { CreateDocumentDto } from './dto/create-document.dto';
// 引入更新文档的数据传输对象（DTO）
import { UpdateDocumentDto } from './dto/update-document.dto';

/**
 * 文档控制器
 * @Controller 装饰器将此类标记为控制器
 * 'documents' 定义了基础路由前缀，即所有方法都会在 /documents 路径下
 */
@Controller('documents')
export class DocumentController {
  /**
   * 构造函数
   * 依赖注入 DocumentService
   * private readonly 表示这个属性只能在类内部读取
   * 这样我们就可以在类的方法中调用 documentService 的方法
   */
  constructor(private readonly documentService: DocumentService) {}

  /**
   * 创建文档
   * POST /documents
   * @HttpCode(HttpStatus.CREATED) - 返回 201 状态码（创建成功）
   * @Body() - 接收前端发送的 JSON 数据
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  create(@Body() createDocumentDto: CreateDocumentDto, @Request() req: any) {
    // 调用服务层的创建方法，传入用户ID作为owner
    return this.documentService.create({
      ...createDocumentDto,
      ownerId: req.user.userId,
    });
  }

  /**
   * 获取所有文档
   * GET /documents
   * 不需要任何参数
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req: any) {
    // 调用服务层的获取用户所有文档方法
    return this.documentService.findAllByUser(req.user.userId);
  }

  /**
   * 获取单个文档
   * GET /documents/:id
   * @Param('id') - 提取 URL 中的文档 ID
   * 例如：/documents/abc-123 会获取 ID 为 abc-123 的文档
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    // 调用服务层的获取单个文档方法
    return this.documentService.findOne(id, req.user.userId);
  }

  /**
   * 更新文档
   * PUT /documents/:id
   * @Param('id') - 提取要更新的文档 ID
   * @Body() - 接收更新数据
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Request() req: any,
  ) {
    // 调用服务层的更新方法
    return this.documentService.update(id, updateDocumentDto, req.user.userId);
  }

  /**
   * 删除文档
   * DELETE /documents/:id
   * @HttpCode(HttpStatus.NO_CONTENT) - 返回 204 状态码（删除成功，无内容返回）
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    // 调用服务层的删除方法
    return this.documentService.remove(id, req.user.userId);
  }
}
