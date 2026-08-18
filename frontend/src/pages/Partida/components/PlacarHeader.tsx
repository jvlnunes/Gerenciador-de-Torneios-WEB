import { useNavigate } from "react-router-dom";
import { Partida } from "@/services/api/interfaces";
import type { LadoPonto } from "@/services/api/types";
import { cn } from "@/services/utils";

import { ArrowLeft, Flag, Play, RotateCcw, Settings } from "lucide-react";

interface PlacarHeaderProps {
  partida: Partida;
  isAoVivo: boolean;
  isFinalizada: boolean;
  isAgendada: boolean;
  setStarted: boolean;
  sacadorAtual: LadoPonto;
  podeGerenciar: boolean;
  resultadosSets?: { casa: number; visitante: number }[];
  onIniciarPartida: () => void;
  onIniciarSet: () => void;
  onAnularPonto: () => void;
  onEncerrarPartida: () => void;
  onOpenConfig: () => void;
  statSetSelecionado?: number | "geral";
  onSelecionarStatSet?: (valor: number | "geral") => void;
}

export function PlacarHeader({
  partida, isAoVivo, isFinalizada, isAgendada, setStarted, sacadorAtual,
  podeGerenciar, resultadosSets = [], onIniciarPartida, onIniciarSet, onAnularPonto, onEncerrarPartida, onOpenConfig,
  statSetSelecionado, onSelecionarStatSet,
}: PlacarHeaderProps) {
  const navigate = useNavigate();

  const valorCasa = isFinalizada ? partida.setsCasa : partida.setAtualCasa;
  const valorVisitante = isFinalizada ? partida.setsVisitante : partida.setAtualVisitante;
  const destacarCasa = !isFinalizada || partida.setsCasa > partida.setsVisitante;
  const destacarVisitante = !isFinalizada || partida.setsVisitante > partida.setsCasa;

  const Escudo = ({ url, nome }: { url?: string | null; nome: string }) => (
    <span className="h-6 w-6 rounded-md overflow-hidden shrink-0 bg-muted border border-border grid place-items-center">
      {url ? (
        <img src={url} alt={nome} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[10px] font-black text-muted-foreground">{nome[0]?.toUpperCase()}</span>
      )}
    </span>
  );

  const NomeCasa = ({ className = "" }: { className?: string }) => (
    <span className={`flex items-center gap-1.5 min-w-0 font-bold text-muted-foreground uppercase tracking-wider truncate ${className}`}>
      {isAoVivo && sacadorAtual === "CASA" && <span className="animate-bounce text-sm shrink-0">🏐</span>}
      <Escudo url={partida.logoTimeCasa} nome={partida.nomeTimeCasa} />
      {partida.nomeTimeCasa}
    </span>
  );

  const NomeVisitante = ({ className = "" }: { className?: string }) => (
    <span className={`flex items-center gap-1.5 min-w-0 font-bold text-muted-foreground uppercase tracking-wider truncate ${className}`}>
      {partida.nomeTimeVisitante}
      <Escudo url={partida.logoTimeVisitante} nome={partida.nomeTimeVisitante} />
      {isAoVivo && sacadorAtual === "VISITANTE" && <span className="animate-bounce text-sm shrink-0">🏐</span>}
    </span>
  );

  const Placar = ({ tamanho }: { tamanho: string }) => (
    <div className="flex items-center gap-3 sm:gap-5 shrink-0">
      <div className={`${tamanho} font-black tabular-nums leading-none ${destacarCasa ? "text-foreground" : "text-muted-foreground"}`}>
        {valorCasa}
      </div>
      <span className="text-3xl sm:text-4xl text-muted-foreground/60 font-black">×</span>
      <div className={`${tamanho} font-black tabular-nums leading-none ${destacarVisitante ? "text-foreground" : "text-muted-foreground"}`}>
        {valorVisitante}
      </div>
    </div>
  );

  return (
    <header className="relative flex items-center justify-center p-4 sm:p-5 border-b border-border bg-card shrink-0">
      <div className="absolute left-4 sm:left-5">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-muted text-muted-foreground hover:text-foreground transition rounded-xl border border-border hover:bg-muted/70 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col items-center w-full font-display">
        {/* Status */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2.5 py-1 rounded-md bg-muted border border-border">
            {isFinalizada ? "Encerrada" : isAgendada ? "Agendada" : `Set ${partida.setsCasa + partida.setsVisitante + 1}`}
          </span>
        </div>

        {/* ── Telas pequenas/médias: nomes acima, placar embaixo ── */}
        <div className="lg:hidden flex flex-col items-center mt-1 w-full">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 w-full max-w-xl px-2">
            <NomeCasa className="text-sm justify-end text-right" />
            <span className="w-4" />
            <NomeVisitante className="text-sm justify-start text-left" />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 w-full max-w-xl px-2 mt-0.5">
            <div className="flex justify-end">
              <div className={`text-6xl font-black tabular-nums leading-none ${destacarCasa ? "text-foreground" : "text-muted-foreground"}`}>{valorCasa}</div>
            </div>
            <span className="text-3xl text-muted-foreground/60 font-black">×</span>
            <div className="flex justify-start">
              <div className={`text-6xl font-black tabular-nums leading-none ${destacarVisitante ? "text-foreground" : "text-muted-foreground"}`}>{valorVisitante}</div>
            </div>
          </div>
        </div>

        {/* ── Telas grandes ── */}
        <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-5 mt-1 w-full max-w-3xl px-4">
          <NomeCasa className="text-base justify-end text-right" />
          <Placar tamanho="text-7xl" />
          <NomeVisitante className="text-base justify-start text-left" />
        </div>

        {/* ── Resumo abaixo do placar ── */}
        <div className="mt-3">
          {!isFinalizada && (
            <span className="px-3 py-1.5 bg-muted border border-border rounded-md text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <span className="text-foreground ml-1">{partida.setsCasa} x {partida.setsVisitante}</span>
            </span>
          )}

          {isFinalizada && resultadosSets.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {resultadosSets.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelecionarStatSet?.(i)}
                  title={`Ver estatísticas do Set ${i + 1}`}
                  className={cn(
                    "flex flex-col items-center px-2.5 py-1 rounded-lg border transition-all cursor-pointer active:scale-95",
                    statSetSelecionado === i
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-sm ring-1 ring-emerald-300 dark:ring-emerald-800"
                      : "bg-muted border-border hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:shadow-sm"
                  )}
                >
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Set {i + 1}</span>
                  <span className="text-xs font-black text-foreground tabular-nums">{r.casa} - {r.visitante}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => onSelecionarStatSet?.("geral")}
                title="Ver estatísticas gerais da partida"
                className={cn(
                  "flex flex-col items-center px-3 py-1 rounded-lg border transition-all cursor-pointer active:scale-95",
                  statSetSelecionado === "geral"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-sm ring-1 ring-emerald-300 dark:ring-emerald-800"
                    : "bg-muted border-border hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:shadow-sm"
                )}
              >
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Partida</span>
                <span className="text-xs font-black text-foreground">Geral</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ações header direita */}
      <div className="absolute right-4 sm:right-5 flex gap-2">
        {podeGerenciar && (
          <>
            {isAgendada && (
              <button onClick={onIniciarPartida} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow">
                <Flag className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Iniciar</span>
              </button>
            )}
            {isAoVivo && !setStarted && (
              <button onClick={onIniciarSet} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow">
                <Play className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Iniciar Set</span>
              </button>
            )}
            {isAoVivo && setStarted && (
              <>
                <button onClick={onOpenConfig} className="flex items-center justify-center p-2 text-muted-foreground bg-muted border border-border rounded-xl hover:bg-muted/70 hover:text-foreground transition shadow-sm">
                  <Settings className="w-4 h-4" />
                </button>
                <button onClick={onAnularPonto} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-muted border border-border rounded-xl hover:bg-muted/70 transition text-foreground">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Anular</span>
                </button>
                <button onClick={onEncerrarPartida} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/50 transition">
                  <Flag className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Encerrar</span>
                </button>
              </>
            )}
          </>
        )}

      </div>
    </header>
  );
}