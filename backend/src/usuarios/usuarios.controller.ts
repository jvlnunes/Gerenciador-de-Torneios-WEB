import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('usuarios')
@ApiBearerAuth('access-token')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  @ApiOperation({ summary: 'Lista todos os usuários cadastrados (apenas ADMIN)' })
  listar() {
    return this.usuariosService.listarTodos();
  }

  // Esta rota permite que um ADMIN crie usuários já com perfil definido.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Cria um usuário já com perfil definido (apenas ADMIN)' })
  criar(@Body() dados: { nome: string; email: string; senha: string; perfil?: string }) {
    return this.usuariosService.criar(dados);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put(':id')
  @ApiOperation({ summary: 'Atualiza dados/perfil de um usuário (apenas ADMIN)' })
  atualizar(
    @Param('id') id: string,
    @Body() dados: { nome?: string; email?: string; senha?: string; perfil?: string },
  ) {
    return this.usuariosService.atualizar(id, dados);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Remove um usuário (apenas ADMIN)' })
  remover(@Param('id') id: string) {
    return this.usuariosService.remover(id);
  }
}