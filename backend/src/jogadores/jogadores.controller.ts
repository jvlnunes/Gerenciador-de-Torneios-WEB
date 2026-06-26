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
import { JogadoresService } from './jogadores.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('jogadores')
export class JogadoresController {
  constructor(private readonly jogadoresService: JogadoresService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post()
  criar(@Body() dados: any, @Req() req: AuthenticatedRequest) {
    return this.jogadoresService.criar(dados, req.user);
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post()
  criar(
    @Param('timeId') timeId: string,
    @Body() dados: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.jogadoresService.criar({ ...dados, timeId }, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Put(':jogadorId')
  atualizar(
    @Param('jogadorId') jogadorId: string,
    @Body() dados: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.jogadoresService.atualizar(jogadorId, dados, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Delete(':jogadorId')
  remover(
    @Param('jogadorId') jogadorId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.jogadoresService.remover(jogadorId, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Put(':jogadorId/titular')
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
