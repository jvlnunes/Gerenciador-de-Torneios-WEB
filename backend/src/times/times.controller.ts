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

import { TimesService } from './times.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@ApiTags('times')
@Controller('times')
export class TimesController {
  constructor(private readonly timesService: TimesService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post()
  @ApiOperation({ summary: 'Cria um novo time em um torneio (ADMIN ou GERENTE organizador)' })
  criar(@Body() dados: any, @Req() req: AuthenticatedRequest) {
    return this.timesService.criar(dados, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista times de um torneio' })
  @ApiQuery({ name: 'torneioId', required: true, description: 'ID do torneio' })
  listar(@Query('torneioId') torneioId: string) {
    if (torneioId) {
      return this.timesService.listarPorTorneio(torneioId);
    }
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um time por ID' })
  buscarPorId(@Param('id') id: string) {
    return this.timesService.buscarPorId(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um time (apenas organizador do torneio ou ADMIN)' })
  atualizar(
    @Param('id') id: string,
    @Body() dados: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.timesService.atualizar(id, dados, req.user);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Delete(':id')
  @ApiOperation({ summary: 'Remove um time (apenas organizador do torneio ou ADMIN)' })
  remover(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.timesService.remover(id, req.user);
  }
}