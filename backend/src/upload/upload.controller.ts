import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadCover(
    @UploadedFile() file?: any,
    @Body('coverUrl') coverUrl?: string,
  ) {
    if (coverUrl && coverUrl.trim()) {
      return { coverUrl: coverUrl.trim() };
    }

    if (!file) {
      throw new BadRequestException('请上传封面文件或提供 coverUrl');
    }

    const base64 = file.buffer.toString('base64');
    return {
      coverUrl: `data:${file.mimetype};base64,${base64}`,
      fileName: file.originalname,
      size: file.size,
    };
  }
}
