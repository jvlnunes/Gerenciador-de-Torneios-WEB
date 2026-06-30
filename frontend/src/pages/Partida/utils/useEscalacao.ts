import { useState } from "react";
import type { EscalacaoSet, RegistroSubstituicao } from "../components/Escalacao";
import type { JogadorPartida } from "@/services/api";

function encontrarJogador(jogadores: JogadorPartida[], id?: string) {
  if (!id) return undefined;
  return jogadores.find((j) => j.jogadorId === id || j.id === id);
}

function encontrarFallbackDoTime(jogadores: JogadorPartida[], timeId: string) {
  const doTime = jogadores.filter((j) => j.timeId === timeId);
  return doTime.find((j) => j.titular) ?? doTime[0];
}

export function useEscalacao(partidaId: string | undefined, indiceSetAtual: number) {
  // Controle de Modais
  const [modalEscalacaoAberto, setModalEscalacaoAberto] = useState(false);
  const [modalSubAberto, setModalSubAberto] = useState(false);
  const [timeSubId, setTimeSubId] = useState<string | null>(null);

  // Estados de Dados
  const [escalacoes, setEscalacoes] = useState<Record<number, EscalacaoSet>>(() => {
    if (!partidaId) return {};
    const cache = localStorage.getItem(`escalacoes_${partidaId}`);
    return cache ? JSON.parse(cache) : {};
  });

  const [substituicoes, setSubstituicoes] = useState<RegistroSubstituicao[]>([]);

  const [setsIniciadosComEscalacao, setSetsIniciadosComEscalacao] = useState<Set<number>>(() => {
    if (!partidaId) return new Set();
    const cache = localStorage.getItem(`escalacoes_${partidaId}`);
    return cache ? new Set(Object.keys(JSON.parse(cache)).map(Number)) : new Set();
  });

  // Ações de Modal
  const abrirModalEscalacao  = () => setModalEscalacaoAberto(true);
  const fecharModalEscalacao = () => setModalEscalacaoAberto(false);

  const abrirModalSubstituicao = (timeId: string) => {
    setTimeSubId(timeId);
    setModalSubAberto(true);
  };
  const fecharModalSubstituicao = () => {
    setTimeSubId(null);
    setModalSubAberto(false);
  };

  // Ações de Confirmação
  const confirmarEscalacao = (escalacao: EscalacaoSet) => {
    setEscalacoes((prev) => {
      const novoEstado = { ...prev, [escalacao.indiceSet]: escalacao };
      if (partidaId) {
        localStorage.setItem(`escalacoes_${partidaId}`, JSON.stringify(novoEstado));
      }
      return novoEstado;
    });
    
    setSetsIniciadosComEscalacao((prev) => new Set([...prev, escalacao.indiceSet]));
    fecharModalEscalacao();
  };

  const confirmarSubstituicao = (sub: Omit<RegistroSubstituicao, "id" | "timestamp">) => {
    const novaSub: RegistroSubstituicao = {
      ...sub,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setSubstituicoes((prev) => [...prev, novaSub]);
    fecharModalSubstituicao();
  };

  // Consultas (Getters)
  const obterEscalacao = (indiceSet: number) => escalacoes[indiceSet];

  const setJaTemEscalacao = (indiceSet: number) =>
    setsIniciadosComEscalacao.has(indiceSet);

  const obterSubstituicoesDoSet = (timeId: string, indiceSet: number) => {
    return substituicoes.filter(s => s.timeId === timeId && s.indiceSet === indiceSet);
  };

  // const obterTitularesAtuais = (timeId: string, indiceSet: number, jogadores: JogadorPartida[]): JogadorPartida[] => {
  //   const fallback = jogadores.filter((j) => j.timeId === timeId);
  //   const escalacaoSet = escalacoes[indiceSet];

  //   if (!escalacaoSet) {
  //     const deFatoTitulares = fallback.filter(j => j.titular);
  //     return deFatoTitulares.length === 6 ? deFatoTitulares : fallback.slice(0, 6);
  //   }

  //   const escalacaoTime = escalacaoSet.casa.timeId === timeId ? escalacaoSet.casa : escalacaoSet.visitante;
  //   const mapaVolleyParaBanco = [1, 5, 4, 3, 0, 2];

  //   return mapaVolleyParaBanco.map((idxBanco) => {
  //     const titular = escalacaoTime?.titulares?.find(t => t.indicePosicao === idxBanco);
  //     let jogadorId = titular ? titular.jogadorId : null;

  //     if (!jogadorId) {
  //       return fallback.find(f => !escalacaoTime.titulares.some(t => t.jogadorId === f.jogadorId)) || fallback[0];
  //     }

  //     const subsDoSet = obterSubstituicoesDoSet(timeId, indiceSet);
  //     subsDoSet.forEach(sub => {
  //       if (sub.idJogadorSaindo === jogadorId) {
  //         jogadorId = sub.idJogadorEntrando;
  //       }
  //     });

  //     return encontrarJogador(jogadores, jogadorId) || fallback[0];
  //   });
  // };

  const obterTitularesAtuais = (timeId: string, indiceSet: number, jogadores: JogadorPartida[]): JogadorPartida[] => {
    const fallback = jogadores.filter((j) => j.timeId === timeId);
    const escalacaoSet = escalacoes[indiceSet];

    if (!escalacaoSet) {
      return fallback.slice(0, 6); 
    }

    const escalacaoTime = escalacaoSet.casa.timeId === timeId ? escalacaoSet.casa : escalacaoSet.visitante;
    const mapaVolleyParaBanco = [1, 5, 4, 3, 0, 2];

    return mapaVolleyParaBanco.map((idxBanco) => {
      const titular = escalacaoTime?.titulares?.find(t => t.indicePosicao === idxBanco);
      let jogadorId = titular ? titular.jogadorId : null;

      if (!jogadorId) return fallback[0];

      const subsDoSet = obterSubstituicoesDoSet(timeId, indiceSet);
      subsDoSet.forEach(sub => {
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

    const escalacaoTime = escalacaoSet.casa.timeId === timeId ? escalacaoSet.casa : escalacaoSet.visitante;

    const bancoAtualIds = [...escalacaoTime.banco];

    const subsDoSet = obterSubstituicoesDoSet(timeId, indiceSet);
    subsDoSet.forEach(sub => {
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

  const obterQuadraAtual = (timeId: string, indiceSet: number, jogadores: JogadorPartida[], rotacao: number = 0) => {
    const fallback = jogadores.filter((j) => j.timeId === timeId);
    const escalacaoSet = escalacoes[indiceSet];

    if (!escalacaoSet) {
      const titularesConfig = fallback.filter(j => j.titular);
      return titularesConfig.length === 6 ? titularesConfig : fallback.slice(0, 6);
    }

    const escalacaoTime = escalacaoSet.casa.timeId === timeId ? escalacaoSet.casa : escalacaoSet.visitante;

    const trackingIds: (string | null)[] = new Array(6).fill(null);
    for (let i = 0; i < 6; i++) {
      const titular = escalacaoTime.titulares.find(t => t.indicePosicao === i);
      trackingIds[i] = titular ? titular.jogadorId : null;
    }

    const subsDoSet = obterSubstituicoesDoSet(timeId, indiceSet);
    subsDoSet.forEach(sub => {
      const idx = trackingIds.indexOf(sub.idJogadorSaindo);
      if (idx !== -1) {
        trackingIds[idx] = sub.idJogadorEntrando;
      }
    });

    const idsNaQuadraFisica = new Array(6);
    for (let posFisica = 0; posFisica < 6; posFisica++) {
      const idxTaticoOriginal = (posFisica + rotacao) % 6;
      idsNaQuadraFisica[posFisica] = trackingIds[idxTaticoOriginal];
    }

    return idsNaQuadraFisica
      .map(id => encontrarJogador(jogadores, id))
      .filter(Boolean) as JogadorPartida[];
  };

  const obterJogadorPosicao1 = (timeId: string, indiceSet: number, jogadores: JogadorPartida[], rotacao: number = 0) => {
    const quadra = obterQuadraAtual(timeId, indiceSet, jogadores, rotacao);
    return quadra[1] || encontrarFallbackDoTime(jogadores, timeId);
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
    obterEscalacao,
    setJaTemEscalacao,
    obterJogadorPosicao1,
    obterQuadraAtual,
  };
}