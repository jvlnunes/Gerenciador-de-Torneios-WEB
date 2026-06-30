import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UpsertRegrasDto {
  setsParaVencer?: number;
  pontosPorSet?: number;
  pontosTieBreak?: number;
  vantagemDoisPontos?: boolean;
  limiteJogadoresPorTime?: number | null;
}

@Injectable()
export class RegrasTorneioService {
  constructor(private prisma: PrismaService) {}

  async buscar(torneioId: string) {
    const torneio = await this.prisma.torneio.findUnique({
      where: { id: torneioId },
    });
    if (!torneio) throw new NotFoundException('Torneio não encontrado');

    const regras = await this.prisma.regrasTorneio.findUnique({
      where: { torneioId },
    });

    if (!regras) {
      return this.padrao(torneioId);
    }

    return regras;
  }

  async upsert(torneioId: string, dados: UpsertRegrasDto) {
    const torneio = await this.prisma.torneio.findUnique({
      where: { id: torneioId },
    });
    if (!torneio) throw new NotFoundException('Torneio não encontrado');

    return this.prisma.regrasTorneio.upsert({
      where: { torneioId },
      update: {
        ...(dados.setsParaVencer !== undefined && { setsParaVencer: dados.setsParaVencer }),
        ...(dados.pontosPorSet !== undefined && { pontosPorSet: dados.pontosPorSet }),
        ...(dados.pontosTieBreak !== undefined && { pontosTieBreak: dados.pontosTieBreak }),
        ...(dados.vantagemDoisPontos !== undefined && { vantagemDoisPontos: dados.vantagemDoisPontos }),
        ...(dados.limiteJogadoresPorTime !== undefined && { limiteJogadoresPorTime: dados.limiteJogadoresPorTime }),
      },
      create: {
        torneioId,
        setsParaVencer:        dados.setsParaVencer        ?? 3,
        pontosPorSet:          dados.pontosPorSet          ?? 25,
        pontosTieBreak:        dados.pontosTieBreak        ?? 15,
        vantagemDoisPontos:    dados.vantagemDoisPontos    ?? true,
        limiteJogadoresPorTime: dados.limiteJogadoresPorTime ?? 6,
      },
    });
  }

  private padrao(torneioId: string) {
    return {
      id: null,
      torneioId,
      setsParaVencer: 3,
      pontosPorSet: 25,
      pontosTieBreak: 15,
      vantagemDoisPontos: true,
      limiteJogadoresPorTime: 6,
    };
  }
}