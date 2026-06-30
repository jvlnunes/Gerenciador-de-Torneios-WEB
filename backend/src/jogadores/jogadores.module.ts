import { Module } from '@nestjs/common';
import { JogadoresService } from './jogadores.service';
import { AuthModule } from '../auth/auth.module';
import {
  JogadoresController,
  JogadoresPorTimeController,
} from './jogadores.controller';

@Module({
  imports: [AuthModule],
  providers: [JogadoresService],
  controllers: [JogadoresController, JogadoresPorTimeController],
})
export class JogadoresModule {}
