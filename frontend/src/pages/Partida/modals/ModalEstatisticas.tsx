import { BarChart3 } from "lucide-react";
import { cn } from "@/services/utils";
import { ModalShell } from "@/components/ui/modal-shell";
import { EstatisticasComparativoTime } from "../components/EstatisticasComparativoTime";
import { EstatisticasTime } from "../components/EstatisticasTime";
import type { EventoPartida, JogadorPartida, Partida } from "@/services/api/interfaces";

export type AbaEstatisticas = "time" | "jogador";

export interface ModalEstatisticasProps {
  eventos: EventoPartida[];
  partida: Partida;
  setAtivo: number;
  aba: AbaEstatisticas;
  onMudarAba: (aba: AbaEstatisticas) => void;
  jogadoresCasaTodos: JogadorPartida[];
  jogadoresVisTodos: JogadorPartida[];
  onClose: () => void;
}

export function ModalEstatisticas({
  eventos,
  partida,
  setAtivo,
  aba,
  onMudarAba,
  jogadoresCasaTodos,
  jogadoresVisTodos,
  onClose,
}: ModalEstatisticasProps) {
  return (
    <ModalShell
      onClose={onClose}
      align="end"
      backdropClassName="bg-black/60 sm:items-center"
      contentClassName="sm:max-w-2xl bg-white sm:rounded-2xl rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
        <span className="text-sm font-black text-gray-800 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-400" />
          Estatísticas ao vivo
        </span>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center text-lg"
        >
          ×
        </button>
      </div>

      {/* Abas: Por time / Por jogador */}
      <div className="flex gap-1 px-4 pt-3 shrink-0">
        <button
          onClick={() => onMudarAba("time")}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-black uppercase tracking-wider transition-colors",
            aba === "time"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          )}
        >
          Por time
        </button>
        <button
          onClick={() => onMudarAba("jogador")}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-black uppercase tracking-wider transition-colors",
            aba === "jogador"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          )}
        >
          Por jogador
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {aba === "time" ? (
          <EstatisticasComparativoTime eventos={eventos} partida={partida} setAtivo={setAtivo} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            <EstatisticasTime
              eventos={eventos}
              jogadores={jogadoresCasaTodos}
              nomeTime={partida.nomeTimeCasa}
              cor="emerald"
            />
            <EstatisticasTime
              eventos={eventos}
              jogadores={jogadoresVisTodos}
              nomeTime={partida.nomeTimeVisitante}
              cor="orange"
            />
          </div>
        )}
      </div>
    </ModalShell>
  );
}