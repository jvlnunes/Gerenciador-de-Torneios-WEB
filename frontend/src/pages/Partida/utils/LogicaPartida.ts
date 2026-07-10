import { Partida } from "@/services/api/interfaces";
import type { TipoPonto, LadoPonto, TipoErro } from "@/services/api/types";

export type ActionDef = { type: TipoPonto; label: string; emoji: string };

export const ACOES_PONTO: ActionDef[] = [
  { type: "SAQUE",    label: "Saque",    emoji: "🏐" },
  { type: "ATAQUE",   label: "Ataque",   emoji: "⚡" },
  { type: "BLOQUEIO", label: "Bloqueio", emoji: "🛡️" },
];

export const ACOES_EXTRAS: ActionDef[] = [
  { type: "ERRO_ADVERSARIO",   label: "Erro Adv.",   emoji: "✕" },
  { type: "CARTAO_ADVERSARIO", label: "Cartão Adv.", emoji: "🟨" },
];

export function tipoEmoji(t: TipoPonto) {
  const m: Record<string, string> = {
    SAQUE: "🏐", ATAQUE: "⚡", BLOQUEIO: "🛡️",
    ERRO_ADVERSARIO: "❌", CARTAO_ADVERSARIO: "🟨",
  };
  return m[t] ?? "•";
}

export function tipoLabel(t: TipoPonto, err?: string) {
  if (t === "ERRO_ADVERSARIO") return err ? err.replace(/_/g, " ") : "Erro Adv.";
  const m: Record<string, string> = {
    SAQUE: "Saque", ATAQUE: "Ataque", BLOQUEIO: "Bloqueio", CARTAO_ADVERSARIO: "Cartão",
  };
  return m[t] ?? t;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function verificarFimSet(
  p: Partida,
  pCasa: number,
  pVis: number,
): {
  fimSet: boolean;
  vencedorSet: LadoPonto | null;
  fimPartida: boolean;
  vencedorPartida: LadoPonto | null;
  novoSetsCasa: number;
  novoSetsVisitante: number;
} {
  const totalSetsDisputa = (p.setsParaVencerPartida ?? 3) * 2 - 1;
  const setAtual = p.setsCasa + p.setsVisitante;
  const isUltimoSet = setAtual >= totalSetsDisputa - 1;
  const pontoMin = isUltimoSet
    ? (p.pontosParaVencerUltimoSet ?? 15)
    : (p.pontosParaVencerSet ?? 25);

  const maxPontos = Math.max(pCasa, pVis);
  const diff = Math.abs(pCasa - pVis);

  if (maxPontos >= pontoMin && diff >= 2) {
    const vencedorSet: LadoPonto = pCasa > pVis ? "CASA" : "VISITANTE";
    const novoSetsCasa = p.setsCasa + (vencedorSet === "CASA" ? 1 : 0);
    const novoSetsVisitante = p.setsVisitante + (vencedorSet === "VISITANTE" ? 1 : 0);
    const sv = p.setsParaVencerPartida ?? 3;
    const fimPartida = novoSetsCasa >= sv || novoSetsVisitante >= sv;

    return {
      fimSet: true,
      vencedorSet,
      fimPartida,
      vencedorPartida: fimPartida ? (novoSetsCasa >= sv ? "CASA" : "VISITANTE") : null,
      novoSetsCasa,
      novoSetsVisitante,
    };
  }

  return {
    fimSet: false,
    vencedorSet: null,
    fimPartida: false,
    vencedorPartida: null,
    novoSetsCasa: p.setsCasa,
    novoSetsVisitante: p.setsVisitante,
  };
};

export const ACOES_POSITIVAS: ActionDef[] = [
  { type: "SAQUE",    label: "Ace",      emoji: "🏐" },
  { type: "ATAQUE",   label: "Ataque",   emoji: "⚡" },
  { type: "BLOQUEIO", label: "Bloqueio", emoji: "🛡️" },
];

export const TIPOS_ERRO: { tipoErro: TipoErro; label: string }[] = [
  { tipoErro: "ERRO_SAQUE",    label: "Erro de saque" },
  { tipoErro: "TOQUE_REDE",    label: "Toque na rede" },
  { tipoErro: "INVASAO",       label: "Invasão" },
  { tipoErro: "BOLA_FORA",     label: "Bola fora" },
  { tipoErro: "DOIS_TOQUES",   label: "Dois toques" },
  { tipoErro: "QUATRO_TOQUES", label: "Quatro toques" },
  { tipoErro: "CONDUCAO",      label: "Condução" },
  { tipoErro: "ERRO_ROTACAO",  label: "Erro de rotação" },
];

export function ladoOposto(l: LadoPonto): LadoPonto {
  return l === "CASA" ? "VISITANTE" : "CASA";
};