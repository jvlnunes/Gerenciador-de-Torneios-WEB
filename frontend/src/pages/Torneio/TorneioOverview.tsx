import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { api, type Torneio, type Partida, type Time } from "@/services/api";

interface TorneioCtx { torneio: Torneio; torneioId: string; liveCount: number; }

function Badge({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <span className={`live-badge ${className}`}><span className="live-dot" />{children}</span>;
}

export default function TorneioOverview() {
  const { torneio, torneioId } = useOutletContext<TorneioCtx>();
  const navigate = useNavigate();
  
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [times, setTimes] = useState<Time[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Buscando os dados reais do seu Backend
  useEffect(() => {
    async function carregarDados() {
      try {
        const [partidasRes, timesRes] = await Promise.all([
          api.listarPartidas(torneioId),
          api.listarTimes(torneioId)
        ]);
        setPartidas(partidasRes);
        setTimes(timesRes);
      } catch (error) {
        console.error("Erro ao carregar dados do torneio:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [torneioId]);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Carregando painel...</div>;
  }

  const liveMatches = partidas.filter(p => p.status === "AO_VIVO");
  
  // Como o backend ainda não retorna pontos, vamos simular os líderes para o visual não quebrar
  const topTimes = times.slice(0, 3).map(t => ({
    ...t, pts: 0, v: 0, d: 0
  }));

  return (
    <div className="page">
      {/* Banner */}
      <div className="hero-banner">
        <div className="grid-overlay" />
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-logo">🏐</div>
          <div>
            <div className="hero-title">{torneio.nome}</div>
            <div className="hero-meta">
              <span>📍 {torneio.local || "Local não definido"}</span>
              <span>📅 {torneio.dataInicio ? new Date(torneio.dataInicio).toLocaleDateString() : "Em breve"}</span>
              <span>🏆 {times.length} times</span>
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Badge>{torneio.status === "EM_ANDAMENTO" ? "Em andamento" : torneio.status}</Badge>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="stats-strip">
        {[
          { n: times.length.toString(),  l: "Times" },
          { n: liveMatches.length.toString(), l: "Ao vivo" },
          { n: partidas.length.toString(), l: "Partidas" },
          { n: "-", l: "Jogadores" }, // Pode ser implementado depois
        ].map(s => (
          <div className="stat-cell" key={s.l}>
            <div className="stat-num">{s.n}</div>
            <div className="stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Partidas ao vivo e recentes */}
        <div className="card">
          <div className="card-header">
            <h3>⚡ Partidas</h3>
            <button className="see-all" onClick={() => navigate("partidas")}>ver todas →</button>
          </div>
          
          {partidas.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma partida cadastrada.</div>
          )}

          {partidas.slice(0, 4).map(m => (
            <div className="match-row" key={m.id}>
              <div className={`match-status ${m.status === "AO_VIVO" ? "live" : m.status === "FINALIZADA" ? "done" : "sched"}`} />
              <div className="match-teams">
                <div className="tm">{m.nomeTimeCasa}</div>
                <div className="tm" style={{ color: "var(--text-muted)" }}>{m.nomeTimeVisitante}</div>
              </div>
              <div>
                {m.status === "AO_VIVO" && (
                  <div className="match-score">{m.setAtualCasa} – {m.setAtualVisitante}</div>
                )}
                {m.status === "FINALIZADA" && (
                  <div className="match-score" style={{ color: "var(--text-muted)" }}>{m.setsCasa}×{m.setsVisitante}</div>
                )}
                {m.status === "AGENDADA" && (
                  <div style={{ fontSize: 11, color: "var(--amber)" }}>{m.agendadoPara ? new Date(m.agendadoPara).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "A definir"}</div>
                )}
                <div className="match-location">{m.local || "-"}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Top 3 Líderes */}
        <div className="card">
          <div className="card-header">
            <h3>🥇 Times Participantes</h3>
            <button className="see-all" onClick={() => navigate("times")}>ver todos →</button>
          </div>
          
          {times.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">Nenhum time inscrito.</div>
          )}

          {topTimes.map((t, i) => (
            <div className="team-row" key={t.id}>
              <div className="team-rank top">{i + 1}</div>
              <div className="team-icon">{t.nome[0]}</div>
              <div className="team-name">{t.nome}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.v}V {t.d}D</div>
              <div className="team-pts">{t.pts}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}