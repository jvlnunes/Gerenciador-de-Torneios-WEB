import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { TorneiosService } from './torneios.service';


@Controller('torneios')
export class TorneiosController {
  constructor(private readonly torneiosService: TorneiosService) {}

  @Post()
  criar(@Body() dados: any) {
    return this.torneiosService.criar(dados);
  }

  @Get()
  listarTodos() {
    return this.torneiosService.listarTodos();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.torneiosService.buscarPorId(id);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dados: any) {
    return this.torneiosService.atualizar(id, dados);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.torneiosService.remover(id);
  }
}