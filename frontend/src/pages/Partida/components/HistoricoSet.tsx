import { Activity, ArrowLeftRight } from "lucide-react";
import { EventoPartida, Partida } from "@/services/api/interfaces";
import { cn } from "@/services/utils";
import { tipoEmoji, tipoLabel } from "../utils/LogicaPartida";
import type { RegistroSubstituicao } from "./Escalacao";

interface HistoricoSetProps {
  eventos: EventoPartida[];
  substituicoes: RegistroSubstituicao[];
  partida: Partida;
  setStarted: boolean;
}

type ItemHistorico =
  | { tipo: "evento"; horario: string; dado: EventoPartida }
  | { tipo: "substituicao"; horario: string; dado: RegistroSubstituicao };

export function HistoricoSet({ eventos, substituicoes, partida, setStarted }: HistoricoSetProps) {
  const itens: ItemHistorico[] = [
    ...eventos.map((ev) => ({ tipo: "evento" as const, horario: ev.horario, dado: ev })),
    ...substituicoes.map((sub) => ({ tipo: "substituicao" as const, horario: sub.timestamp, dado: sub })),
  ].sort((a, b) => new Date(b.horario).getTime() - new Date(a.horario).getTime());

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
        {itens.map((item, i) => {
          if (item.tipo === "substituicao") {
            const sub = item.dado;
            const isCasa = sub.timeId === partida.timeCasaId;
            const nomeTime = isCasa ? partida.nomeTimeCasa : partida.nomeTimeVisitante;
            return (
              <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                <div className={cn("w-1.5 h-8 rounded-full shrink-0", isCasa ? "bg-emerald-500" : "bg-orange-400")} />
                <span className="w-7 flex justify-center shrink-0">
                  <ArrowLeftRight className="h-4 w-4 text-blue-500" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-bold text-gray-800 truncate">{nomeTime}</span>
                    <span className="text-gray-500">· Substituição</span>
                  </div>
                  <div className="text-[10px] mt-0.5 font-medium flex items-center gap-1 flex-wrap">
                    <span className="text-red-500 line-through decoration-red-500/50">
                      #{sub.numeroJogadorSaindo ?? "–"} {sub.nomeJogadorSaindo}
                    </span>
                    <ArrowLeftRight className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                    <span className="text-green-600 font-bold">
                      #{sub.numeroJogadorEntrando ?? "–"} {sub.nomeJogadorEntrando}
                    </span>
                  </div>
                </div>
                <span className="font-display text-lg font-black text-gray-900 shrink-0 tabular-nums">
                  {sub.placarCasa}<span className="text-gray-300 font-sans font-normal mx-1">-</span>{sub.placarVisitante}
                </span>
              </div>
            );
          }

          const ev = item.dado;
          return (
            <div key={ev.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all", i === 0 ? "border-gray-300 bg-white shadow-sm" : "border-gray-200 bg-white/60")}>
              <div className={cn("w-1.5 h-8 rounded-full shrink-0", ev.lado === "CASA" ? "bg-emerald-500" : "bg-orange-400")} />
              <span className="text-xl leading-none w-7 text-center">{tipoEmoji(ev.tipo)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-xs">
                  <span className="font-bold text-gray-800 truncate">{ev.lado === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante}</span>
                  <span className="text-gray-500">
                    · {tipoLabel(ev.tipo, ev.tipoErro)}
                    {ev.tipo === "CARTAO_ADVERSARIO" && ev.tipoCartao ? ` (${ev.tipoCartao === "AMARELO" ? "Amarelo" : "Vermelho"})` : ""}
                  </span>
                </div>
                {ev.jogadorNome && <div className="text-[10px] text-gray-400 mt-0.5 font-medium">{ev.tipo === "ERRO_ADVERSARIO" || ev.tipo === "CARTAO_ADVERSARIO" ? "FALHA: " : "AUTOR: "}<span className="text-gray-600 font-bold">{ev.jogadorNome}</span></div>}
              </div>
              <span className="font-display text-lg font-black text-gray-900 shrink-0 tabular-nums">{ev.placarCasa}<span className="text-gray-300 font-sans font-normal mx-1">-</span>{ev.placarVisitante}</span>
            </div>
          );
        })}
        {itens.length === 0 && <div className="text-center text-sm text-gray-400 mt-8 font-medium">{setStarted ? "Nenhum ponto registrado ainda." : "Inicie o set para começar."}</div>}
      </div>
    </div>
  );
}