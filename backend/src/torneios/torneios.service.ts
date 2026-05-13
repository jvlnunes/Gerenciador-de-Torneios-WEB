import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TorneiosService {
  constructor(private prisma: PrismaService) {}

  async criar(dados: any) {
    const dadosTratados = { ...dados };

    if (dadosTratados.dataInicio) {
      dadosTratados.dataInicio = new Date(dadosTratados.dataInicio);
    }
    if (dadosTratados.dataFim) {
      dadosTratados.dataFim = new Date(dadosTratados.dataFim);
    }

    return this.prisma.torneio.create({
      data: dadosTratados,
    });
  }

  async listarTodos() {
    return this.prisma.torneio.findMany({
      orderBy: { criadoEm: 'desc' }, 
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.torneio.findUnique({
      where: { id },
    });
  }

  async atualizar(id: string, dados: any) {
    const dadosTratados = { ...dados };

    if (dadosTratados.dataInicio) {
      dadosTratados.dataInicio = new Date(dadosTratados.dataInicio);
    }
    if (dadosTratados.dataFim) {
      dadosTratados.dataFim = new Date(dadosTratados.dataFim);
    }

    return this.prisma.torneio.update({
      where: { id },
      data: dadosTratados,
    });
  }

  async remover(id: string) {
    return this.prisma.torneio.delete({
      where: { id },
    });
  }
}