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
  eventos: EventoPartida[]; // todos os eventos da partida (não só do set ativo)
  jogadores: JogadorPartida[]; // elenco completo do time nesta partida
  nomeTime: string;
  cor: "emerald" | "orange";
}

/** "Maria da Silva Souza" -> "Maria S." — mantém só o primeiro nome + inicial do segundo (se existir) */
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
      if (!row) return; // jogador não pertence a este time

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

  // Só exibe quem teve alguma ação registrada — corta ruído de quem não jogou.
  const rows = Array.from(statsMap.values())
    .filter((r) => r.total > 0 || r.erros > 0)
    .sort((a, b) => b.total - a.total);

  const accent = cor === "emerald" ? "text-emerald-700" : "text-orange-600";
  const accentBg = cor === "emerald" ? "bg-emerald-50" : "bg-orange-50";
  const accentBadge = cor === "emerald" ? "bg-emerald-600" : "bg-orange-500";
  const maiorTotal = Math.max(...rows.map((r) => r.total), 1);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-gray-400" />
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
          {nomeTime}
        </h3>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-xs text-gray-400">
          Sem dados registrados
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.jogadorId}
              className="rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Cabeçalho do jogador: número + nome abreviado + total em destaque */}
              <div className={cn("flex items-center gap-2.5 px-3 py-2", accentBg)}>
                <span
                  className={cn(
                    "h-7 w-7 shrink-0 rounded-lg text-white text-xs font-black flex items-center justify-center",
                    accentBadge
                  )}
                >
                  {r.numero ?? "–"}
                </span>
                <span className="flex-1 min-w-0 text-sm font-bold text-gray-800 truncate">
                  {nomeAbreviado(r.nome)}
                </span>
                <span className={cn("text-sm font-black tabular-nums", accent)}>
                  {r.total}
                </span>
              </div>

              {/* Barra proporcional ao maior total do time — dá noção rápida de destaque */}
              <div className="h-1 bg-gray-100">
                <div
                  className={cn("h-full", cor === "emerald" ? "bg-emerald-500" : "bg-orange-500")}
                  style={{ width: `${(r.total / maiorTotal) * 100}%` }}
                />
              </div>

              {/* Ações — só mostra o que teve valor > 0, evitando colunas vazias/redundantes */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 text-[11px] font-semibold text-gray-500">
                {r.saques > 0 && (
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-gray-400" /> {r.saques} saque{r.saques !== 1 ? "s" : ""}
                  </span>
                )}
                {r.ataques > 0 && (
                  <span className="flex items-center gap-1">
                    <Swords className="h-3 w-3 text-gray-400" /> {r.ataques} ataque{r.ataques !== 1 ? "s" : ""}
                  </span>
                )}
                {r.bloqueios > 0 && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-gray-400" /> {r.bloqueios} bloqueio{r.bloqueios !== 1 ? "s" : ""}
                  </span>
                )}
                {r.erros > 0 && (
                  <span className="flex items-center gap-1 text-red-500">
                    <XCircle className="h-3 w-3" /> {r.erros} erro{r.erros !== 1 ? "s" : ""}
                  </span>
                )}
                {r.saques === 0 && r.ataques === 0 && r.bloqueios === 0 && r.erros === 0 && (
                  <span className="italic text-gray-400">Sem ações registradas</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}