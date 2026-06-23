"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/services/utils";
import type { JogadorPartida } from "@/services/api";
import { AlertCircle, ArrowLeftRight, CheckCircle2, Users, X } from "lucide-react";

import type { ModalSubstituicaoProps, IndicePosicao } from "../components/Escalacao";
import { LABEL_POSICAO } from "../components/Escalacao";

const MAX_SUBS_POR_SET = 6;
const ORDEM_CASA: IndicePosicao[] = [0, 3, 2, 4, 1, 5];
const ORDEM_VISITANTE: IndicePosicao[] = [5, 1, 4, 2, 3, 0];

// ─── Quadra Somente Leitura (Meia Quadra) ─────────────────────────────────────
function MeiaQuadraLeitura({ titulares, lado, idSelecionado, onSelecionar }: any) {
  const isCasa = lado === "CASA";
  const ORDEM = isCasa ? ORDEM_CASA : ORDEM_VISITANTE;

  const mapaSlots: Record<number, JogadorPartida> = {};
  titulares.forEach((j: JogadorPartida, idx: number) => { mapaSlots[idx] = j; });

  return (
    <div className="rounded-xl border-4 border-white overflow-hidden shadow-inner relative" style={{ background: "#c8794a", aspectRatio: "1.4 / 1" }}>
      
      {/* Linha dos 3 metros */}
      <div className={cn("absolute top-0 bottom-0 w-[2px] bg-white/40", isCasa ? "left-1/2 -translate-x-1/2" : "right-1/2 translate-x-1/2")} />
      
      {/* Indicador visual de onde está a rede (borda lateral gorda) */}
      <div className={cn("absolute top-0 bottom-0 w-2 bg-white/80 z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]", isCasa ? "right-0" : "left-0")} />

      <div className="h-full grid grid-cols-2 grid-rows-3 relative z-10 p-1">
        {ORDEM.map((indice) => {
          const j = mapaSlots[indice];
          const isSel = j?.jogadorId === idSelecionado;
          return (
            <div
              key={indice}
              className={cn("relative flex flex-col items-center justify-center min-h-[50px] rounded transition-all cursor-pointer m-1", j && "hover:bg-white/20", isSel && "bg-white/40 ring-2 ring-white")}
              onClick={() => j && onSelecionar(j.jogadorId)}
            >
              <span className="absolute top-1 left-1.5 text-[8px] text-white/50 font-black">{LABEL_POSICAO[indice]}</span>
              {j && (
                <>
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md border-2 border-white/80", isCasa ? "bg-[#1a7a4a]" : "bg-[#b85e15]", isSel && "ring-4 ring-yellow-300 border-transparent")}>
                    {j.numeroCamisa ?? "?"}
                  </div>
                  <span className="text-[9px] text-white font-bold bg-black/30 px-1 rounded mt-1 truncate max-w-[50px]">{j.nomeJogador.split(" ")[0]}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Modal Principal ──────────────────────────────────────────────────────────

export function ModalSubstituicao({ aberto, indiceSet, timeAtualId, lado, nomeTimeAtual, titulares, banco, placarCasa, placarVisitante, substituicoesNesteSet, aoConfirmar, aoFechar }: ModalSubstituicaoProps) {
  const [idSaindo, setIdSaindo] = useState<string | null>(null);
  const [idEntrando, setIdEntrando] = useState<string | null>(null);

  const subsUsadas = substituicoesNesteSet.length;
  const subsRestantes = MAX_SUBS_POR_SET - subsUsadas;
  const podeSubstituir = subsRestantes > 0;
  const isCasa = lado === "CASA";

  const jSaindo = titulares.find((j) => j.jogadorId === idSaindo);
  const jEntrando = banco.find((j) => j.jogadorId === idEntrando);

  const handleConfirmar = () => {
    if (!idSaindo || !idEntrando || !jSaindo || !jEntrando || !podeSubstituir) return;
    const indiceNaLista = titulares.findIndex((j) => j.jogadorId === idSaindo);
    
    aoConfirmar({
      indiceSet, timeId: timeAtualId,
      idJogadorSaindo: idSaindo, nomeJogadorSaindo: jSaindo.nomeJogador, numeroJogadorSaindo: jSaindo.numeroCamisa,
      idJogadorEntrando: idEntrando, nomeJogadorEntrando: jEntrando.nomeJogador, numeroJogadorEntrando: jEntrando.numeroCamisa,
      indicePosicao: indiceNaLista as IndicePosicao, placarCasa, placarVisitante,
    });
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="w-full max-w-lg bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
          <div>
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">Substituição — {nomeTimeAtual}</h2>
              <Badge variant="secondary" className={cn("text-xs ml-2", podeSubstituir ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                {subsRestantes}/{MAX_SUBS_POR_SET} subs restantes
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Set {indiceSet + 1} · Placar atual: {placarCasa}–{placarVisitante}</p>
          </div>
          <button onClick={aoFechar} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6">
          
          {/* Lado Esquerdo: Quadra (Quem sai) */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              1. Selecione na quadra quem sai
            </p>
            {!podeSubstituir && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" /> Limite de {MAX_SUBS_POR_SET} atingido.
              </div>
            )}
            <MeiaQuadraLeitura titulares={titulares} lado={lado} idSelecionado={idSaindo} onSelecionar={(id: string) => setIdSaindo(id === idSaindo ? null : id)} />
          </div>

          {/* Lado Direito: Banco (Quem entra) */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              2. Selecione o reserva que entra
            </p>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-2">
              {banco.length === 0 && <div className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">Sem reservas.</div>}
              {banco.map((j) => (
                <button
                  key={j.jogadorId}
                  onClick={() => setIdEntrando(j.jogadorId === idEntrando ? null : j.jogadorId)}
                  disabled={!podeSubstituir || !idSaindo}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all",
                    j.jogadorId === idEntrando ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400" : "border-border bg-card hover:border-green-400/50 hover:bg-green-500/5",
                    (!podeSubstituir || !idSaindo) && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", isCasa ? "bg-[#1a7a4a]" : "bg-[#b85e15]")}>
                    {j.numeroCamisa ?? "?"}
                  </div>
                  <span className="flex-1 text-sm font-semibold truncate">{j.nomeJogador.split(" ")[0]}</span>
                  {j.jogadorId === idEntrando && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer (Resumo e Botões) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
          <div className="flex-1">
            {jSaindo && jEntrando ? (
              <div className="flex items-center gap-3 text-sm font-bold bg-background py-1.5 px-3 rounded-lg border border-border w-max">
                <span className="text-red-500 line-through decoration-red-500/50">{jSaindo.nomeJogador.split(" ")[0]}</span>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-green-600 dark:text-green-400">{jEntrando.nomeJogador.split(" ")[0]}</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Selecione os dois jogadores.</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={aoFechar} className="h-10">Cancelar</Button>
            <Button onClick={handleConfirmar} disabled={!idSaindo || !idEntrando || !podeSubstituir} className="gap-2 h-10 px-6 font-bold">
              <CheckCircle2 className="h-4 w-4" /> Substituir
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}