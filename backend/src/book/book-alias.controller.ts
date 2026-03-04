import { Body, Controller, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookService } from './book.service';

@Controller('book')
@UseGuards(JwtAuthGuard)
export class BookAliasController {
  constructor(private readonly bookService: BookService) {}

  @Post('create')
  async create(
    @Body() body: { title?: string; description?: string; cover?: string },
    @Request() req: any,
  ) {
    return this.bookService.create(req.user.userId, body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.bookService.findOne(id, req.user.userId);
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
    },
    @Request() req: any,
  ) {
    return this.bookService.update(id, req.user.userId, body as any);
  }
}
