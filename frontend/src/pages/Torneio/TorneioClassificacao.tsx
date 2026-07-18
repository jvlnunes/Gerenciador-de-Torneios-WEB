import type { Torneio, Time, Partida } from "@/services/api/interfaces";
import { Loader2, Award, Minus, Trophy, BarChart3 } from "lucide-react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { cn } from "@/services/utils";

interface TorneioCtx {
  torneio: Torneio;
  torneioId: string;
  liveCount: number;
  // canManage: boolean;
}

interface StandingRow {
  time: Time;
  pts: number;
  jogos: number;
  vitorias: number;
  derrotas: number;
  setsPro: number;
  setsContra: number;
  pontosPro: number;
  pontosContra: number;
}

interface PlayerScorer {
  jogadorId: string;
  nomeJogador: string;
  nomeTime: string;
  totalPontos: number;
}

function buildStandings(times: Time[], partidas: Partida[]): StandingRow[] {
  const map = new Map<string, StandingRow>();
  times.forEach((t) =>
    map.set(t.id, {
      time: t,
      pts: 0,
      jogos: 0,
      vitorias: 0,
      derrotas: 0,
      setsPro: 0,
      setsContra: 0,
      pontosPro: 0,
      pontosContra: 0,
    })
  );

  partidas
    .filter((p) => p.status === "FINALIZADA")
    .forEach((p) => {
      const casa = map.get(p.timeCasaId);
      const visit = map.get(p.timeVisitanteId);
      if (!casa || !visit) return;

      casa.jogos++;
      visit.jogos++;

      const casaGanhou = p.setsCasa > p.setsVisitante;
      if (casaGanhou) {
        casa.vitorias++;
        visit.derrotas++;
        if (p.setsVisitante == 2) {
          visit.pts += 1;
          casa.pts += 2;
        }
        else {
          visit.pts += 0;
          casa.pts += 3;
        }
      } else {
        visit.vitorias++;
        casa.derrotas++;
        if (p.setsCasa == 2) {
          casa.pts += 1;
          visit.pts += 2;
        }
        else {
          casa.pts += 0;
          visit.pts += 3;
        }
      }

      casa.setsPro += p.setsCasa;
      casa.setsContra += p.setsVisitante;
      visit.setsPro += p.setsVisitante;
      visit.setsContra += p.setsCasa;

      (p.sets ?? []).forEach((s) => {
        casa.pontosPro += s.casa;
        casa.pontosContra += s.visitante;
        visit.pontosPro += s.visitante;
        visit.pontosContra += s.casa;
      });
    });

  return Array.from(map.values()).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const sdA = a.setsPro - a.setsContra;
    const sdB = b.setsPro - b.setsContra;
    if (sdB !== sdA) return sdB - sdA;
    return b.pontosPro - b.pontosContra - (a.pontosPro - a.pontosContra);
  });
}

function FormBadge({ result }: { result: "V" | "D" | "-" }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black",
        result === "V"
          ? "bg-emerald-100 text-emerald-700"
          : result === "D"
            ? "bg-red-100 text-red-600"
            : "bg-gray-100 text-gray-400"
      )}
    >
      {result}
    </span>
  );
}

export default function TorneioClassificacao() {
  const { torneio, torneioId } = useOutletContext<TorneioCtx>();
  const navigate = useNavigate();

  const [times, setTimes] = useState<Time[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [topJogadores, setTopJogadores] = useState<PlayerScorer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.times.listarPorTorneio(torneioId), api.partidas.listarPorTorneio(torneioId)])
      .then(async ([ts, ps]) => {
        setTimes(ts);
        setPartidas(ps);

        const timeNomeMap = new Map(ts.map((t) => [t.id, t.nome]));
        const partidasAlvo = ps.filter((p) => p.status === "FINALIZADA" || p.status === "AO_VIVO");

        // Agregação paralela rápida para descobrir o Top 3 Geral da página
        try {
          const eventosByPartida = await Promise.all(
            partidasAlvo.map((p) =>
              api.partidas.listarEventos(p.id).then((evs) => ({ partida: p, evs }))
            )
          );

          const playerMap = new Map<string, PlayerScorer>();

          eventosByPartida.forEach(({ partida, evs }) => {
            evs.filter((e) => !e.anulado).forEach((ev) => {
              if (!ev.jogadorId || !ev.jogadorNome) return;

              if (!playerMap.has(ev.jogadorId)) {
                const timeId = ev.lado === "CASA" ? partida.timeCasaId : partida.timeVisitanteId;
                playerMap.set(ev.jogadorId, {
                  jogadorId: ev.jogadorId,
                  nomeJogador: ev.jogadorNome,
                  nomeTime: timeNomeMap.get(timeId) ?? "Desconhecido",
                  totalPontos: 0,
                });
              }

              const pData = playerMap.get(ev.jogadorId)!;
              if (ev.tipo === "SAQUE" || ev.tipo === "ATAQUE" || ev.tipo === "BLOQUEIO") {
                pData.totalPontos++;
              }
            });
          });

          const sortedPlayers = Array.from(playerMap.values())
            .sort((a, b) => b.totalPontos - a.totalPontos)
            .slice(0, 3);

          setTopJogadores(sortedPlayers);
        } catch (err) {
          console.error("Erro ao computar destaques de atletas:", err);
        }
      })
      .finally(() => setLoading(false));
  }, [torneioId]);

  if (loading)
    return (
      <div className="p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  const standings = buildStandings(times, partidas);
  const finalizadas = partidas.filter((p) => p.status === "FINALIZADA");

  function getForm(timeId: string): ("V" | "D")[] {
    return finalizadas
      .filter((p) => p.timeCasaId === timeId || p.timeVisitanteId === timeId)
      .slice(-5)
      .map((p) => {
        const casaGanhou = p.setsCasa > p.setsVisitante;
        const ehCasa = p.timeCasaId === timeId;
        return (ehCasa ? casaGanhou : !casaGanhou) ? "V" : "D";
      });
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black text-foreground">Classificação</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {torneio.nome} · {finalizadas.length} partida{finalizadas.length !== 1 ? "s" : ""} finalizada{finalizadas.length !== 1 ? "s" : ""}
        </p>
      </div>

      {standings.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <Award className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma partida finalizada ainda.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Header da tabela */}
          <div className="grid items-center gap-1 px-4 py-3 bg-muted/40 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            style={{ gridTemplateColumns: "2rem 1fr 3rem 3rem 3rem 3rem 4rem 4rem 4rem 6rem" }}>
            <span>#</span>
            <span>Time</span>
            <span className="text-center">PTS</span>
            <span className="text-center">J</span>
            <span className="text-center">V</span>
            <span className="text-center">D</span>
            <span className="text-center">Sets</span>
            <span className="text-center">Pts</span>
            <span className="text-center">%V</span>
            <span className="text-center">Forma</span>
          </div>

          <div className="divide-y divide-border">
            {standings.map((row, i) => {
              const form = getForm(row.time.id);
              const pct = row.jogos > 0 ? Math.round((row.vitorias / row.jogos) * 100) : 0;
              const isLeader = i === 0 && standings.length > 1;

              return (
                <div
                  key={row.time.id}
                  className={cn(
                    "grid items-center gap-1 px-4 py-3 transition-colors",
                    isLeader ? "bg-primary/5" : "hover:bg-muted/20"
                  )}
                  style={{ gridTemplateColumns: "2rem 1fr 3rem 3rem 3rem 3rem 4rem 4rem 4rem 6rem" }}
                >
                  <span
                    className={cn(
                      "text-sm font-black text-center",
                      i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                    )}
                  >
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </span>

                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-md bg-primary/10 grid place-items-center text-xs font-bold text-primary shrink-0">
                      {row.time.nome[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-foreground truncate">{row.time.nome}</span>
                    {isLeader && (
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline">
                        Líder
                      </span>
                    )}
                  </div>

                  <span className="text-sm font-black text-foreground text-center">{row.pts}</span>
                  <span className="text-sm text-muted-foreground text-center">{row.jogos}</span>
                  <span className="text-sm font-medium text-emerald-600 text-center">{row.vitorias}</span>
                  <span className="text-sm font-medium text-red-500 text-center">{row.derrotas}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {row.setsPro}/{row.setsContra}
                    <span className={cn("ml-1 font-bold text-[10px]", row.setsPro - row.setsContra >= 0 ? "text-emerald-600" : "text-red-500")}>
                      ({row.setsPro - row.setsContra >= 0 ? "+" : ""}{row.setsPro - row.setsContra})
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    {row.pontosPro}/{row.pontosContra}
                  </span>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] font-bold text-foreground">{pct}%</span>
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-0.5">
                    {form.length === 0
                      ? <Minus className="h-3 w-3 text-muted-foreground" />
                      : form.map((r, idx) => <FormBadge key={idx} result={r} />)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-border bg-muted/30 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
            <span><span className="font-bold text-foreground">PTS</span> Pontos (V=3, D=1)</span>
            <span><span className="font-bold text-foreground">V/D</span> Vitórias/Derrotas</span>
            <span><span className="font-bold text-foreground">Sets</span> Pro/Contra (saldo)</span>
            <span><span className="font-bold text-foreground">Forma</span> Últimas 5</span>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* LADO ESQUERDO: RESULTADOS RECENTES */}
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-foreground">Resultados recentes</h2>
          {finalizadas.length === 0 ? (
            <div className="rounded-xl border border-border p-6 text-center text-xs text-muted-foreground bg-card/50">
              Nenhum resultado recente cadastrado.
            </div>
          ) : (
            <div className="space-y-2">
              {finalizadas.slice(-5).reverse().map((p) => (
                <div key={p.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3 shadow-sm">
                  <div className="flex-1 text-right text-sm font-semibold text-foreground truncate">{p.nomeTimeCasa}</div>
                  <div className="flex items-center gap-2 shrink-0 bg-muted/50 px-2.5 py-1 rounded-lg">
                    <span className={cn("font-display text-sm font-black", p.setsCasa > p.setsVisitante ? "text-foreground" : "text-muted-foreground")}>
                      {p.setsCasa}
                    </span>
                    <span className="text-muted-foreground text-xs">×</span>
                    <span className={cn("font-display text-sm font-black", p.setsVisitante > p.setsCasa ? "text-foreground" : "text-muted-foreground")}>
                      {p.setsVisitante}
                    </span>
                  </div>
                  <div className="flex-1 text-left text-sm font-semibold text-foreground truncate">{p.nomeTimeVisitante}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LADO DIREITO: TOP 3 DESTATQUES INDIVIDUAIS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-1.5">
              <Trophy className="h-5 w-5 text-yellow-500 shrink-0" /> Maiores Pontuadores
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("../estatisticas")}
              className="h-8 gap-1 text-xs font-bold border-primary/20 text-primary hover:bg-primary/5"
            >
              Ver Estatísticas <BarChart3 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {topJogadores.length === 0 ? (
            <div className="rounded-xl border border-border p-6 text-center text-xs text-muted-foreground bg-card/50 italic">
              Nenhum ponto atribuído a jogador até o momento.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden shadow-sm">
              {topJogadores.map((player, index) => (
                <div key={player.jogadorId} className="flex items-center justify-between px-4 py-3 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base w-5 text-center font-black">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                    </span>
                    <div className="truncate">
                      <p className="text-sm font-bold text-foreground truncate">{player.nomeJogador}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{player.nomeTime}</p>
                    </div>
                  </div>
                  <span className="font-black text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">
                    {player.totalPontos} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}