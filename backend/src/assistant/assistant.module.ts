import { Module } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { AssistantController } from './assistant.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AssistantController],
  providers: [AssistantService, PrismaService],
  exports: [AssistantService],
})
export class AssistantModule {}
