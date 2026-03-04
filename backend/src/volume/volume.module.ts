import { Module } from '@nestjs/common';
import { VolumeService } from './volume.service';
import { VolumeController } from './volume.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [VolumeController],
  providers: [VolumeService, PrismaService],
  exports: [VolumeService],
})
export class VolumeModule {}
