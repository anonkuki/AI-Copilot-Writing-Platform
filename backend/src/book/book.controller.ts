import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { BookService } from './book.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('books')
@UseGuards(JwtAuthGuard)
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.bookService.findAll(req.user.userId);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.bookService.getStats(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.bookService.findOne(id, req.user.userId);
  }

  @Post()
  async create(
    @Body() body: { title?: string; description?: string; cover?: string },
    @Request() req: any,
  ) {
    return this.bookService.create(req.user.userId, body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      cover?: string;
      status?: string;
      wordCount?: number;
    },
    @Request() req: any,
  ) {
    return this.bookService.update(id, req.user.userId, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.bookService.delete(id, req.user.userId);
  }
}
