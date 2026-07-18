import { useNavigate } from "react-router-dom";
import { Partida } from "@/services/api/interfaces";
import type { LadoPonto } from "@/services/api/types";

import { useEffect, useState } from "react";
import { ArrowLeft, Flag, Play, RotateCcw, Settings, Maximize2, Minimize2 } from "lucide-react";

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
}

export function PlacarHeader({
  partida, isAoVivo, isFinalizada, isAgendada, setStarted, sacadorAtual,
  podeGerenciar, resultadosSets = [], onIniciarPartida, onIniciarSet, onAnularPonto, onEncerrarPartida, onOpenConfig
}: PlacarHeaderProps) {
  const navigate = useNavigate();

  const valorCasa = isFinalizada ? partida.setsCasa : partida.setAtualCasa;
  const valorVisitante = isFinalizada ? partida.setsVisitante : partida.setAtualVisitante;
  const destacarCasa = !isFinalizada || partida.setsCasa > partida.setsVisitante;
  const destacarVisitante = !isFinalizada || partida.setsVisitante > partida.setsCasa;

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => { });
    } else {
      document.exitFullscreen?.().catch(() => { });
    }
  };

  const NomeCasa = ({ className = "" }: { className?: string }) => (
    <span className={`flex items-center gap-1.5 min-w-0 font-bold text-gray-600 uppercase tracking-wider truncate ${className}`}>
      {isAoVivo && sacadorAtual === "CASA" && <span className="animate-bounce text-sm shrink-0">🏐</span>}
      {partida.nomeTimeCasa}
    </span>
  );

  const NomeVisitante = ({ className = "" }: { className?: string }) => (
    <span className={`flex items-center gap-1.5 min-w-0 font-bold text-gray-600 uppercase tracking-wider truncate ${className}`}>
      {partida.nomeTimeVisitante}
      {isAoVivo && sacadorAtual === "VISITANTE" && <span className="animate-bounce text-sm shrink-0">🏐</span>}
    </span>
  );

  const Placar = ({ tamanho }: { tamanho: string }) => (
    <div className="flex items-center gap-3 sm:gap-5 shrink-0">
      <div className={`${tamanho} font-black tabular-nums leading-none ${destacarCasa ? "text-gray-900" : "text-gray-400"}`}>
        {valorCasa}
      </div>
      <span className="text-3xl sm:text-4xl text-gray-300 font-black">×</span>
      <div className={`${tamanho} font-black tabular-nums leading-none ${destacarVisitante ? "text-gray-900" : "text-gray-400"}`}>
        {valorVisitante}
      </div>
    </div>
  );

  return (
    <header className="relative flex items-center justify-center p-4 sm:p-5 border-b border-gray-100 bg-white shrink-0">
      <div className="absolute left-4 sm:left-5">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-gray-50 text-gray-600 hover:text-gray-900 transition rounded-xl border border-gray-200 hover:bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col items-center w-full font-display">
        {/* Status */}
        <div className="flex items-center gap-2 mb-1">
          {/* {isAoVivo && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />} */}
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200">
            {isFinalizada ? "Encerrada" : isAgendada ? "Agendada" : `Set ${partida.setsCasa + partida.setsVisitante + 1}`}
          </span>
        </div>

        {/* ── Telas pequenas/médias: nomes acima, placar embaixo (grid garante o × centralizado) ── */}
        <div className="lg:hidden flex flex-col items-center mt-1 w-full">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 w-full max-w-xl px-2">
            <NomeCasa className="text-sm justify-end text-right" />
            <span className="w-4" />
            <NomeVisitante className="text-sm justify-start text-left" />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 w-full max-w-xl px-2 mt-0.5">
            <div className="flex justify-end">
              <div className={`text-6xl font-black tabular-nums leading-none ${destacarCasa ? "text-gray-900" : "text-gray-400"}`}>{valorCasa}</div>
            </div>
            <span className="text-3xl text-gray-300 font-black">×</span>
            <div className="flex justify-start">
              <div className={`text-6xl font-black tabular-nums leading-none ${destacarVisitante ? "text-gray-900" : "text-gray-400"}`}>{valorVisitante}</div>
            </div>
          </div>
        </div>

        {/* ── Telas grandes: nomes ao lado, fora do placar — mesma técnica de grid garante centralização do × ── */}
        <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-5 mt-1 w-full max-w-3xl px-4">
          <NomeCasa className="text-base justify-end text-right" />
          <Placar tamanho="text-7xl" />
          <NomeVisitante className="text-base justify-start text-left" />
        </div>

        {/* ── Resumo abaixo do placar ── */}
        <div className="mt-3">
          {!isFinalizada && (
            <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs font-bold text-gray-500 uppercase tracking-widest">
              <span className="text-gray-900 ml-1">{partida.setsCasa} x {partida.setsVisitante}</span>
            </span>
          )}

          {isFinalizada && resultadosSets.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {resultadosSets.map((r, i) => (
                <div key={i} className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Set {i + 1}</span>
                  <span className="text-xs font-black text-gray-800 tabular-nums">{r.casa} - {r.visitante}</span>
                </div>
              ))}
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
                <button onClick={onOpenConfig} className="flex items-center justify-center p-2 text-gray-500 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition shadow-sm">
                  <Settings className="w-4 h-4" />
                </button>
                <button onClick={onAnularPonto} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition text-gray-700">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Anular</span>
                </button>
                <button onClick={onEncerrarPartida} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition">
                  <Flag className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Encerrar</span>
                </button>
              </>
            )}
          </>
        )}

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          className="flex items-center justify-center p-2 text-gray-500 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition shadow-sm"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}