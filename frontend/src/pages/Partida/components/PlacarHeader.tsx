import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flag, Play, RotateCcw, Settings } from "lucide-react";
import { Partida, LadoPonto } from "@/services/api";

interface PlacarHeaderProps {
  partida: Partida;
  isAoVivo: boolean;
  isFinalizada: boolean;
  isAgendada: boolean;
  setStarted: boolean;
  sacadorAtual: LadoPonto;
  podeGerenciar: boolean;
  onIniciarPartida: () => void;
  onIniciarSet: () => void;
  onAnularPonto: () => void;
  onEncerrarPartida: () => void;
  onOpenConfig: () => void;
}

export function PlacarHeader({
  partida, isAoVivo, isFinalizada, isAgendada, setStarted, sacadorAtual,
  podeGerenciar, onIniciarPartida, onIniciarSet, onAnularPonto, onEncerrarPartida, onOpenConfig
}: PlacarHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="relative flex items-center justify-center p-4 sm:p-5 border-b border-gray-100 bg-white shrink-0">
      <div className="absolute left-4 sm:left-5">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-gray-50 text-gray-600 hover:text-gray-900 transition rounded-xl border border-gray-200 hover:bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 mb-1">
          {isAoVivo && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200">
            {isFinalizada ? "Encerrada" : isAgendada ? "Agendada" : `Set ${partida.setsCasa + partida.setsVisitante + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-6 sm:gap-14 font-display mt-1">
          {/* Casa */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1 h-5">
              {sacadorAtual === "CASA" && <span className="animate-bounce text-sm">🏐</span>}
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">{partida.nomeTimeCasa}</span>
            </div>
            <div className="text-6xl sm:text-7xl font-black text-gray-900 tabular-nums leading-none">{partida.setAtualCasa}</div>
          </div>
          {/* Sets */}
          <div className="flex flex-col items-center justify-end h-full pb-2">
            <div className="text-xs font-bold text-gray-500 flex gap-2 uppercase tracking-widest">
              <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-md">Sets <span className="text-gray-900 ml-1">{partida.setsCasa}</span></span>
              <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-md">Sets <span className="text-gray-900 ml-1">{partida.setsVisitante}</span></span>
            </div>
          </div>
          {/* Visitante */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1 h-5">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">{partida.nomeTimeVisitante}</span>
              {sacadorAtual === "VISITANTE" && <span className="animate-bounce text-sm">🏐</span>}
            </div>
            <div className="text-6xl sm:text-7xl font-black text-gray-900 tabular-nums leading-none">{partida.setAtualVisitante}</div>
          </div>
        </div>
      </div>
      {/* Ações header direita */}
      {podeGerenciar && (
        <div className="absolute right-4 sm:right-5 flex gap-2">
          {isAgendada && <button onClick={onIniciarPartida} className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow"><Flag className="w-3.5 h-3.5" /> Iniciar</button>}
          {isAoVivo && !setStarted && <button onClick={onIniciarSet} className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow"><Play className="w-3.5 h-3.5" /> Iniciar Set</button>}
          {isAoVivo && setStarted && (
            <>
              <button onClick={onOpenConfig} className="flex items-center justify-center p-2 text-gray-500 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition shadow-sm"><Settings className="w-4 h-4" /></button>
              <button onClick={onAnularPonto} className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition text-gray-700"><RotateCcw className="w-3.5 h-3.5" /><span className="hidden sm:inline">Anular</span></button>
              <button onClick={onEncerrarPartida} className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition"><Flag className="w-3.5 h-3.5" /><span className="hidden sm:inline">Encerrar</span></button>
            </>
          )}
        </div>
      )}
    </header>
  );
}