import { JogadorPartida } from "@/services/api/interfaces";
import { ArrowLeftRight } from "lucide-react";

interface PainelBancoProps {
  titulares: JogadorPartida[];
  reservas: JogadorPartida[];
  cor: "emerald" | "orange";
  nomeTime: string;
  canManage: boolean;
  onSub: () => void;
}

export function PainelBanco({ titulares, reservas, cor, nomeTime, canManage, onSub }: PainelBancoProps) {
  const accent = cor === "emerald" ? "text-emerald-700 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400";
  const dot    = cor === "emerald" ? "bg-emerald-500" : "bg-orange-400";

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40">
        <span className={`h-2 w-2 rounded-full ${dot} shrink-0`} />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`text-[11px] font-black uppercase tracking-widest ${accent} truncate`}>
            {nomeTime}
          </span>
        </div>

        {canManage && (
          <button
            onClick={onSub}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:border-muted-foreground/40 transition-all shrink-0"
          >
            <ArrowLeftRight className="h-3 w-3" />
            Substituição
          </button>
        )}
      </div>
    </div>
  );
}