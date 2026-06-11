import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { api, type Torneio } from "@/services/api";
import { Loader2, BarChart3, Search, ShieldAlert, BarChart } from "lucide-react";
import { cn } from "@/services/utils";

interface TorneioCtx {
  torneio: Torneio;
  torneioId: string;
  liveCount: number;
}

interface PlayerStat {
  jogadorId: string;
  nomeJogador: string;
  timeId: string;
  nomeTime: string;
  saques: number;
  ataques: number;
  bloqueios: number;
  erroSaque: number;
  erroAtaque: number;
  outrosErros: number;
  totalPontos: number;
  totalErros: number;
  eficiencia: number;
}

const STAT_COLS: { key: keyof PlayerStat; label: string; color: string; icon: string }[] = [
  { key: "totalPontos", label: "Total Pts", color: "text-primary", icon: "🏆" },
  { key: "saques", label: "Saques", color: "text-blue-600", icon: "🏐" },
  { key: "ataques", label: "Ataques", color: "text-orange-600", icon: "⚡" },
  { key: "bloqueios", label: "Bloqueios", color: "text-purple-600", icon: "🛡️" },
  { key: "totalErros", label: "Erros", color: "text-red-500", icon: "✕" },
  { key: "eficiencia", label: "Efic. %", color: "text-emerald-600", icon: "📊" },
];

type SortKey = keyof PlayerStat;

export default function TorneioEstatisticas() {
  const { torneio, torneioId } = useOutletContext<TorneioCtx>();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [times, setTimes] = useState<{ id: string; nome: string }[]>([]);
  
  const [activeTab, setActiveTab] = useState<"resumo" | "detalhado">("resumo");
  const [sortKey, setSortKey] = useState<SortKey>("totalPontos");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [filterTime, setFilterTime] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      const [partidas, ts] = await Promise.all([
        api.listarPartidas(torneioId),
        api.listarTimes(torneioId),
      ]);
      setTimes(ts.map((t) => ({ id: t.id, nome: t.nome })));
      const timeNomeMap = new Map(ts.map((t) => [t.id, t.nome]));

      const eventosByPartida = await Promise.all(
        partidas
          .filter((p) => p.status === "FINALIZADA" || p.status === "AO_VIVO")
          .map((p) => api.listarEventosPartida(p.id).then((evs) => ({ partida: p, evs })))
      );

      const playerMap = new Map<string, PlayerStat>();

      eventosByPartida.forEach(({ partida, evs }) => {
        evs.filter((e) => !e.anulado).forEach((ev) => {
          if (!ev.jogadorId || !ev.jogadorNome) return;

          const key = ev.jogadorId;
          if (!playerMap.has(key)) {
            const timeId = ev.lado === "CASA" ? partida.timeCasaId : partida.timeVisitanteId;
            playerMap.set(key, {
              jogadorId: ev.jogadorId,
              nomeJogador: ev.jogadorNome,
              timeId,
              nomeTime: timeNomeMap.get(timeId) ?? "Desconhecido",
              saques: 0, ataques: 0, bloqueios: 0,
              erroSaque: 0, erroAtaque: 0, outrosErros: 0,
              totalPontos: 0, totalErros: 0, eficiencia: 0,
            });
          }

          const s = playerMap.get(key)!;
          if (ev.tipo === "SAQUE") s.saques++;
          else if (ev.tipo === "ATAQUE") s.ataques++;
          else if (ev.tipo === "BLOQUEIO") s.bloqueios++;
          else if (ev.tipo === "ERRO_ADVERSARIO") {
            if (ev.tipoErro === "ERRO_SAQUE") s.erroSaque++;
            else if (ev.tipoErro === "ERRO_ATAQUE") s.erroAtaque++;
            else s.outrosErros++;
          }

          s.totalPontos = s.saques + s.ataques + s.bloqueios;
          s.totalErros = s.erroSaque + s.erroAtaque + s.outrosErros;
          const tentativas = s.totalPontos + s.totalErros;
          s.eficiencia = tentativas > 0 ? Math.round((s.totalPontos / tentativas) * 100) : 0;
        });
      });

      setStats(Array.from(playerMap.values()));
      setLoading(false);
    }
    load();
  }, [torneioId]);

  const getTop3 = (key: SortKey) => {
    return [...stats]
      .sort((a, b) => (b[key] as number) - (a[key] as number))
      .slice(0, 3);
  };

  // 🆕 COMPUTANDO A SOMATÓRIA DAS ESTATÍSTICAS DO TIME SELECIONADO
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

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black text-foreground">Estatísticas do Torneio</h1>
        <p className="text-muted-foreground mt-1 text-sm">{torneio.nome}</p>
      </div>

      {stats.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
        </div>
      ) : (
        <>
          {/* Abas */}
          <div className="flex gap-1 mb-6 bg-muted/50 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("resumo")}
              className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all", activeTab === "resumo" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Líderes Individuais
            </button>
            <button
              onClick={() => setActiveTab("detalhado")}
              className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all", activeTab === "detalhado" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Tabela Completa
            </button>
          </div>

          {/* ABA LÍDERES */}
          {activeTab === "resumo" && (
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
                          <span className={cn("font-black", col.color)}>{player[col.key] as number}{col.key === "eficiencia" ? "%" : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ABA TABELA DETALHADA */}
          {activeTab === "detalhado" && (
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

              {/* 🆕 BANNER DA SOMATÓRIA DO TIME (Renderiza apenas se houver time selecionado) */}
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
                            <div className="h-7 w-7 rounded-md bg-primary/10 grid place-items-center text-xs font-bold text-primary shrink-0">
                              {row.nomeJogador.charAt(0).toUpperCase()}
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
          )}
        </>
      )}
    </div>
  );
}