import type { LadoPonto, TipoErro, TipoCartao } from "@/services/api/types";
import { ActionDef, verificarFimSet } from "./LogicaPartida";
import { Partida, JogadorPartida } from "@/services/api/interfaces";
import api from "@/services/api";

export interface ContextoEvento {
  partida: Partida;
  partidaId: string;
  jogadores: JogadorPartida[];
  jCasaQuadra: JogadorPartida[];
  jVisQuadra: JogadorPartida[];
  sacadorAtual: LadoPonto;
}

interface ResultadoEvento {
  partidaAtualizada: Partida;
  fimSet: boolean;
  vencedorSet: LadoPonto | null;
  fimPartida: boolean;
  vencedorPartida: LadoPonto | null;
  novoSetsCasa: number;
  novoSetsVisitante: number;
}

export async function registrarPonto(
  ctx: ContextoEvento,
  acao: ActionDef,
  ladoAcao: LadoPonto,
  jogadorId?: string,
  tipoErro?: TipoErro,
): Promise<ResultadoEvento> {
  const nC = ctx.partida.setAtualCasa + (ladoAcao === "CASA" ? 1 : 0);
  const nV = ctx.partida.setAtualVisitante + (ladoAcao === "VISITANTE" ? 1 : 0);
  const jogadorNome = ctx.jogadores.find((j) => j.jogadorId === jogadorId)?.nomeJogador;

  const p = await api.partidas.registrarEvento(ctx.partidaId, {
    indiceSet: ctx.partida.setsCasa + ctx.partida.setsVisitante,
    lado: ladoAcao,
    tipo: acao.type,
    tipoErro,
    jogadorId,
    jogadorNome,
    placarCasa: nC,
    placarVisitante: nV,
    quadraCasaAntes: ctx.jCasaQuadra.map((j) => j.jogadorId),
    quadraVisitanteAntes: ctx.jVisQuadra.map((j) => j.jogadorId),
    sacadorAntes: ctx.sacadorAtual,
  });

  return { partidaAtualizada: p, ...verificarFimSet(p, nC, nV) };
}

export async function registrarCartao(
  ctx: ContextoEvento,
  jogadorId: string,
  tipoCartao: TipoCartao,
  ladoPenalizado: LadoPonto,
): Promise<ResultadoEvento & { daPonto: boolean }> {
  let nC = ctx.partida.setAtualCasa;
  let nV = ctx.partida.setAtualVisitante;
  const daPonto = tipoCartao === "VERMELHO";

  if (daPonto) {
    if (ladoPenalizado === "CASA") nV += 1;
    else nC += 1;
  }

  const ladoQueGanhaPonto: LadoPonto = ladoPenalizado === "CASA" ? "VISITANTE" : "CASA";
  const jogadorNome = ctx.jogadores.find((j) => j.jogadorId === jogadorId)?.nomeJogador;

  const p = await api.partidas.registrarEvento(ctx.partidaId, {
    indiceSet: ctx.partida.setsCasa + ctx.partida.setsVisitante,
    lado: daPonto ? ladoQueGanhaPonto : ladoPenalizado,
    tipo: "CARTAO_ADVERSARIO",
    tipoCartao,
    jogadorId,
    jogadorNome,
    placarCasa: nC,
    placarVisitante: nV,
    quadraCasaAntes: ctx.jCasaQuadra.map((j) => j.jogadorId),
    quadraVisitanteAntes: ctx.jVisQuadra.map((j) => j.jogadorId),
    sacadorAntes: ctx.sacadorAtual,
  });

  const res = daPonto
    ? verificarFimSet(p, nC, nV)
    : { fimSet: false, vencedorSet: null, fimPartida: false, vencedorPartida: null, novoSetsCasa: p.setsCasa, novoSetsVisitante: p.setsVisitante };

  return { partidaAtualizada: p, daPonto, ...res };
}