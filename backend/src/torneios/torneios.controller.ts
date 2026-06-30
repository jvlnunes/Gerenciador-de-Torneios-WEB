import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { TorneiosService } from './torneios.service';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('torneios')
export class TorneiosController {
  constructor(private readonly torneiosService: TorneiosService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post()
  criar(@Body() dados: any, @Req() req: AuthenticatedRequest) {
    return this.torneiosService.criar(dados, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  listarTodos() {
    return this.torneiosService.listarTodos();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.torneiosService.buscarPorId(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Put(':id')
  atualizar(
    @Param('id') id: string,
    @Body() dados: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.torneiosService.atualizar(id, dados, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Delete(':id')
  remover(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.torneiosService.remover(id, req.user);
  }
}
