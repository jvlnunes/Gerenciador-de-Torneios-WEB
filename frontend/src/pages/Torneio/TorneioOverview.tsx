import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { api, type Torneio, type Partida, type Time } from "@/services/api";

interface TorneioCtx { torneio: Torneio; torneioId: string; liveCount: number; }

export default function TorneioOverview() {
  const { torneio, torneioId } = useOutletContext<TorneioCtx>();
  const navigate = useNavigate();

  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [times, setTimes] = useState<Time[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [pRes, tRes] = await Promise.all([
          api.listarPartidas(torneioId),
          api.listarTimes(torneioId),
        ]);
        setPartidas(pRes);
        setTimes(tRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [torneioId]);

  const liveMatches = partidas.filter(p => p.status === "AO_VIVO");
  const topTimes = times.slice(0, 3);

  if (loading) return (
    <div className="p-6 text-muted-foreground text-sm">Carregando painel...</div>
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl">

      {/* Banner */}
      <div
        className="relative rounded-2xl overflow-hidden h-36"
        style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #0d1a0d 50%, #0a3d1f 100%)" }}
      >
        <div className="absolute inset-0 flex items-end p-5 gap-3">
          <div className="h-12 w-12 rounded-xl border-2 border-white/20 grid place-items-center text-2xl bg-primary/20">
            🏐
          </div>
          <div>
            <p className="font-display text-xl font-black text-white">{torneio.nome}</p>
            <div className="flex items-center gap-3 mt-0.5">
              {torneio.local && <span className="text-xs text-white/60">📍 {torneio.local}</span>}
              {torneio.dataInicio && (
                <span className="text-xs text-white/60">
                  📅 {new Date(torneio.dataInicio).toLocaleDateString("pt-BR")}
                </span>
              )}
              <span className="text-xs text-white/60">🏆 {times.length} times</span>
            </div>
          </div>
          <div className="ml-auto">
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "rgba(0,132,61,0.25)", border: "1px solid rgba(0,132,61,0.4)", color: "#4ade80" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              {torneio.status === "EM_ANDAMENTO" ? "Em andamento" : torneio.status}
            </span>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { n: String(times.length),    l: "Times" },
          { n: String(liveMatches.length), l: "Ao vivo", green: true },
          { n: String(partidas.length), l: "Partidas" },
          { n: "—",                     l: "Jogadores" },
        ].map(s => (
          <div key={s.l} className="rounded-xl border bg-card p-4 text-center shadow-sm">
            <p className={`font-display text-2xl font-black ${s.green && liveMatches.length > 0 ? "text-green-600" : "text-foreground"}`}>
              {s.n}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Partidas recentes */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">⚡ Partidas</h3>
            <button
              onClick={() => navigate("partidas")}
              className="text-xs text-primary hover:underline font-medium"
            >
              ver todas →
            </button>
          </div>

          {partidas.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma partida cadastrada.</p>
              <button
                onClick={() => navigate("partidas")}
                className="mt-3 text-xs font-semibold text-primary hover:underline"
              >
                Criar primeira partida →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {partidas.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${
                    m.status === "AO_VIVO" ? "bg-green-500 animate-pulse" :
                    m.status === "FINALIZADA" ? "bg-muted-foreground" : "bg-amber-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {m.nomeTimeCasa} <span className="text-muted-foreground font-normal">vs</span> {m.nomeTimeVisitante}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.local || (m.agendadoPara ? new Date(m.agendadoPara).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }) : "—")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {m.status === "AO_VIVO" && (
                      <span className="font-display font-black text-sm text-foreground">
                        {m.setAtualCasa} – {m.setAtualVisitante}
                      </span>
                    )}
                    {m.status === "FINALIZADA" && (
                      <span className="font-display font-black text-sm text-muted-foreground">
                        {m.setsCasa}×{m.setsVisitante}
                      </span>
                    )}
                    {(m.status === "AGENDADA" || m.status === "AQUECIMENTO") && (
                      <span className="text-xs font-semibold text-amber-600">
                        {m.agendadoPara ? new Date(m.agendadoPara).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "A definir"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Times participantes */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">🥇 Times participantes</h3>
            <button
              onClick={() => navigate("times")}
              className="text-xs text-primary hover:underline font-medium"
            >
              ver todos →
            </button>
          </div>

          {times.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Nenhum time inscrito ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {topTimes.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`text-sm font-black w-5 text-center shrink-0 ${
                    i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-xs font-black text-primary shrink-0">
                    {t.nome[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1 truncate">{t.nome}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {t.quantidadeJogadores ?? 0} jog.
                  </span>
                </div>
              ))}
              {times.length > 3 && (
                <div className="px-4 py-2">
                  {times.slice(3).map((t, i) => (
                    <div key={t.id} className="flex items-center gap-3 py-1.5">
                      <span className="text-xs text-muted-foreground w-5 text-center">{i + 4}</span>
                      <div className="h-6 w-6 rounded bg-muted grid place-items-center text-[10px] font-bold text-muted-foreground">
                        {t.nome[0].toUpperCase()}
                      </div>
                      <span className="text-xs text-muted-foreground flex-1 truncate">{t.nome}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Descrição */}
      {torneio.descricao && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Sobre o torneio</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{torneio.descricao}</p>
        </div>
      )}
    </div>
  );
}