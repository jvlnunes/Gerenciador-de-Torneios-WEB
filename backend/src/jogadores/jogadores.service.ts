import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';

@Injectable()
export class JogadoresService {
  constructor(private prisma: PrismaService) {}

  private async verificarPermissaoTime(
    timeId: string | null,
    user: AuthenticatedUser,
  ) {
    if (!timeId) {
      throw new NotFoundException('Time não encontrado');
    }
    if (user.perfil === 'ADMIN') {
      return;
    }

    const time = await this.prisma.time.findUnique({
      where: { id: timeId },
      select: { torneioId: true },
    });

    if (!time) {
      throw new NotFoundException('Time não encontrado');
    }

    const organizador = await this.prisma.organizadorTorneios.findUnique({
      where: {
        torneioId_usuarioId: {
          torneioId: time.torneioId,
          usuarioId: user.id,
        },
      },
    });

    if (!organizador) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar jogadores deste time',
      );
    }
  }

  async criar(dados: any, user: AuthenticatedUser) {
    await this.verificarPermissaoTime(dados.timeId, user);

    return this.prisma.jogador.create({
      data: dados,
    });
  }

  async listarPorTime(timeId: string) {
    return this.prisma.jogador.findMany({
      where: { timeId },
    });
  }

  async atualizar(id: string, dados: any, user: AuthenticatedUser) {
    const jogador = await this.prisma.jogador.findUnique({
      where: { id },
    });

    if (!jogador) {
      throw new NotFoundException('Jogador não encontrado');
    }

    await this.verificarPermissaoTime(jogador.timeId, user);

    return this.prisma.jogador.update({
      where: { id },
      data: dados,
    });
  }

  async remover(id: string, user: AuthenticatedUser) {
    const jogador = await this.prisma.jogador.findUnique({
      where: { id },
    });

    if (!jogador) {
      throw new NotFoundException('Jogador não encontrado');
    }

    await this.verificarPermissaoTime(jogador.timeId, user);

    return this.prisma.jogador.delete({
      where: { id },
    });
  }
}