import { LadoPonto } from "@/services/api/types";
import { Partida, JogadorPartida, EventoPartida } from "@/services/api/interfaces";
import { Play } from "lucide-react";
import { cn } from "@/services/utils";
import { ACOES_PONTO, ACOES_EXTRAS, ActionDef } from "../utils/LogicaPartida";
import { BankPanel } from "./PainelBanco";
import { EstatisticasTime } from "./EstatisticasTime";

interface ColunaTimeProps {
  lado: LadoPonto;
  partida: Partida;
  titulares: JogadorPartida[];
  reservas: JogadorPartida[];
  podeGerenciar: boolean;
  isAoVivo: boolean;
  isFinalizada: boolean;
  setStarted: boolean;
  eventosPartida: EventoPartida[];
  todosJogadores: JogadorPartida[];
  onSub: () => void;
  onAcao: (acao: ActionDef) => void;
}

export function ColunaTime({
  lado, partida, titulares, reservas, podeGerenciar, isAoVivo, isFinalizada, setStarted,
  eventosPartida, todosJogadores, onSub, onAcao
}: ColunaTimeProps) {
  const isCasa = lado === "CASA";
  const nomeTime = isCasa ? partida.nomeTimeCasa : partida.nomeTimeVisitante;
  const corTexto = isCasa ? "text-emerald-600" : "text-orange-500";
  const labelLado = isCasa ? "CASA" : "VISITANTE";
  const corPadrao = isCasa ? "emerald" : "orange";

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-white border-r border-gray-100 last:border-r-0">
      <div className="text-center py-4 px-4 border-b border-gray-100">
        <h2 className="font-display text-3xl sm:text-4xl font-black text-gray-900 truncate">{nomeTime}</h2>
        <p className={cn("text-[10px] mt-1 uppercase tracking-[0.2em] font-bold", corTexto)}>{labelLado}</p>
      </div>

      {!isFinalizada && (
        <div className="px-3 py-3 border-b border-gray-100">
          <BankPanel titulares={titulares} reservas={reservas} cor={corPadrao} nomeTime={nomeTime} canManage={podeGerenciar && isAoVivo && setStarted} onSub={onSub} />
        </div>
      )}

      {isFinalizada && (
        <div className="flex-1 overflow-y-auto">
          <EstatisticasTime
            eventos={eventosPartida}
            jogadores={todosJogadores}
            nomeTime={nomeTime}
            cor={corPadrao}
          />
        </div>
      )}

      {!isFinalizada && isAoVivo && podeGerenciar && setStarted && (
        <div className="flex-1 flex flex-col gap-3 p-4 justify-center">
          <div className="grid grid-cols-3 gap-2.5">
            {ACOES_PONTO.map((a) => (
              <button key={a.type} onClick={() => onAcao(a)} className={cn("group rounded-2xl border transition-all p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md", isCasa ? "bg-emerald-50 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100" : "bg-orange-50 border-orange-100 hover:border-orange-300 hover:bg-orange-100")}>
                <span className="text-3xl group-hover:scale-110 transition-transform">{a.emoji}</span>
                <span className={cn("text-[10px] font-black uppercase tracking-[0.1em] mt-2", isCasa ? "text-emerald-700" : "text-orange-600")}>{a.label}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ACOES_EXTRAS.map((a) => (
              <button key={a.type} onClick={() => onAcao(a)} className={cn("group rounded-xl border transition-all p-3 flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow", a.type === "ERRO_ADVERSARIO" ? "bg-orange-50 border-orange-200 text-orange-600 hover:border-orange-400" : "bg-yellow-50 border-yellow-200 text-yellow-600 hover:border-yellow-400")}>
                <span className="text-xl group-hover:scale-110 transition-transform">{a.emoji}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isFinalizada && isAoVivo && podeGerenciar && !setStarted && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Play className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Inicie o set para registrar pontos</p>
          </div>
        </div>
      )}
    </div>
  );
}