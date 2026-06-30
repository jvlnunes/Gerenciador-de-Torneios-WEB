import { Module } from '@nestjs/common';
import { RegrasTorneioService } from './regras-torneio.service';
import { RegrasTorneioController } from './regras-torneio.controller';

@Module({
  providers: [RegrasTorneioService],
  controllers: [RegrasTorneioController],
  exports: [RegrasTorneioService],
})
export class RegrasTorneioModule {}