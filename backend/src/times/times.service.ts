import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimesService {
  constructor(private prisma: PrismaService) { }

  async criar(dados: any) {
    return this.prisma.time.create({
      data: dados,
    });
  }

  async listarPorTorneio(torneioId: string) {
    const times = await this.prisma.time.findMany({
      where: { torneioId },
      include: {
        jogadores: true,
        _count: { select: { jogadores: true } }
      }
    });

    return times.map(time => ({
      ...time,
      quantidadeJogadores: time._count.jogadores,
    }));
  }

  async buscarPorId(id: string) {
    const time = await this.prisma.time.findUnique({
      where: { id },
      include: {
        jogadores: true,
        _count: { select: { jogadores: true } }
      }
    });

    if (!time) return null;

    return {
      ...time,
      quantidadeJogadores: time._count.jogadores,
    };
  }

  async atualizar(id: string, dados: any) {
    return this.prisma.time.update({
      where: { id },
      data: dados,
    });
  }

  async remover(id: string) {
    return this.prisma.time.delete({
      where: { id },
    });
  }
}