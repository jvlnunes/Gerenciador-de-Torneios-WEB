import type { EventoPartida } from "@/services/api/interfaces";
import type { LadoPonto } from "@/services/api/types";

export function ladoPenalizado(evento: EventoPartida): LadoPonto {
  if (evento.tipo !== "CARTAO_ADVERSARIO") return evento.lado;
  if (evento.tipoCartao === "VERMELHO") {
    return evento.lado === "CASA" ? "VISITANTE" : "CASA";
  }
  return evento.lado;
}

export function jogadoresExpulsosNoSet(eventos: EventoPartida[], indiceSet: number): Set<string> {
  const ids = new Set<string>();
  eventos
    .filter((e) =>
      !e.anulado &&
      e.indiceSet === indiceSet &&
      e.tipo === "CARTAO_ADVERSARIO" &&
      e.tipoCartao === "VERMELHO" &&
      e.jogadorId
    )
    .forEach((e) => ids.add(e.jogadorId!));
  return ids;
}

export function jogadoresDesqualificados(eventos: EventoPartida[]): Set<string> {
  const contagem = new Map<string, number>();
  eventos
    .filter((e) => !e.anulado && e.tipo === "CARTAO_ADVERSARIO" && e.tipoCartao === "VERMELHO" && e.jogadorId)
    .forEach((e) => contagem.set(e.jogadorId!, (contagem.get(e.jogadorId!) ?? 0) + 1));

  const ids = new Set<string>();
  contagem.forEach((qtd, id) => { if (qtd >= 2) ids.add(id); });
  return ids;
}

export function timeTemAmareloNoSet(eventos: EventoPartida[], lado: LadoPonto, indiceSet: number): boolean {
  return eventos.some(
    (e) =>
      !e.anulado &&
      e.indiceSet === indiceSet &&
      e.tipo === "CARTAO_ADVERSARIO" &&
      e.tipoCartao === "AMARELO" &&
      ladoPenalizado(e) === lado
  );
}