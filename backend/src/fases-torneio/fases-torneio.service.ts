import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { CriarFaseDto } from './dto/criar-fase.dto';
import { AtualizarConfiguracaoRachaDto } from './dto/atualizar-configuracao-racha.dto';
import { AdicionarPoolDto } from './dto/adicionar-pool.dto';
import { SortearTimesDto } from './dto/sortear-times.dto';

@Injectable()
export class FasesTorneioService {
  constructor(private readonly prisma: PrismaService) {}

  /* ── Permissão (mesmo padrão do TorneiosService) ─────────── */
  private async verificarPermissaoTorneio(
    torneioId: string,
    user: AuthenticatedUser,
  ) {
    if (user.perfil === 'ADMIN') return;

    const organizador = await this.prisma.organizadorTorneios.findUnique({
      where: { torneioId_usuarioId: { torneioId, usuarioId: user.id } },
    });

    if (!organizador) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar as fases deste torneio',
      );
    }
  }

  private async buscarFaseOuFalhar(faseId: string) {
    const fase = await this.prisma.faseTorneio.findUnique({
      where: { id: faseId },
      include: { configuracaoRacha: true },
    });
    if (!fase) throw new NotFoundException('Fase não encontrada');
    return fase;
  }

  private embaralhar<T>(arr: T[]): T[] {
    const copia = [...arr];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  /* ── Fases ─────────────────────────────────────────────── */

  async criarFase(torneioId: string, dados: CriarFaseDto, user: AuthenticatedUser) {
    await this.verificarPermissaoTorneio(torneioId, user);

    const fasesExistentes = await this.prisma.faseTorneio.findMany({
      where: { torneioId },
    });

    // Regra: se já existe uma fase RACHA, o torneio é "só racha" — não deixa
    // adicionar mais nenhuma fase. E o inverso: se já existem outras fases,
    // não deixa adicionar RACHA sozinho depois (evita ambiguidade de fluxo).
    const jaTemRacha = fasesExistentes.some((f) => f.tipo === 'RACHA');
    if (fasesExistentes.length > 0 && (jaTemRacha || dados.tipo === 'RACHA')) {
      throw new BadRequestException(
        'Torneios com fase RACHA só podem ter essa única fase. Remova as demais fases antes de adicionar RACHA, ou não adicione RACHA junto de outras fases.',
      );
    }

    const ordem = dados.ordem ?? fasesExistentes.length + 1;

    const fase = await this.prisma.faseTorneio.create({
      data: {
        torneioId,
        tipo: dados.tipo,
        nome: dados.nome,
        ordem,
      },
    });

    if (dados.tipo === 'RACHA') {
      await this.prisma.configuracaoRacha.create({
        data: { faseId: fase.id },
      });
    }

    return this.buscarFaseOuFalhar(fase.id);
  }

  async listarFases(torneioId: string) {
    return this.prisma.faseTorneio.findMany({
      where: { torneioId },
      orderBy: { ordem: 'asc' },
      include: { configuracaoRacha: true },
    });
  }

  async buscarFase(faseId: string) {
    return this.buscarFaseOuFalhar(faseId);
  }

  async removerFase(faseId: string, user: AuthenticatedUser) {
    const fase = await this.buscarFaseOuFalhar(faseId);
    await this.verificarPermissaoTorneio(fase.torneioId, user);
    return this.prisma.faseTorneio.delete({ where: { id: faseId } });
  }

  /* ── Configuração Racha ───────────────────────────────────── */

  async buscarConfiguracaoRacha(faseId: string) {
    const fase = await this.buscarFaseOuFalhar(faseId);
    if (fase.tipo !== 'RACHA') {
      throw new BadRequestException('Esta fase não é do tipo RACHA');
    }
    return (
      fase.configuracaoRacha ??
      this.prisma.configuracaoRacha.create({ data: { faseId } })
    );
  }

  async atualizarConfiguracaoRacha(
    faseId: string,
    dados: AtualizarConfiguracaoRachaDto,
    user: AuthenticatedUser,
  ) {
    const fase = await this.buscarFaseOuFalhar(faseId);
    if (fase.tipo !== 'RACHA') {
      throw new BadRequestException('Esta fase não é do tipo RACHA');
    }
    await this.verificarPermissaoTorneio(fase.torneioId, user);

    return this.prisma.configuracaoRacha.upsert({
      where: { faseId },
      update: { ...dados },
      create: { faseId, ...dados },
    });
  }

  /* ── Pool de jogadores ────────────────────────────────────── */

  async listarPool(faseId: string) {
    await this.buscarFaseOuFalhar(faseId);
    return this.prisma.poolJogadorRacha.findMany({
      where: { faseId },
      include: { jogador: true },
      orderBy: { criadoEm: 'asc' },
    });
  }

  async adicionarPool(
    faseId: string,
    dados: AdicionarPoolDto,
    user: AuthenticatedUser,
  ) {
    const fase = await this.buscarFaseOuFalhar(faseId);
    await this.verificarPermissaoTorneio(fase.torneioId, user);

    const idsParaAdicionar: string[] = [...(dados.jogadorIds ?? [])];

    for (const novo of dados.novosJogadores ?? []) {
      const jogador = await this.prisma.jogador.create({
        data: {
          nome: novo.nome,
          notaHabilidade: novo.notaHabilidade,
          timeId: null,
        },
      });
      idsParaAdicionar.push(jogador.id);
    }

    if (idsParaAdicionar.length === 0) {
      throw new BadRequestException(
        'Informe jogadorIds e/ou novosJogadores para adicionar à pool',
      );
    }

    await this.prisma.poolJogadorRacha.createMany({
      data: idsParaAdicionar.map((jogadorId) => ({ faseId, jogadorId })),
      skipDuplicates: true,
    });

    return this.listarPool(faseId);
  }

  async removerDaPool(faseId: string, jogadorId: string, user: AuthenticatedUser) {
    const fase = await this.buscarFaseOuFalhar(faseId);
    await this.verificarPermissaoTorneio(fase.torneioId, user);

    await this.prisma.poolJogadorRacha.delete({
      where: { faseId_jogadorId: { faseId, jogadorId } },
    });
    return this.listarPool(faseId);
  }

  /* ── Sorteio de times ─────────────────────────────────────── */

  async sortearTimes(faseId: string, dados: SortearTimesDto, user: AuthenticatedUser) {
    const fase = await this.buscarFaseOuFalhar(faseId);
    if (fase.tipo !== 'RACHA') {
      throw new BadRequestException('Esta fase não é do tipo RACHA');
    }
    await this.verificarPermissaoTorneio(fase.torneioId, user);

    const config =
      fase.configuracaoRacha ??
      (await this.prisma.configuracaoRacha.create({ data: { faseId } }));

    const jogadoresPorTime = dados.jogadoresPorTime ?? config.jogadoresPorTime;

    const poolDisponivel = await this.prisma.poolJogadorRacha.findMany({
      where: { faseId, alocado: false },
      include: { jogador: true },
    });

    const quantidadeTimes = Math.floor(poolDisponivel.length / jogadoresPorTime);
    if (quantidadeTimes < 2) {
      throw new BadRequestException(
        `Jogadores insuficientes na pool para formar pelo menos 2 times de ${jogadoresPorTime}. Disponíveis: ${poolDisponivel.length}.`,
      );
    }

    // Monta a ordem de distribuição dos jogadores.
    let ordemDistribuicao = poolDisponivel;
    if (config.criterioSorteio === 'NOTA') {
      // Serpentine draft: ordena por nota desc (sem nota = 0) e distribui em
      // zig-zag entre os times pra equilibrar a soma de notas.
      ordemDistribuicao = [...poolDisponivel].sort(
        (a, b) => (b.jogador.notaHabilidade ?? 0) - (a.jogador.notaHabilidade ?? 0),
      );
    } else {
      ordemDistribuicao = this.embaralhar(poolDisponivel);
    }

    const slotsPorTime: (typeof poolDisponivel)[] = Array.from(
      { length: quantidadeTimes },
      () => [],
    );

    if (config.criterioSorteio === 'NOTA') {
      // serpentine: time0,1,2...N-1,N-1,...,2,1,0,0,1,2...
      let indiceTime = 0;
      let direcao = 1;
      for (let i = 0; i < quantidadeTimes * jogadoresPorTime; i++) {
        slotsPorTime[indiceTime].push(ordemDistribuicao[i]);
        if (indiceTime === quantidadeTimes - 1 && direcao === 1) direcao = -1;
        else if (indiceTime === 0 && direcao === -1) direcao = 1;
        else indiceTime += direcao;
      }
    } else {
      // round-robin simples (já embaralhado)
      for (let i = 0; i < quantidadeTimes * jogadoresPorTime; i++) {
        slotsPorTime[i % quantidadeTimes].push(ordemDistribuicao[i]);
      }
    }

    const idsAlocados = new Set(
      slotsPorTime.flat().map((p) => p.jogadorId),
    );

    const timesCriados: any[] = [];
    for (let i = 0; i < quantidadeTimes; i++) {
      const nome = dados.nomesTimes?.[i] || `Time ${i + 1}`;
      const time = await this.prisma.time.create({
        data: {
          nome,
          torneioId: fase.torneioId,
          faseId: fase.id,
          quantidadeJogadores: slotsPorTime[i].length,
        },
      });

      await this.prisma.jogador.updateMany({
        where: { id: { in: slotsPorTime[i].map((p) => p.jogadorId) } },
        data: { timeId: time.id },
      });

      await this.prisma.poolJogadorRacha.updateMany({
        where: {
          faseId,
          jogadorId: { in: slotsPorTime[i].map((p) => p.jogadorId) },
        },
        data: { alocado: true },
      });

      timesCriados.push(time);
    }

    return {
      times: timesCriados,
      jogadoresNaoAlocados: poolDisponivel
        .filter((p) => !idsAlocados.has(p.jogadorId))
        .map((p) => p.jogador),
    };
  }

  /* ── Fila "rei da quadra" (geração automática de partidas) ── */

  async buscarFilaRacha(faseId: string) {
    await this.buscarFaseOuFalhar(faseId);
    return this.prisma.filaRachaEstado.findUnique({ where: { faseId } });
  }

  async iniciarFilaRacha(faseId: string, user: AuthenticatedUser) {
    const fase = await this.buscarFaseOuFalhar(faseId);
    if (fase.tipo !== 'RACHA') {
      throw new BadRequestException('Esta fase não é do tipo RACHA');
    }
    await this.verificarPermissaoTorneio(fase.torneioId, user);

    const times = await this.prisma.time.findMany({ where: { faseId } });
    if (times.length < 2) {
      throw new BadRequestException(
        'É preciso ao menos 2 times na fase para iniciar a fila do racha',
      );
    }

    const ordemInicial = this.embaralhar(times).map((t) => t.id);
    const [timeDefensorId, timeDesafianteId, ...resto] = ordemInicial;

    const partida = await this.prisma.partida.create({
      data: {
        torneioId: fase.torneioId,
        timeCasaId: timeDefensorId,
        timeVisitanteId: timeDesafianteId,
      },
    });

    const estado = await this.prisma.filaRachaEstado.upsert({
      where: { faseId },
      update: {
        timeDefensorId,
        vitoriasSeguidas: 0,
        timesAguardando: resto,
        partidaAtualId: partida.id,
      },
      create: {
        faseId,
        timeDefensorId,
        vitoriasSeguidas: 0,
        timesAguardando: resto,
        partidaAtualId: partida.id,
      },
    });

    return { estado, partida };
  }

  /**
   * Chamado depois que uma partida do racha é finalizada. Avança a fila
   * "rei da quadra": o vencedor permanece até acumular
   * `vitoriasSeguidasParaSair` vitórias seguidas, então vai para o fim da
   * fila e o próximo desafiante entra.
   */
  async avancarFilaRacha(
    faseId: string,
    dados: { timeVencedorId: string },
    user: AuthenticatedUser,
  ) {
    const fase = await this.buscarFaseOuFalhar(faseId);
    if (fase.tipo !== 'RACHA') {
      throw new BadRequestException('Esta fase não é do tipo RACHA');
    }
    await this.verificarPermissaoTorneio(fase.torneioId, user);

    const config =
      fase.configuracaoRacha ??
      (await this.prisma.configuracaoRacha.create({ data: { faseId } }));

    const estadoAtual = await this.prisma.filaRachaEstado.findUnique({
      where: { faseId },
    });
    if (!estadoAtual) {
      throw new NotFoundException(
        'Fila do racha ainda não foi iniciada para esta fase',
      );
    }

    const fila = [...((estadoAtual.timesAguardando as string[]) ?? [])];
    let novoDefensorId: string;
    let novasVitoriasSeguidas: number;

    if (dados.timeVencedorId === estadoAtual.timeDefensorId) {
      novasVitoriasSeguidas = estadoAtual.vitoriasSeguidas + 1;

      if (novasVitoriasSeguidas >= config.vitoriasSeguidasParaSair) {
        // Defensor "se aposenta" por sequência de vitórias: vai pro fim da fila.
        fila.push(estadoAtual.timeDefensorId!);
        novoDefensorId = fila.shift()!;
        novasVitoriasSeguidas = 0;
      } else {
        novoDefensorId = estadoAtual.timeDefensorId!;
      }
    } else {
      // Defensor perdeu: sai imediatamente pro fim da fila, vencedor assume.
      fila.push(estadoAtual.timeDefensorId!);
      novoDefensorId = dados.timeVencedorId;
      novasVitoriasSeguidas = 1;
    }

    if (fila.length === 0) {
      // Não há mais desafiantes — encerra a fila (fim do racha).
      await this.prisma.filaRachaEstado.update({
        where: { faseId },
        data: {
          timeDefensorId: novoDefensorId,
          vitoriasSeguidas: novasVitoriasSeguidas,
          timesAguardando: [],
          partidaAtualId: null,
        },
      });
      return { fim: true, campeaoTimeId: novoDefensorId };
    }

    const proximoDesafianteId = fila.shift()!;

    const partida = await this.prisma.partida.create({
      data: {
        torneioId: fase.torneioId,
        timeCasaId: novoDefensorId,
        timeVisitanteId: proximoDesafianteId,
      },
    });

    const estado = await this.prisma.filaRachaEstado.update({
      where: { faseId },
      data: {
        timeDefensorId: novoDefensorId,
        vitoriasSeguidas: novasVitoriasSeguidas,
        timesAguardando: fila,
        partidaAtualId: partida.id,
      },
    });

    return { fim: false, estado, partida };
  }
}