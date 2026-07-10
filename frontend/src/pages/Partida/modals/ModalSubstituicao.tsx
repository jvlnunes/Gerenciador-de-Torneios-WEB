// frontend/src/pages/Partida/modals/ModalSubstituicao.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/services/utils";
import { AlertCircle, ArrowLeftRight, CheckCircle2, X } from "lucide-react";

import type { ModalSubstituicaoProps, IndicePosicao } from "../components/Escalacao";

const MAX_SUBS_POR_SET = 6;

// ─── Linha de jogador (usada tanto para titulares quanto pro banco) ───────
function PlayerRow({
  jogador,
  cor,
  selecionado,
  disabled,
  onClick,
}: {
  jogador: { jogadorId: string; nomeJogador: string; numeroCamisa?: number; posicao?: string };
  cor: "emerald" | "orange";
  selecionado: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const corBg = cor === "emerald" ? "bg-emerald-600" : "bg-orange-500";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all",
        selecionado
          ? "border-gray-800 bg-gray-50 shadow-sm ring-1 ring-gray-800"
          : "border-border bg-card hover:border-gray-300 hover:bg-muted/30",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0",
          corBg,
        )}
      >
        {jogador.numeroCamisa ?? "–"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{jogador.nomeJogador}</p>
        {jogador.posicao && (
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{jogador.posicao}</p>
        )}
      </div>
      {selecionado && <CheckCircle2 className="h-4 w-4 text-gray-800 shrink-0" />}
    </button>
  );
}

// ─── Modal Principal ──────────────────────────────────────────────────────
export function ModalSubstituicao({
  aberto,
  indiceSet,
  timeAtualId,
  lado,
  nomeTimeAtual,
  titulares,
  banco,
  placarCasa,
  placarVisitante,
  substituicoesNesteSet,
  aoConfirmar,
  aoFechar,
}: ModalSubstituicaoProps) {
  const [idSaindo, setIdSaindo] = useState<string | null>(null);
  const [idEntrando, setIdEntrando] = useState<string | null>(null);

  // Reseta seleção sempre que o modal reabre
  useEffect(() => {
    if (aberto) {
      setIdSaindo(null);
      setIdEntrando(null);
    }
  }, [aberto]);

  const subsUsadas = substituicoesNesteSet.length;
  const subsRestantes = MAX_SUBS_POR_SET; // - subsUsadas;
  const podeSubstituir = subsRestantes > 0;
  const cor = lado === "CASA" ? "emerald" : "orange";

  const jSaindo = titulares.find((j) => j.jogadorId === idSaindo);
  const jEntrando = banco.find((j) => j.jogadorId === idEntrando);

  const handleConfirmar = () => {
    if (!idSaindo || !idEntrando || !jSaindo || !jEntrando || !podeSubstituir) return;
    const indiceNaLista = titulares.findIndex((j) => j.jogadorId === idSaindo);

    aoConfirmar({
      indiceSet,
      timeId: timeAtualId,
      idJogadorSaindo: idSaindo,
      nomeJogadorSaindo: jSaindo.nomeJogador,
      numeroJogadorSaindo: jSaindo.numeroCamisa,
      idJogadorEntrando: idEntrando,
      nomeJogadorEntrando: jEntrando.nomeJogador,
      numeroJogadorEntrando: jEntrando.numeroCamisa,
      indicePosicao: indiceNaLista as IndicePosicao,
      placarCasa,
      placarVisitante,
    });
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="w-full max-w-lg bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
          <div>
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">
                Substituição — {nomeTimeAtual}
              </h2>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs ml-2",
                  podeSubstituir ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                )}
              >
                {subsRestantes}/{MAX_SUBS_POR_SET} subs restantes
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set {indiceSet + 1} · Placar atual: {placarCasa}–{placarVisitante}
            </p>
          </div>
          <button
            onClick={aoFechar}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!podeSubstituir && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> Limite de {MAX_SUBS_POR_SET} substituições atingido.
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            {/* Coluna: Titulares (quem sai) */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Em quadra — quem sai
              </p>
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {titulares.length === 0 && (
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-6 text-center text-xs text-muted-foreground">
                    Nenhum titular.
                  </div>
                )}
                {titulares.map((j) => (
                  <PlayerRow
                    key={j.jogadorId}
                    jogador={j}
                    cor={cor}
                    selecionado={j.jogadorId === idSaindo}
                    disabled={!podeSubstituir}
                    onClick={() => setIdSaindo(j.jogadorId === idSaindo ? null : j.jogadorId)}
                  />
                ))}
              </div>
            </div>

            {/* Coluna: Banco (quem entra) */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                No banco — quem entra
              </p>
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {banco.length === 0 && (
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-6 text-center text-xs text-muted-foreground">
                    Sem reservas.
                  </div>
                )}
                {banco.map((j) => (
                  <PlayerRow
                    key={j.jogadorId}
                    jogador={j}
                    cor={cor}
                    selecionado={j.jogadorId === idEntrando}
                    disabled={!podeSubstituir}
                    onClick={() => setIdEntrando(j.jogadorId === idEntrando ? null : j.jogadorId)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer (Resumo e Botões) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
          <div className="flex-1">
            {jSaindo && jEntrando ? (
              <div className="flex items-center gap-3 text-sm font-bold bg-background py-1.5 px-3 rounded-lg border border-border w-max">
                <span className="text-red-500 line-through decoration-red-500/50">
                  {jSaindo.nomeJogador.split(" ")[0]}
                </span>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-green-600 dark:text-green-400">
                  {jEntrando.nomeJogador.split(" ")[0]}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Selecione um titular e um reserva.</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={aoFechar} className="h-10">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              disabled={!idSaindo || !idEntrando || !podeSubstituir}
              className="gap-2 h-10 px-6 font-bold"
            >
              <CheckCircle2 className="h-4 w-4" /> Substituir
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}