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

  const obterSubstituicoesDoSet = (timeId: string, indiceSet: number) => {
    return substituicoes.filter(s => s.timeId === timeId && s.indiceSet === indiceSet);
  };

  // Lógica central: Calcula quem está em quadra aplicando as substituições em cima da escalação inicial
  const obterTitularesAtuais = (timeId: string, indiceSet: number, jogadores: JogadorPartida[]) => {
    const escalacaoSet = escalacoes[indiceSet];
    if (!escalacaoSet) return []; // Retorna vazio se o set ainda não foi escalado

    const escalacaoTime = escalacaoSet.casa.timeId === timeId ? escalacaoSet.casa : escalacaoSet.visitante;

    // 1. Inicia com os IDs dos titulares originais do set
    const titularesAtuaisIds = escalacaoTime.titulares.map(t => t.jogadorId);

    // 2. Aplica as substituições em ordem cronológica
    const subsDoSet = obterSubstituicoesDoSet(timeId, indiceSet);
    subsDoSet.forEach(sub => {
      const idxSaindo = titularesAtuaisIds.indexOf(sub.idJogadorSaindo);
      if (idxSaindo !== -1) {
        titularesAtuaisIds[idxSaindo] = sub.idJogadorEntrando; // Troca o id do titular
      }
    });

    // 3. Mapeia os IDs resultantes de volta para os objetos completos de JogadorPartida
    return titularesAtuaisIds
      .map(id => jogadores.find(j => j.jogadorId === id))
      .filter(Boolean) as JogadorPartida[];
  };

  // Lógica central: Calcula quem está no banco atualmente
  const obterBancoAtual = (timeId: string, indiceSet: number, jogadores: JogadorPartida[]) => {
    const escalacaoSet = escalacoes[indiceSet];
    if (!escalacaoSet) return [];

    const escalacaoTime = escalacaoSet.casa.timeId === timeId ? escalacaoSet.casa : escalacaoSet.visitante;

    // 1. Inicia com o banco original
    const bancoAtualIds = [...escalacaoTime.banco];

    // 2. Aplica as substituições
    const subsDoSet = obterSubstituicoesDoSet(timeId, indiceSet);
    subsDoSet.forEach(sub => {
      const idxEntrando = bancoAtualIds.indexOf(sub.idJogadorEntrando);
      if (idxEntrando !== -1) {
        bancoAtualIds.splice(idxEntrando, 1); // Remove do banco quem entrou
        bancoAtualIds.push(sub.idJogadorSaindo); // Adiciona ao banco o titular que saiu
      }
    });

    return bancoAtualIds
      .map(id => jogadores.find(j => j.jogadorId === id))
      .filter(Boolean) as JogadorPartida[];
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
    obterEscalacao
  };
}