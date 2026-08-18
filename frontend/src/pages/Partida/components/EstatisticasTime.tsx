import { BarChart3, Zap, Swords, Shield, XCircle } from "lucide-react";
import { cn } from "@/services/utils";
import type { EventoPartida, JogadorPartida } from "@/services/api/interfaces";

interface StatRow {
  jogadorId: string;
  nome: string;
  numero?: number;
  saques: number;
  ataques: number;
  bloqueios: number;
  erros: number;
  total: number;
}

interface Props {
  eventos: EventoPartida[];
  jogadores: JogadorPartida[];
  nomeTime: string;
  cor: "emerald" | "orange";
}

function nomeAbreviado(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return partes[0] ?? nomeCompleto;
  return `${partes[0]} ${partes[1][0].toUpperCase()}.`;
}

export function EstatisticasTime({ eventos, jogadores, nomeTime, cor }: Props) {
  const statsMap = new Map<string, StatRow>();

  jogadores.forEach((j) => {
    statsMap.set(j.jogadorId, {
      jogadorId: j.jogadorId,
      nome: j.nomeJogador,
      numero: j.numeroCamisa,
      saques: 0,
      ataques: 0,
      bloqueios: 0,
      erros: 0,
      total: 0,
    });
  });

  eventos
    .filter((e) => !e.anulado && e.jogadorId)
    .forEach((ev) => {
      const row = statsMap.get(ev.jogadorId!);
      if (!row) return;

      if (ev.tipo === "SAQUE") {
        row.saques++;
        row.total++;
      } else if (ev.tipo === "ATAQUE") {
        row.ataques++;
        row.total++;
      } else if (ev.tipo === "BLOQUEIO") {
        row.bloqueios++;
        row.total++;
      } else if (ev.tipo === "ERRO_ADVERSARIO" || ev.tipo === "CARTAO_ADVERSARIO") {
        row.erros++;
      }
    });

  const rows = Array.from(statsMap.values())
    .filter((r) => r.total > 0 || r.erros > 0)
    .sort((a, b) => b.total - a.total);

  const accent = cor === "emerald" ? "text-emerald-700 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400";
  const accentBg = cor === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-orange-50 dark:bg-orange-950/30";
  const accentBadge = cor === "emerald" ? "bg-emerald-600" : "bg-orange-500";
  const maiorTotal = Math.max(...rows.map((r) => r.total), 1);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {nomeTime}
        </h3>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
          Sem dados registrados
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.jogadorId}
              className="rounded-xl border border-border overflow-hidden"
            >
              <div className={cn("flex items-center gap-2.5 px-3 py-2", accentBg)}>
                <span
                  className={cn(
                    "h-7 w-7 shrink-0 rounded-lg text-white text-xs font-black flex items-center justify-center",
                    accentBadge
                  )}
                >
                  {r.numero ?? "–"}
                </span>
                <span className="flex-1 min-w-0 text-sm font-bold text-foreground truncate">
                  {nomeAbreviado(r.nome)}
                </span>
                <span className={cn("text-sm font-black tabular-nums", accent)}>
                  {r.total}
                </span>
              </div>

              <div className="h-1 bg-muted">
                <div
                  className={cn("h-full", cor === "emerald" ? "bg-emerald-500" : "bg-orange-500")}
                  style={{ width: `${(r.total / maiorTotal) * 100}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                {r.saques > 0 && (
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-muted-foreground" /> {r.saques} saque{r.saques !== 1 ? "s" : ""}
                  </span>
                )}
                {r.ataques > 0 && (
                  <span className="flex items-center gap-1">
                    <Swords className="h-3 w-3 text-muted-foreground" /> {r.ataques} ataque{r.ataques !== 1 ? "s" : ""}
                  </span>
                )}
                {r.bloqueios > 0 && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-muted-foreground" /> {r.bloqueios} bloqueio{r.bloqueios !== 1 ? "s" : ""}
                  </span>
                )}
                {r.erros > 0 && (
                  <span className="flex items-center gap-1 text-red-500">
                    <XCircle className="h-3 w-3" /> {r.erros} erro{r.erros !== 1 ? "s" : ""}
                  </span>
                )}
                {r.saques === 0 && r.ataques === 0 && r.bloqueios === 0 && r.erros === 0 && (
                  <span className="italic text-muted-foreground">Sem ações registradas</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}