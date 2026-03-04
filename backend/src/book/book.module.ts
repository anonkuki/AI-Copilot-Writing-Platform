import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { PrismaService } from '../prisma.service';
import { BookAliasController } from './book-alias.controller';

@Module({
  controllers: [BookController, BookAliasController],
  providers: [BookService, PrismaService],
  exports: [BookService],
})
export class BookModule {}
