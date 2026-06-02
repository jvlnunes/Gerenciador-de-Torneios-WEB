import { Timer as TimerIcon, Play, Pause } from "lucide-react";
import { cn } from "@/services/utils";
import { formatTime } from "../utils/LogicaPartida";

interface SetTimerProps {
  running: boolean;
  seconds: number;
  onToggle: () => void;
}

export function SetTimer({ running, seconds, onToggle }: SetTimerProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "font-mono text-sm font-black tabular-nums px-3 py-1.5 rounded-lg border transition-colors",
        running
          ? "bg-green-50 border-green-300 text-green-700"
          : "bg-gray-100 border-gray-200 text-gray-500"
      )}>
        <TimerIcon className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
        {formatTime(seconds)}
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all",
          running
            ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
            : "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
        )}
      >
        {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        {running ? "Pausar" : "Retomar"}
      </button>
    </div>
  );
}