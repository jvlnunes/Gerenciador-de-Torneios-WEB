import { useState } from "react";
import { MOCK_TIMES, MOCK_ESTATISTICAS } from "./mockData";

export default function EstatisticasPage() {
  const [tab, setTab] = useState("pontos");

  const rankColors = ["gold", "silver", "bronze", "", ""];

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">Estatísticas</div>
        <div className="section-sub">Rankings e votações do campeonato</div>
      </div>

      <div className="stats-tabs">
        {[
          { id: "pontos",  label: "🏆 Pontos" },
          { id: "aces",    label: "🏐 Aces" },
          { id: "bloqueio",label: "🛡️ Bloqueios" },
          { id: "mvp",     label: "⭐ MVP" },
        ].map(t => (
          <button key={t.id} className={`stats-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "mvp" && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <h3>{tab === "pontos" ? "Top Pontuadores" : tab === "aces" ? "Top Aces" : "Top Bloqueios"}</h3>
            </div>
            {MOCK_ESTATISTICAS.topPontuadores.map((p, i) => (
              <div className="player-card" key={p.nome}>
                <div className={`player-rank-num ${rankColors[i]}`}>{i + 1}</div>
                <div className="player-avatar">{p.nome[0]}</div>
                <div className="player-info">
                  <div className="player-name">{p.nome}</div>
                  <div className="player-team">{p.time}</div>
                </div>
                <div className="player-stats">
                  <div className="pstat">
                    <div className="pstat-val" style={{ color: "var(--primary)" }}>
                      {tab === "pontos" ? p.pts : tab === "aces" ? p.aces : p.bloq}
                    </div>
                    <div className="pstat-lbl">{tab === "pontos" ? "pts" : tab === "aces" ? "aces" : "bloq"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mini stats por time */}
          <div>
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-header"><h3>Por time</h3></div>
              {MOCK_TIMES.slice(0, 5).map(t => (
                <div key={t.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="team-icon" style={{ width: 26, height: 26, fontSize: 10 }}>{t.nome[0]}</div>
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{t.nome}</div>
                  <div style={{ width: 80 }}>
                    <div className="vote-bar"><div className="vote-fill" style={{ width: `${Math.round(t.pts / 18 * 100)}%` }} /></div>
                  </div>
                  <div style={{ width: 30, textAlign: "right", fontFamily: "var(--font-disp)", fontSize: 14, fontWeight: 800, color: "var(--primary)" }}>{t.pts}</div>
                </div>
              ))}
            </div>

            {/* Destaques rápidos */}
            <div className="card">
              <div className="card-header"><h3>🎯 Destaques</h3></div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Maior sequência de vitórias", val: "Tigres FC (6V)" },
                  { label: "Melhor ataque", val: "Carlos Saque · 42pts" },
                  { label: "Melhor defesa", val: "Tigres FC · 94 bloq." },
                  { label: "Mais aces", val: "André Ataque · 8" },
                ].map(d => (
                  <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{d.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{d.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "mvp" && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3>⭐ MVP por Partida</h3></div>
            {MOCK_ESTATISTICAS.votacoes.map(v => (
              <div className="vote-card" key={v.partida}>
                <div className="vote-trophy">🏆</div>
                <div className="vote-info">
                  <div className="vote-match">{v.partida}</div>
                  <div className="vote-player">{v.mvp}</div>
                  <div className="vote-bar-wrap">
                    <div className="vote-bar"><div className="vote-fill" style={{ width: `${v.votos}%` }} /></div>
                    <div className="vote-pct">{v.votos}% dos votos</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header"><h3>🗳️ Votar — Partida atual</h3></div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                Tigres FC × Leões SP — Set 3 em andamento
              </div>
              {MOCK_ESTATISTICAS.topPontuadores.slice(0, 4).map(p => (
                <button key={p.nome} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", marginBottom: 6,
                  borderRadius: 8, border: "1px solid var(--border)",
                  background: "var(--surface2)", cursor: "pointer",
                  transition: "all .2s",
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "var(--primary-bg)"; }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface2)"; }}>
                  <div className="player-avatar" style={{ width: 30, height: 30, fontSize: 13 }}>{p.nome[0]}</div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.nome}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{p.time}</div>
                  </div>
                  <div style={{ fontSize: 20 }}>⭐</div>
                </button>
              ))}
              <button style={{
                width: "100%", marginTop: 8, padding: "10px", borderRadius: 8,
                background: "var(--primary-d)", border: "none", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                Confirmar voto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}