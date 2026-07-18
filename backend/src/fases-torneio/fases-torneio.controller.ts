import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FasesTorneioService } from './fases-torneio.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { CriarFaseDto } from './dto/criar-fase.dto';
import { AtualizarConfiguracaoRachaDto } from './dto/atualizar-configuracao-racha.dto';
import { AdicionarPoolDto } from './dto/adicionar-pool.dto';
import { SortearTimesDto } from './dto/sortear-times.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

/* ── Fases de um torneio ────────────────────────────────────── */
@ApiTags('fases-torneio')
@Controller('torneios/:torneioId/fases')
export class FasesTorneioController {
  constructor(private readonly service: FasesTorneioService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post()
  @ApiOperation({ summary: 'Cria uma fase no torneio (RACHA só pode ser fase única)' })
  criar(
    @Param('torneioId') torneioId: string,
    @Body() dados: CriarFaseDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.criarFase(torneioId, dados, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista as fases do torneio' })
  listar(@Param('torneioId') torneioId: string) {
    return this.service.listarFases(torneioId);
  }
}

/* ── Uma fase específica (config, pool, sorteio, fila) ───────── */
@ApiTags('fases-torneio')
@Controller('fases')
export class FaseController {
  constructor(private readonly service: FasesTorneioService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma fase por ID' })
  buscar(@Param('id') id: string) {
    return this.service.buscarFase(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma fase' })
  remover(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.removerFase(id, req.user);
  }

  /* Configuração Racha */
  @Get(':id/configuracao-racha')
  @ApiOperation({ summary: 'Busca a configuração da fase RACHA (cria com defaults se não existir)' })
  buscarConfiguracaoRacha(@Param('id') id: string) {
    return this.service.buscarConfiguracaoRacha(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Put(':id/configuracao-racha')
  @ApiOperation({ summary: 'Atualiza a configuração da fase RACHA' })
  atualizarConfiguracaoRacha(
    @Param('id') id: string,
    @Body() dados: AtualizarConfiguracaoRachaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.atualizarConfiguracaoRacha(id, dados, req.user);
  }

  /* Pool de jogadores */
  @Get(':id/pool')
  @ApiOperation({ summary: 'Lista a pool de jogadores da fase' })
  listarPool(@Param('id') id: string) {
    return this.service.listarPool(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post(':id/pool')
  @ApiOperation({ summary: 'Adiciona jogadores (existentes e/ou novos) à pool da fase' })
  adicionarPool(
    @Param('id') id: string,
    @Body() dados: AdicionarPoolDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.adicionarPool(id, dados, req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Delete(':id/pool/:jogadorId')
  @ApiOperation({ summary: 'Remove um jogador da pool da fase' })
  removerDaPool(
    @Param('id') id: string,
    @Param('jogadorId') jogadorId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.removerDaPool(id, jogadorId, req.user);
  }

  /* Sorteio de times */
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post(':id/pool/sortear')
  @ApiOperation({ summary: 'Sorteia times a partir da pool de jogadores da fase' })
  sortearTimes(
    @Param('id') id: string,
    @Body() dados: SortearTimesDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.sortearTimes(id, dados, req.user);
  }

  /* Fila "rei da quadra" */
  @Get(':id/fila-racha')
  @ApiOperation({ summary: 'Busca o estado atual da fila do racha' })
  buscarFila(@Param('id') id: string) {
    return this.service.buscarFilaRacha(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post(':id/fila-racha/iniciar')
  @ApiOperation({ summary: 'Inicia a fila do racha (sorteia ordem e cria a 1ª partida)' })
  iniciarFila(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.iniciarFilaRacha(id, req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post(':id/fila-racha/avancar')
  @ApiOperation({ summary: 'Avança a fila após o fim de uma partida, gerando o próximo confronto' })
  avancarFila(
    @Param('id') id: string,
    @Body() dados: { timeVencedorId: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.avancarFilaRacha(id, dados, req.user);
  }
}