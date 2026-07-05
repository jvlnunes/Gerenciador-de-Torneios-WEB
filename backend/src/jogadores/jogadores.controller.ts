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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { JogadoresService } from './jogadores.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@ApiTags('jogadores')
@Controller('jogadores')
export class JogadoresController {
  constructor(private readonly jogadoresService: JogadoresService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post()
  @ApiOperation({ summary: 'Cria um jogador (ADMIN ou GERENTE responsável pelo time)' })
  criar(@Body() dados: any, @Req() req: AuthenticatedRequest) {
    return this.jogadoresService.criar(dados, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista jogadores de um time' })
  @ApiQuery({ name: 'teamId', required: true, description: 'ID do time' })
  listar(@Query('teamId') teamId: string) {
    if (teamId) {
      return this.jogadoresService.listarPorTime(teamId);
    }
    return [];
  }
}

@ApiTags('jogadores')
@Controller('times/:timeId/jogadores')
export class JogadoresPorTimeController {
  constructor(private readonly jogadoresService: JogadoresService) {}

  @Get()
  @ApiOperation({ summary: 'Lista jogadores de um time (via path do time)' })
  listar(@Param('timeId') timeId: string) {
    return this.jogadoresService.listarPorTime(timeId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post()
  @ApiOperation({ summary: 'Cria um jogador vinculado a este time' })
  criar(
    @Param('timeId') timeId: string,
    @Body() dados: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.jogadoresService.criar({ ...dados, timeId }, req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Put(':jogadorId')
  @ApiOperation({ summary: 'Atualiza dados de um jogador' })
  atualizar(
    @Param('jogadorId') jogadorId: string,
    @Body() dados: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.jogadoresService.atualizar(jogadorId, dados, req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Delete(':jogadorId')
  @ApiOperation({ summary: 'Remove um jogador' })
  remover(
    @Param('jogadorId') jogadorId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.jogadoresService.remover(jogadorId, req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Put(':jogadorId/titular')
  @ApiOperation({ summary: 'Marca/desmarca um jogador como titular padrão do time' })
  definirTitular(
    @Param('jogadorId') jogadorId: string,
    @Body() dados: { titular: boolean },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.jogadoresService.atualizar(
      jogadorId,
      { titular: dados.titular },
      req.user,
    );
  }
}