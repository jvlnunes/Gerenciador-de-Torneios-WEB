import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/services/api";
import type { EscalacaoSet, RegistroSubstituicao, EscalacaoTime } from "../components/Escalacao";
import type { JogadorPartida } from "@/services/api/interfaces";

function encontrarJogador(jogadores: JogadorPartida[], id?: string) {
  if (!id) return undefined;
  return jogadores.find((j) => j.jogadorId === id || j.id === id);
}

function encontrarFallbackDoTime(jogadores: JogadorPartida[], timeId: string) {
  const doTime = jogadores.filter((j) => j.timeId === timeId);
  return doTime.find((j) => j.titular) ?? doTime[0];
}

/** Aplica rotação física a uma lista ordenada de 6 ids (posição tática 0..5) */
function aplicarRotacao(idsTaticos: (string | null)[], rotacao: number) {
  const idsNaQuadraFisica = new Array(6);
  for (let posFisica = 0; posFisica < 6; posFisica++) {
    const idxTaticoOriginal = (posFisica + rotacao) % 6;
    idsNaQuadraFisica[posFisica] = idsTaticos[idxTaticoOriginal];
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
        const rows = await api.listarEscalacao(partidaId, indiceSet);
        tentativasFeitas.current.add(indiceSet);

        if (rows.length < 2) return; // ainda não foi salva escalação pra esse set

        const [a, b] = rows;
        const escalacaoA: EscalacaoTime = {
          timeId: a.timeId,
          titulares: a.titulares as any,
          banco: a.banco as any,
          indicePosicaoSaque: a.indicePosicaoSaque as any,
        };
        const escalacaoB: EscalacaoTime = {
          timeId: b.timeId,
          titulares: b.titulares as any,
          banco: b.banco as any,
          indicePosicaoSaque: b.indicePosicaoSaque as any,
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
      const subs = await api.listarSubstituicoes(partidaId);
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

    await api.salvarEscalacao(partidaId, {
      indiceSet: escalacao.indiceSet,
      casa: {
        titulares: escalacao.casa.titulares,
        banco: escalacao.casa.banco,
        indicePosicaoSaque: escalacao.casa.indicePosicaoSaque,
      },
      visitante: {
        titulares: escalacao.visitante.titulares,
        banco: escalacao.visitante.banco,
        indicePosicaoSaque: escalacao.visitante.indicePosicaoSaque,
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

    const salva = await api.registrarSubstituicao(partidaId, {
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

  const setJaTemEscalacao = (indiceSet: number) => setsComEscalacao.has(indiceSet);

  const obterSubstituicoesDoSet = (timeId: string, indiceSet: number) => {
    return substituicoes.filter((s) => s.timeId === timeId && s.indiceSet === indiceSet);
  };

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

    return mapaVolleyParaBanco.map((idxBanco) => {
      const titular = escalacaoTime?.titulares?.find((t) => t.indicePosicao === idxBanco);
      let jogadorId = titular ? titular.jogadorId : null;

      if (!jogadorId) return fallback[0];

      const subsDoSet = obterSubstituicoesDoSet(timeId, indiceSet);
      subsDoSet.forEach((sub) => {
        if (sub.idJogadorSaindo === jogadorId) {
          jogadorId = sub.idJogadorEntrando;
        }
      });

      return encontrarJogador(jogadores, jogadorId) || fallback[0];
    });
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

    return bancoAtualIds
      .map((id) => encontrarJogador(jogadores, id))
      .filter(Boolean) as JogadorPartida[];
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
      // Mesmo sem escalação salva (ex.: ainda carregando da API), aplicamos
      // a rotação sobre o fallback estático para a quadra não "congelar".
      const titularesConfig = fallback.filter((j) => j.titular);
      const base = titularesConfig.length === 6 ? titularesConfig : fallback.slice(0, 6);
      if (base.length < 6 || rotacao === 0) return base;

      const idsTaticos = base.map((j) => j.jogadorId);
      const idsFisicos = aplicarRotacao(idsTaticos, rotacao);
      return idsFisicos
        .map((id) => encontrarJogador(jogadores, id))
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
      .map((id) => encontrarJogador(jogadores, id))
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
    setJaTemEscalacao,
    obterJogadorPosicao1,
    obterQuadraAtual,
    recarregar,
  };
}