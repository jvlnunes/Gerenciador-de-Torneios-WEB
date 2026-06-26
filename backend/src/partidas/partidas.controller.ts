import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PartidasService } from './partidas.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('partidas')
export class PartidasController {
  constructor(private readonly partidasService: PartidasService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post()
  criar(@Body() dados: any, @Req() req: AuthenticatedRequest) {
    return this.partidasService.criar(dados, req.user);
  }

  @Get()
  listar(
    @Query('torneioId') torneioId: string,
    @Query('tournamentId') tournamentId: string,
  ) {
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Put(':id')
  atualizar(
    @Param('id') id: string,
    @Body() dados: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.partidasService.atualizar(id, dados, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Delete(':id')
  remover(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.partidasService.remover(id, req.user);
  }

  @Get(':id/jogadores')
  listarJogadoresPt(@Param('id') id: string) {
    return this.partidasService.listarJogadores(id);
  }

  @Get(':id/eventos')
  listarEventosPt(@Param('id') id: string) {
    return this.partidasService.listarEventos(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post(':id/eventos')
  registrarEventoPt(
    @Param('id') id: string,
    @Body() dados: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.partidasService.registrarEvento(id, dados, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post(':id/eventos/anular-ultimo')
  anularUltimoEventoPt(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.partidasService.anularUltimoEvento(id, req.user);
  }
}