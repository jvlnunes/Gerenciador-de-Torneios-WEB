import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JogadoresService {
  constructor(private prisma: PrismaService) {}

  async criar(dados: any) {
    return this.prisma.jogador.create({
      data: dados,
    });
  }

  async listarPorTime(timeId: string) {
    return this.prisma.jogador.findMany({
      where: { timeId },
    });
  }

  async atualizar(id: string, dados: any) {
    return this.prisma.jogador.update({
      where: { id },
      data: dados,
    });
  }

  async remover(id: string) {
    return this.prisma.jogador.delete({
      where: { id },
    });
  }
}