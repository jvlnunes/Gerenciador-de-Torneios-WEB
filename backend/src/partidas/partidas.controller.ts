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
import { PartidasService } from './partidas.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@ApiTags('partidas')
@Controller('partidas')
export class PartidasController {
  constructor(private readonly partidasService: PartidasService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post()
  @ApiOperation({ summary: 'Cria uma nova partida entre dois times de um torneio' })
  criar(@Body() dados: any, @Req() req: AuthenticatedRequest) {
    return this.partidasService.criar(dados, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista partidas de um torneio' })
  @ApiQuery({ name: 'torneioId', required: false })
  @ApiQuery({ name: 'tournamentId', required: false, description: 'Alias de torneioId' })
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
  @ApiOperation({ summary: 'Busca uma partida por ID, incluindo regras aplicadas' })
  buscarPorId(@Param('id') id: string) {
    return this.partidasService.buscarPorId(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma partida (status, placar de sets, etc.)' })
  atualizar(
    @Param('id') id: string,
    @Body() dados: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.partidasService.atualizar(id, dados, req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma partida' })
  remover(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.partidasService.remover(id, req.user);
  }

  @Get(':id/jogadores')
  @ApiOperation({ summary: 'Lista o elenco disponível (casa + visitante) para a partida' })
  listarJogadoresPt(@Param('id') id: string) {
    return this.partidasService.listarJogadores(id);
  }

  @Get(':id/eventos')
  @ApiOperation({ summary: 'Lista os eventos (pontos, erros, cartões) não anulados da partida' })
  listarEventosPt(@Param('id') id: string) {
    return this.partidasService.listarEventos(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post(':id/eventos')
  @ApiOperation({ summary: 'Registra um novo evento (ponto, erro ou cartão) na partida ao vivo' })
  registrarEventoPt(
    @Param('id') id: string,
    @Body() dados: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.partidasService.registrarEvento(id, dados, req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post(':id/eventos/anular-ultimo')
  @ApiOperation({ summary: 'Anula o último evento registrado na partida' })
  anularUltimoEventoPt(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.partidasService.anularUltimoEvento(id, req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post(':id/escalacao')
  @ApiOperation({ summary: 'Salva a escalação (titulares/banco) de casa e visitante para um set' })
  salvarEscalacao(
    @Param('id') id: string,
    @Body() dados: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.partidasService.salvarEscalacao(id, dados, req.user);
  }

  @Get(':id/escalacao')
  @ApiOperation({ summary: 'Lista a escalação salva de um set específico' })
  @ApiQuery({ name: 'indiceSet', required: true, description: 'Índice do set (0-based)' })
  listarEscalacao(
    @Param('id') id: string,
    @Query('indiceSet') indiceSet: string,
  ) {
    return this.partidasService.listarEscalacao(id, Number(indiceSet));
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post(':id/substituicoes')
  @ApiOperation({ summary: 'Registra uma substituição de jogador durante um set' })
  registrarSubstituicao(
    @Param('id') id: string,
    @Body() dados: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.partidasService.registrarSubstituicao(id, dados, req.user);
  }

  @Get(':id/substituicoes')
  @ApiOperation({ summary: 'Lista substituições da partida (opcionalmente filtradas por set)' })
  @ApiQuery({ name: 'indiceSet', required: false, description: 'Índice do set (0-based)' })
  listarSubstituicoes(
    @Param('id') id: string,
    @Query('indiceSet') indiceSet?: string,
  ) {
    return this.partidasService.listarSubstituicoes(
      id,
      indiceSet !== undefined ? Number(indiceSet) : undefined,
    );
  }
}