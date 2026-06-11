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

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dados:any){ 
    return this.jogadoresService.atualizar(id, dados);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.jogadoresService.remover(id);
  }
}