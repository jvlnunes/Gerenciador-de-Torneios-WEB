import { useState, useEffect, useCallback, useRef } from "react";
import  api  from "@/services/api";
import type { EscalacaoSet, RegistroSubstituicao, EscalacaoTime } from "../components/Escalacao";
import type { JogadorPartida } from "@/services/api/interfaces";
import type { LadoPonto } from "@/services/api/types";

function encontrarJogador(jogadores: JogadorPartida[], id?: string) {
  if (!id) return undefined;
  return jogadores.find((j) => j.jogadorId === id || j.id === id);
}

function encontrarFallbackDoTime(jogadores: JogadorPartida[], timeId: string) {
  const doTime = jogadores.filter((j) => j.timeId === timeId);
  return doTime.find((j) => j.titular) ?? doTime[0];
}

const INDICE_PARA_POSICAO: number[] = [5, 1, 6, 4, 3, 2];
const POSICAO_PARA_INDICE: Record<number, number> = { 1: 1, 2: 5, 3: 4, 4: 3, 5: 0, 6: 2 };

/** Aplica rotação física a uma lista indexada por indicePosicao (0-5) */
function aplicarRotacao(idsTaticos: (string | null)[], rotacao: number) {
  const idsNaQuadraFisica: (string | null)[] = new Array(6);

  for (let indice = 0; indice < 6; indice++) {
    const posicaoAtual = INDICE_PARA_POSICAO[indice];
    const posicaoOrigem = ((posicaoAtual - 1 + rotacao) % 6) + 1;
    idsNaQuadraFisica[indice] = idsTaticos[POSICAO_PARA_INDICE[posicaoOrigem]];
  }

  return idsNaQuadraFisica;
}

export function useEscalacao(partidaId: string | undefined, indiceSetAtual: number) {
  // Controle de Modais
  const [modalEscalacaoAberto, setModalEscalacaoAberto] = useState(false);
  const [modalSubAberto, setModalSubAberto] = useState(false);
  const [timeSubId, setTimeSubId] = useState<string | null>(null);

  // Estados de Dados (hidratados a partir da API)
  const [escalacoes, setEscalacoes] = useState<Record<number, EscalacaoSet>>({});
  const [substituicoes, setSubstituicoes] = useState<RegistroSubstituicao[]>([]);

  // Sets que já receberam pelo menos UMA tentativa de fetch (sucesso ou "ainda não existe")
  const tentativasFeitas = useRef<Set<number>>(new Set());
  // Sets que efetivamente têm escalação confirmada e salva
  const [setsComEscalacao, setSetsComEscalacao] = useState<Set<number>>(new Set());

  /* ── Carregamento ──────────────────────────────────────── */

  const carregarEscalacaoDoSet = useCallback(
    async (indiceSet: number) => {
      if (!partidaId) return;
      try {
        const rows = await api.partidas.buscarEscalacao(partidaId, indiceSet);
        tentativasFeitas.current.add(indiceSet);

        if (rows.length < 2) return; // ainda não foi salva escalação pra esse set

        const [a, b] = rows;
        const escalacaoA: EscalacaoTime = {
          timeId: a.timeId,
          titulares: a.titulares as any,
          banco: a.banco as any,
          indicePosicaoSaque: a.indicePosicaoSaque as any,
          sacaPrimeiro: a.sacaPrimeiro,
        };
        const escalacaoB: EscalacaoTime = {
          timeId: b.timeId,
          titulares: b.titulares as any,
          banco: b.banco as any,
          indicePosicaoSaque: b.indicePosicaoSaque as any,
          sacaPrimeiro: b.sacaPrimeiro,
        };

        setEscalacoes((prev) => ({
          ...prev,
          [indiceSet]: { indiceSet, casa: escalacaoA, visitante: escalacaoB },
        }));
        setSetsComEscalacao((prev) => new Set([...prev, indiceSet]));
      } catch {
        tentativasFeitas.current.add(indiceSet);
      }
    },
    [partidaId],
  );

  const carregarSubstituicoes = useCallback(async () => {
    if (!partidaId) return;
    try {
      const subs = await api.partidas.listarSubstituicoes(partidaId);
      setSubstituicoes(
        subs.map((s) => ({
          id: s.id,
          indiceSet: s.indiceSet,
          timeId: s.timeId,
          idJogadorSaindo: s.idJogadorSaindo,
          nomeJogadorSaindo: s.nomeJogadorSaindo,
          numeroJogadorSaindo: s.numeroJogadorSaindo,
          idJogadorEntrando: s.idJogadorEntrando,
          nomeJogadorEntrando: s.nomeJogadorEntrando,
          numeroJogadorEntrando: s.numeroJogadorEntrando,
          indicePosicao: s.indicePosicao as any,
          placarCasa: s.placarCasa,
          placarVisitante: s.placarVisitante,
          timestamp: s.criadoEm,
        })),
      );
    } catch {
      // sem substituições ainda
    }
  }, [partidaId]);

  /** Força releitura de escalação (do set atual) + substituições direto da API.
   *  Chamado pelo index.tsx logo após cada `load()`, garantindo que a quadra
   *  nunca fique presa em estado otimista local desatualizado. */
  const recarregar = useCallback(async () => {
    await Promise.all([
      carregarEscalacaoDoSet(indiceSetAtual),
      carregarSubstituicoes(),
    ]);
  }, [indiceSetAtual, carregarEscalacaoDoSet, carregarSubstituicoes]);

  useEffect(() => {
    if (!tentativasFeitas.current.has(indiceSetAtual)) {
      carregarEscalacaoDoSet(indiceSetAtual);
    }
    // também carrega o set anterior, usado como sugestão no modal de escalação
    if (indiceSetAtual > 0 && !tentativasFeitas.current.has(indiceSetAtual - 1)) {
      carregarEscalacaoDoSet(indiceSetAtual - 1);
    }
  }, [indiceSetAtual, carregarEscalacaoDoSet]);

  useEffect(() => {
    carregarSubstituicoes();
  }, [carregarSubstituicoes]);

  /* ── Ações de Modal ───────────────────────────────────────── */

  const abrirModalEscalacao = () => setModalEscalacaoAberto(true);
  const fecharModalEscalacao = () => setModalEscalacaoAberto(false);

  const abrirModalSubstituicao = (timeId: string) => {
    setTimeSubId(timeId);
    setModalSubAberto(true);
  };
  const fecharModalSubstituicao = () => {
    setTimeSubId(null);
    setModalSubAberto(false);
  };

  /* ── Ações de Confirmação (persistem na API) ────────────────── */

  const confirmarEscalacao = async (escalacao: EscalacaoSet) => {
    if (!partidaId) return;

    await api.partidas.salvarEscalacao(partidaId, {
      indiceSet: escalacao.indiceSet,
      escalacaoCasa: {
        timeId: escalacao.casa.timeId,
        titulares: escalacao.casa.titulares,
        banco: escalacao.casa.banco,
        indicePosicaoSaque: escalacao.casa.indicePosicaoSaque,
        sacaPrimeiro: escalacao.casa.sacaPrimeiro,
      },
      escalacaoVisitante: {
        timeId: escalacao.visitante.timeId,
        titulares: escalacao.visitante.titulares,
        banco: escalacao.visitante.banco,
        indicePosicaoSaque: escalacao.visitante.indicePosicaoSaque,
        sacaPrimeiro: escalacao.visitante.sacaPrimeiro,
      },
    });

    tentativasFeitas.current.add(escalacao.indiceSet);
    setEscalacoes((prev) => ({ ...prev, [escalacao.indiceSet]: escalacao }));
    setSetsComEscalacao((prev) => new Set([...prev, escalacao.indiceSet]));
    fecharModalEscalacao();
  };

  const confirmarSubstituicao = async (
    sub: Omit<RegistroSubstituicao, "id" | "timestamp">,
  ) => {
    if (!partidaId) return;

    const salva = await api.partidas.registrarSubstituicao(partidaId, {
      indiceSet: sub.indiceSet,
      timeId: sub.timeId,
      idJogadorSaindo: sub.idJogadorSaindo,
      nomeJogadorSaindo: sub.nomeJogadorSaindo,
      numeroJogadorSaindo: sub.numeroJogadorSaindo,
      idJogadorEntrando: sub.idJogadorEntrando,
      nomeJogadorEntrando: sub.nomeJogadorEntrando,
      numeroJogadorEntrando: sub.numeroJogadorEntrando,
      indicePosicao: sub.indicePosicao,
      placarCasa: sub.placarCasa,
      placarVisitante: sub.placarVisitante,
    });

    const novaSub: RegistroSubstituicao = {
      id: salva.id,
      indiceSet: salva.indiceSet,
      timeId: salva.timeId,
      idJogadorSaindo: salva.idJogadorSaindo,
      nomeJogadorSaindo: salva.nomeJogadorSaindo,
      numeroJogadorSaindo: salva.numeroJogadorSaindo,
      idJogadorEntrando: salva.idJogadorEntrando,
      nomeJogadorEntrando: salva.nomeJogadorEntrando,
      numeroJogadorEntrando: salva.numeroJogadorEntrando,
      indicePosicao: salva.indicePosicao as any,
      placarCasa: salva.placarCasa,
      placarVisitante: salva.placarVisitante,
      timestamp: salva.criadoEm,
    };

    setSubstituicoes((prev) => [...prev, novaSub]);
    fecharModalSubstituicao();
  };

  /* ── Consultas (Getters) ─────────────────────────────────── */

  const obterEscalacao = (indiceSet: number) => escalacoes[indiceSet];

  const obterSacadorInicial = (indiceSet: number): LadoPonto => {
    const escalacaoSet = escalacoes[indiceSet];
    if (!escalacaoSet) return "CASA";
    return escalacaoSet.casa.sacaPrimeiro ? "CASA" : "VISITANTE";
  };

  const setJaTemEscalacao = (indiceSet: number) => setsComEscalacao.has(indiceSet);

  const obterSubstituicoesDoSet = (timeId: string, indiceSet: number) => {
    return substituicoes.filter((s) => s.timeId === timeId && s.indiceSet === indiceSet);
  };

  /**
   * Retorna os 6 titulares atuais do time no set, já considerando substituições.
   * IMPORTANTE: nunca duplica jogadorId — slots sem resolução ficam de fora
   * em vez de cair num fallback fixo, que causava jogador repetido (e keys
   * duplicadas em React) quando duas posições não eram resolvidas.
   */
  const obterTitularesAtuais = (
    timeId: string,
    indiceSet: number,
    jogadores: JogadorPartida[],
  ): JogadorPartida[] => {
    const fallback = jogadores.filter((j) => j.timeId === timeId);
    const escalacaoSet = escalacoes[indiceSet];

    if (!escalacaoSet) {
      return fallback.slice(0, 6);
    }

    const escalacaoTime =
      escalacaoSet.casa.timeId === timeId ? escalacaoSet.casa : escalacaoSet.visitante;
    const mapaVolleyParaBanco = [1, 5, 4, 3, 0, 2];
    const subsDoSet = obterSubstituicoesDoSet(timeId, indiceSet);

    const resultado: JogadorPartida[] = [];
    const idsUsados = new Set<string>();

    mapaVolleyParaBanco.forEach((idxBanco) => {
      const titular = escalacaoTime?.titulares?.find((t) => t.indicePosicao === idxBanco);
      let jogadorId: string | null = titular ? titular.jogadorId : null;
      if (!jogadorId) return;

      subsDoSet.forEach((sub) => {
        if (sub.idJogadorSaindo === jogadorId) {
          jogadorId = sub.idJogadorEntrando;
        }
      });

      const jogador = encontrarJogador(jogadores, jogadorId);
      if (jogador && !idsUsados.has(jogador.id)) {
        idsUsados.add(jogador.id);
        resultado.push(jogador);
      }
    });

    // Completa até 6 apenas com jogadores ainda não usados (evita duplicar)
    if (resultado.length < 6) {
      for (const j of fallback) {
        if (resultado.length >= 6) break;
        if (!idsUsados.has(j.id)) {
          idsUsados.add(j.id);
          resultado.push(j);
        }
      }
    }

    return resultado;
  };

  const obterBancoAtual = (timeId: string, indiceSet: number, jogadores: JogadorPartida[]) => {
    const escalacaoSet = escalacoes[indiceSet];
    const doTime = jogadores.filter((j) => j.timeId === timeId);

    if (!escalacaoSet) return doTime.slice(6);

    const escalacaoTime =
      escalacaoSet.casa.timeId === timeId ? escalacaoSet.casa : escalacaoSet.visitante;

    const bancoAtualIds = [...escalacaoTime.banco];

    const subsDoSet = obterSubstituicoesDoSet(timeId, indiceSet);
    subsDoSet.forEach((sub) => {
      const idxEntrando = bancoAtualIds.indexOf(sub.idJogadorEntrando);
      if (idxEntrando !== -1) {
        bancoAtualIds.splice(idxEntrando, 1);
        bancoAtualIds.push(sub.idJogadorSaindo);
      }
    });

    // Deduplicação defensiva — mesma razão do fix acima
    const idsUsados = new Set<string>();
    const resultado: JogadorPartida[] = [];
    bancoAtualIds.forEach((id) => {
      const jogador = encontrarJogador(jogadores, id);
      if (jogador && !idsUsados.has(jogador.id)) {
        idsUsados.add(jogador.id);
        resultado.push(jogador);
      }
    });

    return resultado;
  };

  const obterQuadraAtual = (
    timeId: string,
    indiceSet: number,
    jogadores: JogadorPartida[],
    rotacao: number = 0,
  ) => {
    const fallback = jogadores.filter((j) => j.timeId === timeId);
    const escalacaoSet = escalacoes[indiceSet];

    if (!escalacaoSet) {
      const titularesComPosicao = fallback.filter(
        (j) => j.titular && j.indicePosicao != null
      );

      let idsTaticos: (string | null)[];

      if (titularesComPosicao.length === 6) {
        idsTaticos = new Array(6).fill(null);
        titularesComPosicao.forEach((j) => {
          idsTaticos[j.indicePosicao as number] = j.jogadorId;
        });
      } else {
        const titularesConfig = fallback.filter((j) => j.titular);
        const base = titularesConfig.length === 6 ? titularesConfig : fallback.slice(0, 6);
        idsTaticos = base.map((j) => j.jogadorId);
        while (idsTaticos.length < 6) idsTaticos.push(null);
      }

      if (idsTaticos.filter(Boolean).length < 6 || rotacao === 0) {
        return idsTaticos
          .map((id) => (id ? encontrarJogador(jogadores, id) : undefined))
          .filter(Boolean) as JogadorPartida[];
      }

      const idsFisicos = aplicarRotacao(idsTaticos, rotacao);
      return idsFisicos
        .map((id) => (id ? encontrarJogador(jogadores, id) : undefined))
        .filter(Boolean) as JogadorPartida[];
    }

    const escalacaoTime =
      escalacaoSet.casa.timeId === timeId ? escalacaoSet.casa : escalacaoSet.visitante;

    const trackingIds: (string | null)[] = new Array(6).fill(null);
    for (let i = 0; i < 6; i++) {
      const titular = escalacaoTime.titulares.find((t) => t.indicePosicao === i);
      trackingIds[i] = titular ? titular.jogadorId : null;
    }

    const subsDoSet = obterSubstituicoesDoSet(timeId, indiceSet);
    subsDoSet.forEach((sub) => {
      const idx = trackingIds.indexOf(sub.idJogadorSaindo);
      if (idx !== -1) {
        trackingIds[idx] = sub.idJogadorEntrando;
      }
    });

    const idsNaQuadraFisica = aplicarRotacao(trackingIds, rotacao);

    return idsNaQuadraFisica
      .map((id) => (id ? encontrarJogador(jogadores, id) : undefined))
      .filter(Boolean) as JogadorPartida[];
  };

  const obterJogadorPosicao1 = (
    timeId: string,
    indiceSet: number,
    jogadores: JogadorPartida[],
    rotacao: number = 0,
  ) => {
    const quadra = obterQuadraAtual(timeId, indiceSet, jogadores, rotacao);
    return quadra[1] || encontrarFallbackDoTime(jogadores, timeId);
  };

  const obterTodasSubstituicoesDoSet = (indiceSet: number) => {
    return substituicoes.filter((s) => s.indiceSet === indiceSet);
  };

  return {
    modalEscalacaoAberto,
    abrirModalEscalacao,
    fecharModalEscalacao,
    confirmarEscalacao,
    modalSubAberto,
    timeSubId,
    abrirModalSubstituicao,
    fecharModalSubstituicao,
    confirmarSubstituicao,
    obterTitularesAtuais,
    obterBancoAtual,
    obterSubstituicoesDoSet,
    obterTodasSubstituicoesDoSet,
    obterEscalacao,
    obterSacadorInicial,
    setJaTemEscalacao,
    obterJogadorPosicao1,
    obterQuadraAtual,
    recarregar,
  };
}