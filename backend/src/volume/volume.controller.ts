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
import { VolumeService } from './volume.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('books/:bookId/volumes')
@UseGuards(JwtAuthGuard)
export class VolumeController {
  constructor(private readonly volumeService: VolumeService) {}

  @Get()
  async findAll(@Param('bookId') bookId: string, @Request() req: any) {
    return this.volumeService.findAllByBook(bookId, req.user.userId);
  }

  @Post()
  async create(
    @Param('bookId') bookId: string,
    @Body() body: { title?: string },
    @Request() req: any,
  ) {
    return this.volumeService.create(bookId, req.user.userId, body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { title?: string }, @Request() req: any) {
    return this.volumeService.update(id, req.user.userId, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.volumeService.delete(id, req.user.userId);
  }
}
