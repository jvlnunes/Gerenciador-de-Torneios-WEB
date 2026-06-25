import { useState } from "react";
import type {
  EscalacaoSet,
  RegistroSubstituicao,
  JogadorPartida
} from "../components/Escalacao";

export function useEscalacao(indiceSetAtual: number) {
  // Controle de Modais
  const [modalEscalacaoAberto, setModalEscalacaoAberto] = useState(false);
  const [modalSubAberto, setModalSubAberto] = useState(false);
  const [timeSubId, setTimeSubId] = useState<string | null>(null);

  // Estados de Dados
  const [escalacoes, setEscalacoes] = useState<Record<number, EscalacaoSet>>({});
  const [substituicoes, setSubstituicoes] = useState<RegistroSubstituicao[]>([]);

  // Rastreia quais sets já tiveram escalação confirmada (evita reabrir o modal ao recarregar)
  const [setsIniciadosComEscalacao, setSetsIniciadosComEscalacao] = useState<Set<number>>(new Set());

  // Ações de Modal
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

  // Ações de Confirmação
  const confirmarEscalacao = (escalacao: EscalacaoSet) => {
    setEscalacoes((prev) => ({ ...prev, [escalacao.indiceSet]: escalacao }));
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

  // Lógica central: Calcula quem está em quadra aplicando as substituições
  const obterTitularesAtuais = (timeId: string, indiceSet: number, jogadores: JogadorPartida[]) => {
    const escalacaoSet = escalacoes[indiceSet];
    if (!escalacaoSet) return [];

    const escalacaoTime = escalacaoSet.casa.timeId === timeId ? escalacaoSet.casa : escalacaoSet.visitante;

    const titularesAtuaisIds = escalacaoTime.titulares.map(t => t.jogadorId);

    const subsDoSet = obterSubstituicoesDoSet(timeId, indiceSet);
    subsDoSet.forEach(sub => {
      const idxSaindo = titularesAtuaisIds.indexOf(sub.idJogadorSaindo);
      if (idxSaindo !== -1) {
        titularesAtuaisIds[idxSaindo] = sub.idJogadorEntrando;
      }
    });

    return titularesAtuaisIds
      .map(id => jogadores.find(j => j.jogadorId === id))
      .filter(Boolean) as JogadorPartida[];
  };

  const obterBancoAtual = (timeId: string, indiceSet: number, jogadores: JogadorPartida[]) => {
    const escalacaoSet = escalacoes[indiceSet];
    if (!escalacaoSet) return [];

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
      .map(id => jogadores.find(j => j.jogadorId === id))
      .filter(Boolean) as JogadorPartida[];
  };

  // Retorna o jogador que está na posição 1 (sacador) para um time/set
  const obterJogadorPosicao1 = (timeId: string, indiceSet: number, jogadores: JogadorPartida[]) => {
    const escalacaoSet = escalacoes[indiceSet];
    if (!escalacaoSet) return undefined;

    const escalacaoTime = escalacaoSet.casa.timeId === timeId ? escalacaoSet.casa : escalacaoSet.visitante;

    // Posição 1 no nosso sistema de índices = indicePosicao === 1
    const titularNaPosicao1 = escalacaoTime.titulares.find(t => t.indicePosicao === 1);
    if (!titularNaPosicao1) return undefined;

    // Aplica substituições
    let jogadorIdNaPosicao1 = titularNaPosicao1.jogadorId;
    const subsDoSet = obterSubstituicoesDoSet(timeId, indiceSet);
    subsDoSet.forEach(sub => {
      if (sub.idJogadorSaindo === jogadorIdNaPosicao1) {
        jogadorIdNaPosicao1 = sub.idJogadorEntrando;
      }
    });

    return jogadores.find(j => j.jogadorId === jogadorIdNaPosicao1);
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
  };
}