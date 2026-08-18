import { Trophy, Target, Users } from "lucide-react";
import { SetTimer } from "./Timer";

interface BarraRegrasProps {
  setsParaVencerPartida: number;
  pontosDoSetEmExibicao: number;
  setEmExibicaoEhDecisivo: boolean;
  titularesPorTime: number;
  mostrarTimer: boolean;
  timerOn: boolean;
  timerSecs: number;
  onToggleTimer: () => void;
}

export function BarraRegras({
  setsParaVencerPartida,
  pontosDoSetEmExibicao,
  setEmExibicaoEhDecisivo,
  titularesPorTime,
  mostrarTimer,
  timerOn,
  timerSecs,
  onToggleTimer,
}: BarraRegrasProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-border bg-muted/30 shrink-0">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-emerald-500" />
          Sets p/ vencer: <span className="text-foreground font-black ml-1">{setsParaVencerPartida}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-emerald-500" />
          Pts/set{setEmExibicaoEhDecisivo ? " (decisivo)" : ""}:{" "}
          <span className="text-foreground font-black ml-1">{pontosDoSetEmExibicao}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-500" />
          Titulares: <span className="text-foreground font-black ml-1">{titularesPorTime}</span>
        </span>
      </div>
      {mostrarTimer && (
        <SetTimer running={timerOn} seconds={timerSecs} onToggle={onToggleTimer} />
      )}
    </div>
  );
}