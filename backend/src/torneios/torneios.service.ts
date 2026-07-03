import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';

@Injectable()
export class TorneiosService {
  constructor(private prisma: PrismaService) {}

  private tratarDatas(dados: any) {
    const dadosTratados = { ...dados };

    if (dadosTratados.dataInicio) {
      dadosTratados.dataInicio = new Date(dadosTratados.dataInicio);
    }

    if (dadosTratados.dataFim) {
      dadosTratados.dataFim = new Date(dadosTratados.dataFim);
    }

    return dadosTratados;
  }

  private async verificarPermissaoTorneio(
    torneioId: string,
    user: AuthenticatedUser,
  ) {
    if (user.perfil === 'ADMIN') {
      return;
    }

    const organizador = await this.prisma.organizadorTorneios.findUnique({
      where: {
        torneioId_usuarioId: {
          torneioId,
          usuarioId: user.id,
        },
      },
    });

    if (!organizador) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar este torneio',
      );
    }
  }

  async criar(dados: any, user: AuthenticatedUser) {
    const dadosTratados = this.tratarDatas(dados);

    return this.prisma.torneio.create({
      data: {
        ...dadosTratados,
        organizadores: {
          create: {
            usuarioId: user.id,
          },
        },
      },
    });
  }

  async listarTodos() {
    return this.prisma.torneio.findMany({
      orderBy: { criadoEm: 'desc' },
      include: { organizadores: { select: { usuarioId: true } } },
    });
  }

  async buscarPorId(id: string) {
    const torneio = await this.prisma.torneio.findUnique({
      where: { id },
      include: { organizadores: { select: { usuarioId: true } } },
    });

    if (!torneio) {
      throw new NotFoundException('Torneio não encontrado');
    }

    return torneio;
  }

  async atualizar(id: string, dados: any, user: AuthenticatedUser) {
    await this.verificarPermissaoTorneio(id, user);

    const dadosTratados = this.tratarDatas(dados);

    return this.prisma.torneio.update({
      where: { id },
      data: dadosTratados,
    });
  }

  async remover(id: string, user: AuthenticatedUser) {
    await this.verificarPermissaoTorneio(id, user);

    return this.prisma.torneio.delete({
      where: { id },
    });
  }
}