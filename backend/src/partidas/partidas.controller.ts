import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PartidasService } from './partidas.service';

@Controller('partidas') 
export class PartidasController {
  constructor(private readonly partidasService: PartidasService) {}

  @Post()
  criar(@Body() dados: any) {
    return this.partidasService.criar(dados);
  }

  @Get()
  listar(@Query('torneioId') torneioId: string, @Query('tournamentId') tournamentId: string) {
    const id = torneioId || tournamentId;
    if (id) {
      return this.partidasService.listarPorTorneio(id);
    }
    return [];
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.partidasService.buscarPorId(id);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dados: any) {
    return this.partidasService.atualizar(id, dados);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.partidasService.remover(id);
  }
  
  // @Get(':id/players')
  // listarJogadoresEn(@Param('id') id: string) {
  //   return this.partidasService.listarJogadores(id);
  // }

  @Get(':id/jogadores')
  listarJogadoresPt(@Param('id') id: string) {
    return this.partidasService.listarJogadores(id);
  }

  // @Get(':id/events')
  // listarEventosEn(@Param('id') id: string) {
  //   return this.partidasService.listarEventos(id);
  // }

  @Get(':id/eventos')
  listarEventosPt(@Param('id') id: string) {
    return this.partidasService.listarEventos(id);
  }

  // @Post(':id/events')
  // registrarEventoEn(@Param('id') id: string, @Body() dados: any) {
  //   return this.partidasService.registrarEvento(id, dados);
  // }

  @Post(':id/eventos')
  registrarEventoPt(@Param('id') id: string, @Body() dados: any) {
    return this.partidasService.registrarEvento(id, dados);
  }

  // @Post(':id/events/void-last')
  // anularUltimoEventoEn(@Param('id') id: string) {
  //   return this.partidasService.anularUltimoEvento(id);
  // }

  @Post(':id/eventos/anular-ultimo')
  anularUltimoEventoPt(@Param('id') id: string) {
    return this.partidasService.anularUltimoEvento(id);
  }
}