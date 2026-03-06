import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('books/:bookId')
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  // ==================== 大纲 ====================
  @Get('outlines')
  async getOutlines(@Param('bookId') bookId: string, @Request() req: any) {
    return this.assistantService.getOutlines(bookId, req.user.userId);
  }

  @Post('outlines')
  async createOutline(
    @Param('bookId') bookId: string,
    @Body() body: { title: string; content?: string },
    @Request() req: any,
  ) {
    return this.assistantService.createOutline(bookId, req.user.userId, body);
  }

  @Put('outlines/:id')
  async updateOutline(
    @Param('bookId') bookId: string,
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; order?: number },
    @Request() req: any,
  ) {
    return this.assistantService.updateOutline(id, req.user.userId, body);
  }

  @Delete('outlines/:id')
  async deleteOutline(@Param('id') id: string, @Request() req: any) {
    return this.assistantService.deleteOutline(id, req.user.userId);
  }

  // ==================== 角色 ====================
  @Get('characters')
  async getCharacters(@Param('bookId') bookId: string, @Request() req: any) {
    return this.assistantService.getCharacters(bookId, req.user.userId);
  }

  @Post('characters')
  async createCharacter(
    @Param('bookId') bookId: string,
    @Body() body: { name: string; role?: string; avatar?: string; bio?: string },
    @Request() req: any,
  ) {
    return this.assistantService.createCharacter(bookId, req.user.userId, body);
  }

  @Put('characters/:id')
  async updateCharacter(
    @Param('id') id: string,
    @Body() body: { name?: string; role?: string; avatar?: string; bio?: string },
    @Request() req: any,
  ) {
    return this.assistantService.updateCharacter(id, req.user.userId, body);
  }

  @Delete('characters/:id')
  async deleteCharacter(@Param('id') id: string, @Request() req: any) {
    return this.assistantService.deleteCharacter(id, req.user.userId);
  }

  // ==================== 灵感 ====================
  @Get('inspirations')
  async getInspirations(@Param('bookId') bookId: string, @Request() req: any) {
    return this.assistantService.getInspirations(bookId, req.user.userId);
  }

  @Post('inspirations')
  async createInspiration(
    @Param('bookId') bookId: string,
    @Body() body: { title: string; content: string; tags?: string[] },
    @Request() req: any,
  ) {
    return this.assistantService.createInspiration(bookId, req.user.userId, body);
  }

  @Put('inspirations/:id')
  async updateInspiration(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; tags?: string[] },
    @Request() req: any,
  ) {
    return this.assistantService.updateInspiration(id, req.user.userId, body);
  }

  @Delete('inspirations/:id')
  async deleteInspiration(@Param('id') id: string, @Request() req: any) {
    return this.assistantService.deleteInspiration(id, req.user.userId);
  }
}
