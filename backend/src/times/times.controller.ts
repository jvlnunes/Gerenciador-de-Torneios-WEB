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

import { TimesService } from './times.service';
import { JwtAuthGuard, AuthenticatedUser } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('times')
export class TimesController {
  constructor(private readonly timesService: TimesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Post()
  criar(@Body() dados: any, @Req() req: AuthenticatedRequest) {
    return this.timesService.criar(dados, req.user);
  }

  @Get()
  listar(@Query('torneioId') torneioId: string) {
    if (torneioId) {
      return this.timesService.listarPorTorneio(torneioId);
    }
    return [];
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.timesService.buscarPorId(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Put(':id')
  atualizar(
    @Param('id') id: string,
    @Body() dados: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.timesService.atualizar(id, dados, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'GERENTE')
  @Delete(':id')
  remover(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.timesService.remover(id, req.user);
  }
}
