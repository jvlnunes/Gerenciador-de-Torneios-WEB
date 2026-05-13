import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TimesService } from './times.service';

@Controller('times')
export class TimesController {
  constructor(private readonly timesService: TimesService) {}

  @Post()
  criar(@Body() dados: any) {
    return this.timesService.criar(dados);
  }

  @Get()
  listar(@Query('torneioId') torneioId: string) {
    if (torneioId) {
      return this.timesService.listarPorTorneio(torneioId);
    }
    return [];
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.timesService.buscarPorId(id);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dados: any) {
    return this.timesService.atualizar(id, dados);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.timesService.remover(id);
  }
}