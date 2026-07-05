import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegrasTorneioService } from './regras-torneio.service';
import type { UpsertRegrasDto } from './regras-torneio.service';

@ApiTags('regras-torneio')
@Controller('torneios/:torneioId/regras')
export class RegrasTorneioController {
  constructor(private readonly regrasService: RegrasTorneioService) {}

  @Get()
  @ApiOperation({ summary: 'Busca as regras de pontuação de um torneio (ou retorna o padrão)' })
  buscar(@Param('torneioId') torneioId: string) {
    return this.regrasService.buscar(torneioId);
  }

  @Put()
  @ApiOperation({ summary: 'Cria ou atualiza as regras de pontuação de um torneio' })
  atualizar(
    @Param('torneioId') torneioId: string,
    @Body() dados: UpsertRegrasDto,
  ) {
    return this.regrasService.upsert(torneioId, dados);
  }
}