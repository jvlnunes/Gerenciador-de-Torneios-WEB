import type { Partida, JogadorPartida, EventoPartida } from "@/services/api/interfaces";
import type { LadoPonto } from "@/services/api/types";
import { jogadoresExpulsosNoSet, jogadoresDesqualificados, timeTemAmareloNoSet } from "./cartoes";

interface usePartidaCalculosArgs {
  partida: Partida;
  eventos: EventoPartida[];
  jogadores: JogadorPartida[];
  setAtivo: number;
  obterTitularesAtuais: (timeId: string, indiceSet: number, jogadores: JogadorPartida[]) => JogadorPartida[];
  obterBancoAtual: (timeId: string, indiceSet: number, jogadores: JogadorPartida[]) => JogadorPartida[];
  obterQuadraAtual: (timeId: string, indiceSet: number, jogadores: JogadorPartida[], rotacao: number) => JogadorPartida[];
  obterSacadorInicial: (indiceSet: number) => LadoPonto;
}

export function usePartidaCalculos({
  partida,
  eventos,
  jogadores,
  setAtivo,
  obterTitularesAtuais,
  obterBancoAtual,
  obterQuadraAtual,
  obterSacadorInicial,
}: usePartidaCalculosArgs) {
  const isAoVivo = partida.status === "AO_VIVO";
  const isFinalizada = partida.status === "FINALIZADA";
  const isAgendada = partida.status === "AGENDADA" || partida.status === "AQUECIMENTO";

  const titularesCasaList = obterTitularesAtuais(partida.timeCasaId, setAtivo, jogadores);
  const titularesVisList = obterTitularesAtuais(partida.timeVisitanteId, setAtivo, jogadores);
  const bancoCasaList = obterBancoAtual(partida.timeCasaId, setAtivo, jogadores);
  const bancoVisList = obterBancoAtual(partida.timeVisitanteId, setAtivo, jogadores);

  const jogadoresInativos = new Set([
    ...jogadoresExpulsosNoSet(eventos, setAtivo),
    ...jogadoresDesqualificados(eventos),
  ]);

  const casaTemAmarelo = timeTemAmareloNoSet(eventos, "CASA", setAtivo);
  const visTemAmarelo = timeTemAmareloNoSet(eventos, "VISITANTE", setAtivo);

  const reservasCasaAtivos = bancoCasaList.filter((j) => !jogadoresInativos.has(j.jogadorId));
  const reservasVisAtivos = bancoVisList.filter((j) => !jogadoresInativos.has(j.jogadorId));

  const totalSetsJogados = partida.setsCasa + partida.setsVisitante;
  const resultadosSets = isFinalizada
    ? Array.from({ length: totalSetsJogados }, (_, i) => {
        const evsDoSet = eventos.filter((e) => !e.anulado && e.indiceSet === i);
        if (evsDoSet.length === 0) return null;
        const ultimo = evsDoSet.reduce((acc, e) =>
          new Date(e.horario).getTime() > new Date(acc.horario).getTime() ? e : acc
        );
        return { casa: ultimo.placarCasa, visitante: ultimo.placarVisitante };
      }).filter((r): r is { casa: number; visitante: number } => r !== null)
    : [];

  const jogadoresCasaTodos = jogadores.filter((j) => j.timeId === partida.timeCasaId);
  const jogadoresVisTodos = jogadores.filter((j) => j.timeId === partida.timeVisitanteId);

  const evSetAtivo = eventos.filter((e) => !e.anulado && e.indiceSet === setAtivo).reverse();
  const eventosCron = [...evSetAtivo].reverse();
  const eventosCronParaRotacao = eventosCron.filter(
    (e) => !(e.tipo === "CARTAO_ADVERSARIO" && e.tipoCartao === "AMARELO")
  );

  let ladoSaque: LadoPonto = obterSacadorInicial(setAtivo);
  if (eventosCronParaRotacao.length > 0) {
    ladoSaque = eventosCronParaRotacao[eventosCronParaRotacao.length - 1].lado;
  }

  let rotCasa = 0, rotVisit = 0;
  let ladoAnterior: LadoPonto = obterSacadorInicial(setAtivo);
  for (const ev of eventosCronParaRotacao) {
    if (ev.lado !== ladoAnterior) {
      if (ev.lado === "CASA") rotCasa++;
      else rotVisit++;
    }
    ladoAnterior = ev.lado;
  }

  const jCasaQuadra = obterQuadraAtual(partida.timeCasaId, setAtivo, jogadores, rotCasa);
  const jVisQuadra = obterQuadraAtual(partida.timeVisitanteId, setAtivo, jogadores, rotVisit);
  const sacadorAtual: LadoPonto = ladoSaque;

  const totalSetsPossiveis = (partida.setsParaVencerPartida ?? 3) * 2 - 1;
  const indiceUltimoSetPossivel = totalSetsPossiveis - 1;
  const setEmExibicaoEhDecisivo = setAtivo === indiceUltimoSetPossivel;
  const pontosDoSetEmExibicao = setEmExibicaoEhDecisivo
    ? (partida.pontosParaVencerUltimoSet ?? 15)
    : (partida.pontosParaVencerSet ?? 25);

  return {
    isAoVivo,
    isFinalizada,
    isAgendada,
    titularesCasaList,
    titularesVisList,
    reservasCasaAtivos,
    reservasVisAtivos,
    jogadoresInativos,
    casaTemAmarelo,
    visTemAmarelo,
    totalSetsJogados,
    resultadosSets,
    jogadoresCasaTodos,
    jogadoresVisTodos,
    evSetAtivo,
    rotCasa,
    rotVisit,
    jCasaQuadra,
    jVisQuadra,
    sacadorAtual,
    setEmExibicaoEhDecisivo,
    pontosDoSetEmExibicao,
  };
}