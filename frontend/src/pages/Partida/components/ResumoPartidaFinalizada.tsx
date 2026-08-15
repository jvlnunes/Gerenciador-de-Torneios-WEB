import { Activity, BarChart3 } from "lucide-react";
import { EstatisticasTime } from "./EstatisticasTime";
import { EstatisticasComparativoTime } from "./EstatisticasComparativoTime";
import type { EventoPartida, JogadorPartida, Partida } from "@/services/api/interfaces";

interface ResumoPartidaFinalizadaProps {
  partida: Partida;
  eventos: EventoPartida[];
  eventosParaStatsJogador: EventoPartida[];
  jogadoresCasaTodos: JogadorPartida[];
  jogadoresVisTodos: JogadorPartida[];
  statSetSelecionado: number | "geral";
  setAtivoParaHistorico: number | null;
  onAbrirHistorico: () => void;
}

export function ResumoPartidaFinalizada({
  partida,
  eventos,
  eventosParaStatsJogador,
  jogadoresCasaTodos,
  jogadoresVisTodos,
  statSetSelecionado,
  setAtivoParaHistorico,
  onAbrirHistorico,
}: ResumoPartidaFinalizadaProps) {
  return (
    <>
      <button
        onClick={onAbrirHistorico}
        className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <Activity className="h-3.5 w-3.5" />
        Histórico de pontos {setAtivoParaHistorico !== null ? `— Set ${setAtivoParaHistorico + 1}` : "— Partida"}
      </button>

      <div className="flex xl:grid xl:grid-cols-3 gap-4 overflow-x-auto xl:overflow-visible snap-x snap-mandatory pb-2 xl:pb-0 -mx-1 px-1">
        <div className="min-w-[85%] sm:min-w-[70%] xl:min-w-0 shrink-0 xl:shrink snap-start rounded-2xl border border-gray-200 overflow-hidden xl:max-h-[65vh] xl:overflow-y-auto">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 truncate">
              {partida.nomeTimeCasa}
            </h3>
          </div>
          <EstatisticasTime
            eventos={eventosParaStatsJogador}
            jogadores={jogadoresCasaTodos}
            nomeTime={partida.nomeTimeCasa}
            cor="emerald"
          />
        </div>

        <div className="min-w-[85%] sm:min-w-[70%] xl:min-w-0 shrink-0 xl:shrink snap-start rounded-2xl border border-gray-200 overflow-hidden xl:max-h-[65vh] xl:overflow-y-auto">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Estatística geral</h3>
            <span className="text-[10px] font-semibold text-gray-400 ml-auto">
              {statSetSelecionado === "geral" ? "Todos os sets" : `Set ${(statSetSelecionado as number) + 1}`}
            </span>
          </div>
          <EstatisticasComparativoTime
            eventos={eventos}
            partida={partida}
            setAtivo={typeof statSetSelecionado === "number" ? statSetSelecionado : 0}
            agregarTodosSets={statSetSelecionado === "geral"}
          />
        </div>

        <div className="min-w-[85%] sm:min-w-[70%] xl:min-w-0 shrink-0 xl:shrink snap-start rounded-2xl border border-gray-200 overflow-hidden xl:max-h-[65vh] xl:overflow-y-auto">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <BarChart3 className="h-4 w-4 text-orange-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-orange-600 truncate">
              {partida.nomeTimeVisitante}
            </h3>
          </div>
          <EstatisticasTime
            eventos={eventosParaStatsJogador}
            jogadores={jogadoresVisTodos}
            nomeTime={partida.nomeTimeVisitante}
            cor="orange"
          />
        </div>
      </div>
    </>
  );
}