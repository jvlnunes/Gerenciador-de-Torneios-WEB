import { Module } from '@nestjs/common';
import { JogadoresService } from './jogadores.service';
import { JogadoresController, JogadoresPorTimeController } from './jogadores.controller';

@Module({
  providers: [JogadoresService],
  controllers: [JogadoresController, JogadoresPorTimeController],
})
export class JogadoresModule {}