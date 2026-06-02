import { Activity } from "lucide-react";
import { EventoPartida, Partida } from "@/services/api";
import { cn } from "@/services/utils";
import { tipoEmoji, tipoLabel } from "../utils/LogicaPartida";

interface HistoricoSetProps {
  eventos: EventoPartida[];
  partida: Partida;
  setStarted: boolean;
}

export function HistoricoSet({ eventos, partida, setStarted }: HistoricoSetProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-500">
          <Activity className="h-4 w-4" />
          <span className="text-xs font-black uppercase tracking-widest">Histórico</span>
        </div>
        <span className="text-xs font-bold text-gray-400">{eventos.length} pts</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {eventos.map((ev, i) => (
          <div key={ev.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all", i === 0 ? "border-gray-300 bg-white shadow-sm" : "border-gray-200 bg-white/60")}>
            <div className={cn("w-1.5 h-8 rounded-full shrink-0", ev.lado === "CASA" ? "bg-emerald-500" : "bg-orange-400")} />
            <span className="text-xl leading-none w-7 text-center">{tipoEmoji(ev.tipo)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-xs">
                <span className="font-bold text-gray-800 truncate">{ev.lado === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante}</span>
                <span className="text-gray-500">· {tipoLabel(ev.tipo, ev.tipoErro)}</span>
              </div>
              {ev.jogadorNome && <div className="text-[10px] text-gray-400 mt-0.5 font-medium">{ev.tipo === "ERRO_ADVERSARIO" || ev.tipo === "CARTAO_ADVERSARIO" ? "FALHA: " : "AUTOR: "}<span className="text-gray-600 font-bold">{ev.jogadorNome}</span></div>}
            </div>
            <span className="font-display text-lg font-black text-gray-900 shrink-0 tabular-nums">{ev.placarCasa}<span className="text-gray-300 font-sans font-normal mx-1">-</span>{ev.placarVisitante}</span>
          </div>
        ))}
        {eventos.length === 0 && <div className="text-center text-sm text-gray-400 mt-8 font-medium">{setStarted ? "Nenhum ponto registrado ainda." : "Inicie o set para começar."}</div>}
      </div>
    </div>
  );
}