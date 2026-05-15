import { useParams } from 'react-router-dom';
import { MOCK_PARTIDAS, MOCK_TIMES } from "./mockData";


export default function HomeTorneio() {
    const { torneioId } = useParams();
    const liveMatches = MOCK_PARTIDAS.filter(p => p.status === "AO_VIVO");
    const topTimes = MOCK_TIMES.slice(0, 3);

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
                            <span>📍 {torneio.local}</span>
                            <span>📅 Jun 1–15, 2026</span>
                            <span>🏆 8 times</span>
                        </div>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                        <Badge>Em andamento</Badge>
                    </div>
                </div>
            </div>

            {/* Stats strip */}
            <div className="stats-strip">
                {[
                    { n: "8", l: "Times" },
                    { n: "2", l: "Ao vivo" },
                    { n: "12", l: "Partidas" },
                    { n: "48", l: "Jogadores" },
                ].map(s => (
                    <div className="stat-cell" key={s.l}>
                        <div className="stat-num">{s.n}</div>
                        <div className="stat-lbl">{s.l}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2">
                {/* Partidas ao vivo */}
                <div className="card">
                    <div className="card-header">
                        <h3>⚡ Ao vivo</h3>
                        <button className="see-all" onClick={() => onNavigate("partidas")}>ver todas →</button>
                    </div>
                    {MOCK_PARTIDAS.map(m => (
                        <div className="match-row" key={m.id}>
                            <div className={`match-status ${m.status === "AO_VIVO" ? "live" : m.status === "FINALIZADA" ? "done" : "sched"}`} />
                            <div className="match-teams">
                                <div className="tm">{m.timeCasa}</div>
                                <div className="tm" style={{ color: "var(--text-muted)" }}>{m.timeVis}</div>
                            </div>
                            <div>
                                {m.status === "AO_VIVO" && (
                                    <div className="match-score">{m.setAtual[0]} – {m.setAtual[1]}</div>
                                )}
                                {m.status === "FINALIZADA" && (
                                    <div className="match-score" style={{ color: "var(--text-muted)" }}>{m.placar[0]}×{m.placar[1]}</div>
                                )}
                                {m.status === "AGENDADA" && (
                                    <div style={{ fontSize: 11, color: "var(--amber)" }}>{m.hora}</div>
                                )}
                                <div className="match-location">{m.local}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Top 3 */}
                <div className="card">
                    <div className="card-header">
                        <h3>🥇 Líderes</h3>
                        <button className="see-all" onClick={() => onNavigate("classificacao")}>tabela completa →</button>
                    </div>
                    {topTimes.map((t, i) => (
                        <div className="team-row" key={t.id}>
                            <div className="team-rank top">{i + 1}</div>
                            <div className="team-icon">{t.nome[0]}</div>
                            <div className="team-name">{t.nome}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.v}V {t.d}D</div>
                            <div className="team-pts">{t.pts}</div>
                        </div>
                    ))}
                    <div style={{ padding: "10px 16px" }}>
                        <div style={{ height: 1, background: "var(--border)", marginBottom: 10 }} />
                        {MOCK_TIMES.slice(3).map((t, i) => (
                            <div className="team-row" key={t.id} style={{ padding: "6px 0" }}>
                                <div className="team-rank">{i + 4}</div>
                                <div className="team-icon" style={{ width: 22, height: 22, fontSize: 9 }}>{t.nome[0]}</div>
                                <div className="team-name" style={{ fontSize: 12 }}>{t.nome}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.v}V</div>
                                <div className="team-pts" style={{ fontSize: 14 }}>{t.pts}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Descrição */}
            <div className="card" style={{ marginTop: 16, padding: "16px" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>Sobre o torneio</div>
                <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{torneio.descricao}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {["Instagram", "WhatsApp", "YouTube"].map(s => (
                        <span key={s} style={{ padding: "4px 10px", borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border2)", fontSize: 11, color: "var(--text-muted)" }}>
                            🔗 {s}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}