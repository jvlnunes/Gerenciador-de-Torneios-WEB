import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api, type Torneio, type Time } from "@/services/api";
import { Loader2 } from "lucide-react";

interface TorneioCtx { torneio: Torneio; torneioId: string; liveCount: number; }

export default function TorneioClassificacao() {
  const { torneio, torneioId } = useOutletContext<TorneioCtx>();
  const [times, setTimes] = useState<Time[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listarTimes(torneioId).then(setTimes).finally(() => setLoading(false));
  }, [torneioId]);

  if (loading) return (
    <div className="p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  );

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black text-foreground">Classificação</h1>
        <p className="text-muted-foreground mt-1 text-sm">{torneio.nome} · Visão geral dos times</p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2rem_1fr_3rem_3rem_3rem_4rem_3rem] gap-2 px-4 py-3 bg-muted/40 border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span>#</span>
          <span>Time</span>
          <span className="text-center">PTS</span>
          <span className="text-center">V</span>
          <span className="text-center">D</span>
          <span className="text-center">Sets</span>
          <span className="text-right">%V</span>
        </div>

        {times.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum time registrado neste torneio ainda.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {times.map((t, i) => {
              const isLeader = i === 0 && times.length > 1;
              return (
                <div
                  key={t.id}
                  className={`grid grid-cols-[2rem_1fr_3rem_3rem_3rem_4rem_3rem] gap-2 px-4 py-3 items-center ${isLeader ? "bg-primary/5" : "hover:bg-muted/20"} transition-colors`}
                >
                  <span className={`text-sm font-black text-center ${
                    i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-md bg-primary/10 grid place-items-center text-xs font-bold text-primary shrink-0">
                      {t.nome[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-foreground truncate">{t.nome}</span>
                    {isLeader && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                        Líder
                      </span>
                    )}
                  </div>
                  {/* Valores zerados — backend de classificação pendente */}
                  <span className="text-sm font-black text-foreground text-center">0</span>
                  <span className="text-sm text-muted-foreground text-center">0</span>
                  <span className="text-sm text-muted-foreground text-center">0</span>
                  <span className="text-sm text-muted-foreground text-center">0/0</span>
                  <span className="text-sm text-muted-foreground text-right">0%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground text-center">
        Classificação calculada automaticamente à medida que as partidas forem registradas.
      </p>
    </div>
  );
}