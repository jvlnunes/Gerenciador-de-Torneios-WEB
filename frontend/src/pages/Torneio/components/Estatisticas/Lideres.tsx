import { cn } from "@/services/utils";
import type { PlayerStat } from "../../utils/usePlayerStats";

interface EstatisticasLideresProps {
  stats: PlayerStat[];
}

const STAT_COLS: { key: keyof PlayerStat; label: string; color: string; icon: string }[] = [
  { key: "totalPontos", label: "Total Pts", color: "text-primary", icon: "🏆" },
  { key: "saques", label: "Saques", color: "text-blue-600", icon: "🏐" },
  { key: "ataques", label: "Ataques", color: "text-orange-600", icon: "⚡" },
  { key: "bloqueios", label: "Bloqueios", color: "text-purple-600", icon: "🛡️" },
  { key: "totalErros", label: "Erros", color: "text-red-500", icon: "✕" },
  { key: "eficiencia", label: "Efic. %", color: "text-emerald-600", icon: "📊" },
];

export function EstatisticasLideres({ stats }: EstatisticasLideresProps) {
  const getTop3 = (key: keyof PlayerStat) =>
    [...stats].sort((a, b) => (b[key] as number) - (a[key] as number)).slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {STAT_COLS.map((col) => {
        const top3 = getTop3(col.key);
        if (top3[0]?.[col.key] === 0) return null;

        return (
          <div key={col.key} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{col.icon}</span>
              <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-xs">{col.label}</h3>
            </div>
            <div className="space-y-2">
              {top3.map((player, idx) => (
                <div key={player.jogadorId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                  <span className="font-bold text-xs w-5">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                  <div className="flex-1 min-w-0 px-2">
                    <p className="font-bold text-foreground truncate">{player.nomeJogador}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{player.nomeTime}</p>
                  </div>
                  <span className={cn("font-black", col.color)}>
                    {player[col.key] as number}{col.key === "eficiencia" ? "%" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}