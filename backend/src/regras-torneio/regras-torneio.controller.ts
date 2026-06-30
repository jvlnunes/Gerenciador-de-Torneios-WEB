import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { RegrasTorneioService } from './regras-torneio.service';
import type { UpsertRegrasDto } from './regras-torneio.service';

@Controller('torneios/:torneioId/regras')
export class RegrasTorneioController {
  constructor(private readonly regrasService: RegrasTorneioService) {}

  @Get()
  buscar(@Param('torneioId') torneioId: string) {
    return this.regrasService.buscar(torneioId);
  }

  @Put()
  atualizar(
    @Param('torneioId') torneioId: string,
    @Body() dados: UpsertRegrasDto,
  ) {
    return this.regrasService.upsert(torneioId, dados);
  }
}