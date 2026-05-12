import { Module } from '@nestjs/common';
import { TorneiosService } from './torneios.service';
import { TorneiosController } from './torneios.controller';

@Module({
  providers: [TorneiosService],
  controllers: [TorneiosController]
})
export class TorneiosModule {}
