import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';

const REGRAS_PADRAO = {
  setsParaVencer: 3,
  pontosPorSet: 25,
  pontosTieBreak: 15,
  vantagemDoisPontos: true,
  limiteJogadoresPorTime: 6,
};

@Injectable()
export class PartidasService {
  constructor(private prisma: PrismaService) { }

  private normalizarDateTime(valor: any): string | undefined {
    if (!valor) return undefined;
    const str = typeof valor === 'string' ? valor : valor.toString();
    if (/[Z+-]\d{2}:\d{2}|Z$/.test(str)) return str;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(str)) return str + 'Z';
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) return str + ':00Z';
    return str;
  }

  private async buscarRegras(torneioId: string) {
    const regras = await this.prisma.regrasTorneio.findUnique({
      where: { torneioId },
    });
    return {
      setsParaVencer: regras?.setsParaVencer ?? REGRAS_PADRAO.setsParaVencer,
      pontosPorSet: regras?.pontosPorSet ?? REGRAS_PADRAO.pontosPorSet,
      pontosTieBreak: regras?.pontosTieBreak ?? REGRAS_PADRAO.pontosTieBreak,
      vantagemDoisPontos:
        regras?.vantagemDoisPontos ?? REGRAS_PADRAO.vantagemDoisPontos,
      limiteJogadoresPorTime:
        regras?.limiteJogadoresPorTime ??
        REGRAS_PADRAO.limiteJogadoresPorTime,
    };
  }

  private formatarPartida(
    partida: any,
    regras: ReturnType<typeof this.buscarRegras> extends Promise<infer T>
      ? T
      : never,
  ) {
    return {
      ...partida,
      nomeTimeCasa: partida.timeCasa.nome,
      nomeTimeVisitante: partida.timeVisitante.nome,
      sets: [],
      pontosParaVencerSet: regras.pontosPorSet,
      pontosParaVencerUltimoSet: regras.pontosTieBreak,
      setsParaVencerPartida: regras.setsParaVencer,
      titularesPorTime: regras.limiteJogadoresPorTime ?? 6,
      vantagemDoisPontos: regras.vantagemDoisPontos,
    };
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
        'Você não tem permissão para alterar partidas deste torneio',
      );
    }
  }

  async criar(dados: any, user: AuthenticatedUser) {
    await this.verificarPermissaoTorneio(dados.torneioId, user);

    const dadosFormatados = {
      ...dados,
      agendadoPara: this.normalizarDateTime(dados.agendadoPara),
    };

    const partidaCriada = await this.prisma.partida.create({
      data: dadosFormatados,
      include: { timeCasa: true, timeVisitante: true },   // 👈 adiciona isso
    });

    const regras = await this.buscarRegras(partidaCriada.torneioId);

    return this.formatarPartida(partidaCriada, regras);   // 👈 formata igual aos outros métodos
  }

  async listarPorTorneio(torneioId: string) {
    const [partidas, regras] = await Promise.all([
      this.prisma.partida.findMany({
        where: { torneioId },
        include: { timeCasa: true, timeVisitante: true },
      }),
      this.buscarRegras(torneioId),
    ]);

    return partidas.map((p) => this.formatarPartida(p, regras));
  }

  async buscarPorId(id: string) {
    const partida = await this.prisma.partida.findUnique({
      where: { id },
      include: { timeCasa: true, timeVisitante: true },
    });
    if (!partida) throw new NotFoundException('Partida não encontrada');

    const regras = await this.buscarRegras(partida.torneioId);
    return this.formatarPartida(partida, regras);
  }

  async atualizar(id: string, dados: any, user: AuthenticatedUser) {
    const partida = await this.prisma.partida.findUnique({
      where: { id },
    });

    if (!partida) {
      throw new NotFoundException('Partida não encontrada');
    }

    await this.verificarPermissaoTorneio(partida.torneioId, user);

    const dadosFormatados = {
      ...dados,
      agendadoPara: dados.agendadoPara
        ? this.normalizarDateTime(dados.agendadoPara)
        : undefined,
    };
    return this.prisma.partida.update({
      where: { id },
      data: dadosFormatados,
    });
  }

  async remover(id: string, user: AuthenticatedUser) {
    const partida = await this.prisma.partida.findUnique({
      where: { id },
    });

    if (!partida) {
      throw new NotFoundException('Partida não encontrada');
    }

    await this.verificarPermissaoTorneio(partida.torneioId, user);

    return this.prisma.partida.delete({
      where: { id },
    });
  }

  async listarJogadores(partidaId: string) {
    const partida = await this.prisma.partida.findUnique({
      where: { id: partidaId },
      select: { timeCasaId: true, timeVisitanteId: true },
    });
    if (!partida) return [];

    const jogadores = await this.prisma.jogador.findMany({
      where: {
        OR: [
          { timeId: partida.timeCasaId },
          { timeId: partida.timeVisitanteId },
        ],
      },
    });

    return jogadores.map((j) => ({
      id: j.id,
      partidaId,
      jogadorId: j.id,
      timeId: j.timeId,
      nomeJogador: j.nome,
      numeroCamisa: j.numeroCamisa,
      posicao: j.posicao,
      titular: j.titular,
      indicePosicao: j.indicePosicao,
    }));
  }

  async listarEventos(partidaId: string) {
    return this.prisma.eventoPartida.findMany({
      where: { partidaId, anulado: false },
      orderBy: { horario: 'asc' },
      include: { jogador: true },
    });
  }

  async registrarEvento(
    partidaId: string,
    dados: any,
    user: AuthenticatedUser,
  ) {
    const partida = await this.prisma.partida.findUnique({
      where: { id: partidaId },
    });

    if (!partida) {
      throw new NotFoundException('Partida não encontrada');
    }

    await this.verificarPermissaoTorneio(partida.torneioId, user);

    const evento = await this.prisma.eventoPartida.create({
      data: {
        ...dados,
        partidaId,
        quadraCasaAntes: dados.quadraCasaAntes ?? undefined,
        quadraVisitanteAntes: dados.quadraVisitanteAntes ?? undefined,
        quadraCasaDepois: dados.quadraCasaDepois ?? undefined,
        quadraVisitanteDepois: dados.quadraVisitanteDepois ?? undefined,
        sacadorAntes: dados.sacadorAntes ?? undefined,
        sacadorDepois: dados.sacadorDepois ?? undefined,
      },
    });

    const partidaAtualizada = await this.prisma.partida.update({
      where: { id: partidaId },
      data: {
        setAtualCasa: dados.placarCasa,
        setAtualVisitante: dados.placarVisitante,
      },
      include: { timeCasa: true, timeVisitante: true },
    });

    const regras = await this.buscarRegras(partidaAtualizada.torneioId);

    return {
      evento,
      partida: this.formatarPartida(partidaAtualizada, regras),
    };
  }

  async anularUltimoEvento(partidaId: string, user: AuthenticatedUser) {
    const partidaExistente = await this.prisma.partida.findUnique({
      where: { id: partidaId },
    });

    if (!partidaExistente) {
      throw new NotFoundException('Partida não encontrada');
    }

    await this.verificarPermissaoTorneio(partidaExistente.torneioId, user);

    const ultimoEvento = await this.prisma.eventoPartida.findFirst({
      where: { partidaId, anulado: false },
      orderBy: { horario: 'desc' },
    });
    if (!ultimoEvento) throw new NotFoundException('Sem eventos para anular');

    await this.prisma.eventoPartida.update({
      where: { id: ultimoEvento.id },
      data: { anulado: true },
    });

    const partida = await this.prisma.partida.findUnique({
      where: { id: partidaId },
      include: { timeCasa: true, timeVisitante: true },
    });
    if (!partida) throw new NotFoundException('Partida não encontrada');

    let novoCasa = partida.setAtualCasa;
    let novoVis = partida.setAtualVisitante;
    if (ultimoEvento.lado === 'CASA' && novoCasa > 0) novoCasa--;
    if (ultimoEvento.lado === 'VISITANTE' && novoVis > 0) novoVis--;

    const partidaAtualizada = await this.prisma.partida.update({
      where: { id: partidaId },
      data: { setAtualCasa: novoCasa, setAtualVisitante: novoVis },
      include: { timeCasa: true, timeVisitante: true },
    });

    const regras = await this.buscarRegras(partidaAtualizada.torneioId);

    return { partida: this.formatarPartida(partidaAtualizada, regras) };
  }

  /* ── Escalação por set ──────────────────────────────────── */

  async salvarEscalacao(
    partidaId: string,
    dados: { indiceSet: number; casa: any; visitante: any },
    user: AuthenticatedUser,
  ) {
    const partida = await this.prisma.partida.findUnique({
      where: { id: partidaId },
    });
    if (!partida) throw new NotFoundException('Partida não encontrada');
    await this.verificarPermissaoTorneio(partida.torneioId, user);

    await Promise.all([
      this.prisma.escalacaoSet.upsert({
        where: {
          partidaId_indiceSet_timeId: {
            partidaId,
            indiceSet: dados.indiceSet,
            timeId: partida.timeCasaId,
          },
        },
        create: {
          partidaId,
          indiceSet: dados.indiceSet,
          timeId: partida.timeCasaId,
          titulares: dados.casa.titulares,
          banco: dados.casa.banco,
          indicePosicaoSaque: dados.casa.indicePosicaoSaque ?? 1,
          sacaPrimeiro: dados.casa.sacaPrimeiro ?? false,
        },
        update: {
          titulares: dados.casa.titulares,
          banco: dados.casa.banco,
          indicePosicaoSaque: dados.casa.indicePosicaoSaque ?? 1,
          sacaPrimeiro: dados.casa.sacaPrimeiro ?? false,
        },
      }),
      this.prisma.escalacaoSet.upsert({
        where: {
          partidaId_indiceSet_timeId: {
            partidaId,
            indiceSet: dados.indiceSet,
            timeId: partida.timeVisitanteId,
          },
        },
        create: {
          partidaId,
          indiceSet: dados.indiceSet,
          timeId: partida.timeVisitanteId,
          titulares: dados.visitante.titulares,
          banco: dados.visitante.banco,
          indicePosicaoSaque: dados.visitante.indicePosicaoSaque ?? 1,
          sacaPrimeiro: dados.visitante.sacaPrimeiro ?? false,
        },
        update: {
          titulares: dados.visitante.titulares,
          banco: dados.visitante.banco,
          indicePosicaoSaque: dados.visitante.indicePosicaoSaque ?? 1,
          sacaPrimeiro: dados.visitante.sacaPrimeiro ?? false,
        },
      }),
    ]);

    return this.listarEscalacao(partidaId, dados.indiceSet);
  }

  async listarEscalacao(partidaId: string, indiceSet: number) {
    return this.prisma.escalacaoSet.findMany({
      where: { partidaId, indiceSet },
    });
  }

  /* ── Substituições ──────────────────────────────────────── */

  async registrarSubstituicao(
    partidaId: string,
    dados: any,
    user: AuthenticatedUser,
  ) {
    const partida = await this.prisma.partida.findUnique({
      where: { id: partidaId },
    });
    if (!partida) throw new NotFoundException('Partida não encontrada');
    await this.verificarPermissaoTorneio(partida.torneioId, user);

    return this.prisma.substituicaoPartida.create({
      data: { ...dados, partidaId },
    });
  }

  async listarSubstituicoes(partidaId: string, indiceSet?: number) {
    return this.prisma.substituicaoPartida.findMany({
      where: {
        partidaId,
        ...(indiceSet !== undefined ? { indiceSet } : {}),
      },
      orderBy: { criadoEm: 'asc' },
    });
  }
}