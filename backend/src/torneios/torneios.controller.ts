import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TorneiosService } from './torneios.service';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { CriarTorneioDto } from './dto/criar-torneio.dto';
import { AtualizarTorneioDto } from './dto/atualizar-torneio.dto';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@ApiTags('torneios')
@Controller('torneios')
export class TorneiosController {
  constructor(private readonly torneiosService: TorneiosService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post()
  @ApiOperation({ summary: 'Cria um novo torneio (ADMIN ou GERENTE)' })
  criar(@Body() dados: CriarTorneioDto, @Req() req: AuthenticatedRequest) {
    return this.torneiosService.criar(dados, req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Lista todos os torneios' })
  listarTodos() {
    return this.torneiosService.listarTodos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um torneio por ID (público)' })
  buscarPorId(@Param('id') id: string) {
    return this.torneiosService.buscarPorId(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um torneio (apenas organizador ou ADMIN)' })
  atualizar(
    @Param('id') id: string,
    @Body() dados: AtualizarTorneioDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.torneiosService.atualizar(id, dados, req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Delete(':id')
  @ApiOperation({ summary: 'Remove um torneio (apenas organizador ou ADMIN)' })
  remover(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.torneiosService.remover(id, req.user);
  }
}