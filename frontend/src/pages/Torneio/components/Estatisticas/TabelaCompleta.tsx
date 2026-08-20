import { useMemo, useState } from "react";
import { Search, BarChart } from "lucide-react";
import { cn } from "@/services/utils";
import type { PlayerStat, TimeResumo } from "../../utils/usePlayerStats";

interface EstatisticasTabelaCompletaProps {
  stats: PlayerStat[];
  times: TimeResumo[];
}

type SortKey = keyof PlayerStat;

const STAT_COLS: { key: SortKey; label: string; color: string }[] = [
  { key: "totalPontos", label: "Total Pts", color: "text-primary" },
  { key: "saques", label: "Saques", color: "text-blue-600" },
  { key: "ataques", label: "Ataques", color: "text-orange-600" },
  { key: "bloqueios", label: "Bloqueios", color: "text-purple-600" },
  { key: "totalErros", label: "Erros", color: "text-red-500" },
  { key: "eficiencia", label: "Efic. %", color: "text-emerald-600" },
];

export function EstatisticasTabelaCompleta({ stats, times }: EstatisticasTabelaCompletaProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalPontos");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [filterTime, setFilterTime] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const teamTotals = useMemo(() => {
    if (filterTime === "todos") return null;

    const atletasDoTime = stats.filter((s) => s.timeId === filterTime);

    const soma = atletasDoTime.reduce(
      (acc, curr) => {
        acc.totalPontos += curr.totalPontos;
        acc.saques += curr.saques;
        acc.ataques += curr.ataques;
        acc.bloqueios += curr.bloqueios;
        acc.totalErros += curr.totalErros;
        return acc;
      },
      { totalPontos: 0, saques: 0, ataques: 0, bloqueios: 0, totalErros: 0 }
    );

    const totalAcoes = soma.totalPontos + soma.totalErros;
    const eficienciaGeral = totalAcoes > 0 ? Math.round((soma.totalPontos / totalAcoes) * 100) : 0;

    return { ...soma, eficiencia: eficienciaGeral };
  }, [stats, filterTime]);

  const filteredAndSortedStats = useMemo(() => {
    return stats
      .filter((s) => filterTime === "todos" || s.timeId === filterTime)
      .filter((s) => s.nomeJogador.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const va = a[sortKey] as number;
        const vb = b[sortKey] as number;
        return sortDir === "desc" ? vb - va : va - vb;
      });
  }, [stats, filterTime, searchTerm, sortKey, sortDir]);

  const handleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar atleta por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          value={filterTime}
          onChange={(e) => setFilterTime(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
        >
          <option value="todos">Todos os times</option>
          {times.map((t) => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>
      </div>

      {teamTotals && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-primary font-bold text-sm">
            <BarChart className="h-4 w-4" />
            Desempenho Coletivo
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-center">
            <div className="p-2 bg-background border border-border rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Pontos Totais</p>
              <p className="text-lg font-black text-primary">{teamTotals.totalPontos}</p>
            </div>
            <div className="p-2 bg-background border border-border rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ace</p>
              <p className="text-lg font-black text-blue-600">{teamTotals.saques}</p>
            </div>
            <div className="p-2 bg-background border border-border rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ataque</p>
              <p className="text-lg font-black text-orange-600">{teamTotals.ataques}</p>
            </div>
            <div className="p-2 bg-background border border-border rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Blocks</p>
              <p className="text-lg font-black text-purple-600">{teamTotals.bloqueios}</p>
            </div>
            <div className="p-2 bg-background border border-border rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Erros Gerais</p>
              <p className="text-lg font-black text-red-500">{teamTotals.totalErros}</p>
            </div>
            <div className="p-2 bg-background border border-border rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Eficiência Coletiva</p>
              <p className="text-lg font-black text-emerald-600">{teamTotals.eficiencia}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabela Principal */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-8">#</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jogador</th>
              {STAT_COLS.map((col) => (
                <th
                  key={col.key}
                  className="text-center px-2 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center justify-center gap-1">
                    {col.label}
                    {sortKey === col.key && <span className="text-primary">{sortDir === "desc" ? "↓" : "↑"}</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredAndSortedStats.map((row, i) => (
              <tr key={row.jogadorId} className="transition-colors hover:bg-muted/20">
                <td className="px-4 py-3 text-xs font-black text-muted-foreground text-center">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-md bg-primary/10 grid place-items-center text-xs font-bold text-primary shrink-0 overflow-hidden">
                      {row.logoTime ? (
                        <img src={row.logoTime} alt={row.nomeTime} className="h-full w-full object-cover" />
                      ) : (
                        row.nomeJogador.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate text-sm">{row.nomeJogador}</p>
                      <p className="text-xs text-muted-foreground truncate">{row.nomeTime}</p>
                    </div>
                  </div>
                </td>
                {STAT_COLS.map((col) => (
                  <td key={col.key} className="px-2 py-3 text-center">
                    <span className={cn("font-bold", col.color)}>
                      {row[col.key] as number}{col.key === "eficiencia" ? "%" : ""}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}