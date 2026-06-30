import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';

@Injectable()
export class TimesService {
  constructor(private prisma: PrismaService) {}

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
        'Você não tem permissão para alterar times deste torneio',
      );
    }
  }

  async criar(dados: any, user: AuthenticatedUser) {
    await this.verificarPermissaoTorneio(dados.torneioId, user);

    return this.prisma.time.create({
      data: dados,
    });
  }

  async listarPorTorneio(torneioId: string) {
    const times = await this.prisma.time.findMany({
      where: { torneioId },
      include: {
        jogadores: true,
        _count: { select: { jogadores: true } },
      },
    });

    return times.map((time) => ({
      ...time,
      quantidadeJogadores: time._count.jogadores,
    }));
  }

  async buscarPorId(id: string) {
    const time = await this.prisma.time.findUnique({
      where: { id },
      include: {
        jogadores: true,
        _count: { select: { jogadores: true } },
      },
    });

    if (!time) {
      throw new NotFoundException('Time não encontrado');
    }

    return {
      ...time,
      quantidadeJogadores: time._count.jogadores,
    };
  }

  async atualizar(id: string, dados: any, user: AuthenticatedUser) {
    const time = await this.prisma.time.findUnique({
      where: { id },
    });

    if (!time) {
      throw new NotFoundException('Time não encontrado');
    }

    await this.verificarPermissaoTorneio(time.torneioId, user);

    return this.prisma.time.update({
      where: { id },
      data: dados,
    });
  }

  async remover(id: string, user: AuthenticatedUser) {
    const time = await this.prisma.time.findUnique({
      where: { id },
    });

    if (!time) {
      throw new NotFoundException('Time não encontrado');
    }

    await this.verificarPermissaoTorneio(time.torneioId, user);

    return this.prisma.time.delete({
      where: { id },
    });
  }
}
