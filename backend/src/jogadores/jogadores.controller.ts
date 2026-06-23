import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { JogadoresService } from './jogadores.service';

@Controller('jogadores')
export class JogadoresController {
  constructor(private readonly jogadoresService: JogadoresService) {}

  @Post()
  criar(@Body() dados: any) {
    return this.jogadoresService.criar(dados);
  }

  @Get()
  listar(@Query('teamId') teamId: string) {
    if (teamId) {
      return this.jogadoresService.listarPorTime(teamId);
    }
    return [];
  }
}

@Controller('times/:timeId/jogadores')
export class JogadoresPorTimeController {
  constructor(private readonly jogadoresService: JogadoresService) {}

  @Get()
  listar(@Param('timeId') timeId: string) {
    return this.jogadoresService.listarPorTime(timeId);
  }

  @Post()
  criar(@Param('timeId') timeId: string, @Body() dados: any) {
    return this.jogadoresService.criar({ ...dados, timeId });
  }

  @Put(':jogadorId')
  atualizar(@Param('jogadorId') jogadorId: string, @Body() dados: any) {
    return this.jogadoresService.atualizar(jogadorId, dados);
  }

  @Delete(':jogadorId')
  remover(@Param('jogadorId') jogadorId: string) {
    return this.jogadoresService.remover(jogadorId);
  }

  @Put(':jogadorId/titular')
  definirTitular(
    @Param('jogadorId') jogadorId: string,
    @Body() dados: { titular: boolean },
  ) {
    return this.jogadoresService.atualizar(jogadorId, { titular: dados.titular });
  }
}