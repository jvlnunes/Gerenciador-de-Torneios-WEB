import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimesService {
  constructor(private prisma: PrismaService) {}

  async criar(dados: any) {
    return this.prisma.time.create({
      data: dados,
    });
  }

  async listarPorTorneio(torneioId: string) {
    return this.prisma.time.findMany({
      where: { torneioId },
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.time.findUnique({
      where: { id },
    });
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