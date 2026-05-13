import { Module } from '@nestjs/common';
import { JogadoresService } from './jogadores.service';
import { JogadoresController } from './jogadores.controller';

@Module({
  providers: [JogadoresService],
  controllers: [JogadoresController]
})
export class JogadoresModule {}
