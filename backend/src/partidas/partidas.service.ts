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
  constructor(private prisma: PrismaService) {}

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
      setsParaVencer:         regras?.setsParaVencer         ?? REGRAS_PADRAO.setsParaVencer,
      pontosPorSet:           regras?.pontosPorSet           ?? REGRAS_PADRAO.pontosPorSet,
      pontosTieBreak:         regras?.pontosTieBreak         ?? REGRAS_PADRAO.pontosTieBreak,
      vantagemDoisPontos:     regras?.vantagemDoisPontos     ?? REGRAS_PADRAO.vantagemDoisPontos,
      limiteJogadoresPorTime: regras?.limiteJogadoresPorTime ?? REGRAS_PADRAO.limiteJogadoresPorTime,
    };
  }

  private formatarPartida(partida: any, regras: ReturnType<typeof this.buscarRegras> extends Promise<infer T> ? T : never) {
    return {
      ...partida,
      nomeTimeCasa:      partida.timeCasa.nome,
      nomeTimeVisitante: partida.timeVisitante.nome,
      sets:              [],
      pontosParaVencerSet:       regras.pontosPorSet,
      pontosParaVencerUltimoSet: regras.pontosTieBreak,
      setsParaVencerPartida:     regras.setsParaVencer,
      titularesPorTime:          regras.limiteJogadoresPorTime ?? 6,
      vantagemDoisPontos:        regras.vantagemDoisPontos,
    };
  }

  async criar(dados: any) {

    const str = typeof valor === 'string' ? valor : valor.toString();

    if (/[Z+-]\d{2}:\d{2}|Z$/.test(str)) {
      return str;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(str)) {
      return str + 'Z';
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) {
      return str + ':00Z';
    }

    return str;
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
    return this.prisma.partida.create({ data: dadosFormatados });
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

    return this.prisma.partida.create({
      data: dadosFormatados,
    });
  }

  async listarPorTorneio(torneioId: string) {
    const partidas = await this.prisma.partida.findMany({
      where: { torneioId },
      include: {
        timeCasa: true,
        timeVisitante: true,
      },
    });

    return partidas.map((partida) => ({
      ...partida,
      nomeTimeCasa: partida.timeCasa.nome,
      nomeTimeVisitante: partida.timeVisitante.nome,
      sets: [],
    }));
  }

  async buscarPorId(id: string) {
    const partida = await this.prisma.partida.findUnique({
      where: { id },
      include: { timeCasa: true, timeVisitante: true },
      include: {
        timeCasa: true,
        timeVisitante: true,
      },
    });
    if (!partida) throw new NotFoundException('Partida não encontrada');

    const regras = await this.buscarRegras(partida.torneioId);
    return this.formatarPartida(partida, regras);
    return {
      ...partida,
      nomeTimeCasa: partida.timeCasa.nome,
      nomeTimeVisitante: partida.timeVisitante.nome,
      sets: [],
    };
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
    return this.prisma.partida.update({ where: { id }, data: dadosFormatados });
  }

  async remover(id: string) {
    return this.prisma.partida.delete({ where: { id } });

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
      id:           j.id,
      partidaId,
      jogadorId:    j.id,
      timeId:       j.timeId,
      nomeJogador:  j.nome,
      numeroCamisa: j.numeroCamisa,
      posicao:      j.posicao,
      titular:      j.titular,
    return jogadores.map((jogador) => ({
      id: jogador.id,
      partidaId,
      jogadorId: jogador.id,
      timeId: jogador.timeId,
      nomeJogador: jogador.nome,
      numeroCamisa: jogador.numeroCamisa,
      posicao: jogador.posicao,
      titular: true,
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
      data: { ...dados, partidaId },
    });

    const partidaAtualizada = await this.prisma.partida.update({
      where: { id: partidaId },
      data: {
        setAtualCasa:      dados.placarCasa,
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

  async anularUltimoEvento(partidaId: string) {
    return {
      evento,
      partida: {
        ...partidaAtualizada,
        nomeTimeCasa: partidaAtualizada.timeCasa.nome,
        nomeTimeVisitante: partidaAtualizada.timeVisitante.nome,
        sets: [],
      },
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
    let novoVis  = partida.setAtualVisitante;
    if (ultimoEvento.lado === 'CASA'      && novoCasa > 0) novoCasa--;
    if (ultimoEvento.lado === 'VISITANTE' && novoVis  > 0) novoVis--;

    const partidaAtualizada = await this.prisma.partida.update({
      where: { id: partidaId },
      data: { setAtualCasa: novoCasa, setAtualVisitante: novoVis },
      include: { timeCasa: true, timeVisitante: true },
    });

    const regras = await this.buscarRegras(partidaAtualizada.torneioId);

    return { partida: this.formatarPartida(partidaAtualizada, regras) };
    });

    const partida = await this.prisma.partida.findUnique({
      where: { id: partidaId },
      include: { timeCasa: true, timeVisitante: true },
    });

    if (!partida) throw new NotFoundException('Partida não encontrada');

    let novoPlacarCasa = partida.setAtualCasa;
    let novoPlacarVisitante = partida.setAtualVisitante;

    if (ultimoEvento.lado === 'CASA' && novoPlacarCasa > 0) novoPlacarCasa--;
    if (ultimoEvento.lado === 'VISITANTE' && novoPlacarVisitante > 0) {
      novoPlacarVisitante--;
    }

    const partidaAtualizada = await this.prisma.partida.update({
      where: { id: partidaId },
      data: {
        setAtualCasa: novoPlacarCasa,
        setAtualVisitante: novoPlacarVisitante,
      },
      include: { timeCasa: true, timeVisitante: true },
    });

    return {
      partida: {
        ...partidaAtualizada,
        nomeTimeCasa: partidaAtualizada.timeCasa.nome,
        nomeTimeVisitante: partidaAtualizada.timeVisitante.nome,
        sets: [],
      },
    };
  }
}