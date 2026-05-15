import { useState } from "react";
import { MOCK_TIMES } from "./mockData";

export default function ClassificacaoPage() {
  const [formato] = useState("HIBRIDO");

  const formVitDer = (v, d) => {
    const total = v + d;
    return Array.from({ length: Math.min(total, 5) }, (_, i) => i < v ? "V" : "D").reverse();
  };

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">Classificação</div>
        <div className="section-sub">Fase de grupos • Formato híbrido — top 4 avançam</div>
      </div>

      {/* Formato indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { label: "Fase de Grupos", active: true },
          { label: "Mata-Mata", active: false },
          { label: "Final", active: false },
        ].map(f => (
          <div key={f.label} style={{
            padding: "6px 14px", borderRadius: 99,
            background: f.active ? "var(--primary-bg)" : "var(--surface)",
            border: `1px solid ${f.active ? "rgba(0,196,79,.3)" : "var(--border)"}`,
            fontSize: 12, fontWeight: 600,
            color: f.active ? "var(--primary)" : "var(--text-muted)",
          }}>{f.label}</div>
        ))}
      </div>

      <div className="card">
        {/* Header */}
        <div className="tabela-header">
          <div>#</div>
          <div />
          <div>Time</div>
          <div style={{ textAlign: "center" }}>PTS</div>
          <div style={{ textAlign: "center" }}>V</div>
          <div style={{ textAlign: "center" }}>D</div>
          <div style={{ textAlign: "center" }}>Sets</div>
          <div style={{ textAlign: "center" }}>Form.</div>
          <div style={{ textAlign: "right" }}>%V</div>
        </div>

        {/* Separator: classifica */}
        <div style={{ padding: "4px 16px", background: "rgba(0,196,79,.06)", borderBottom: "1px solid var(--border)", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--primary)" }}>
          ↑ Classificam para semifinal
        </div>

        {MOCK_TIMES.map((t, i) => {
          const isLeader = i === 0;
          const classifica = i < 4;
          const pct = Math.round((t.v / (t.v + t.d)) * 100) || 0;
          const form = formVitDer(t.v, t.d);

          return (
            <>
              {i === 4 && (
                <div style={{ padding: "4px 16px", background: "rgba(239,68,68,.04)", borderBottom: "1px solid var(--border)", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--red)" }}>
                  ↓ Eliminados
                </div>
              )}
              <div className={`tabela-row ${isLeader ? "leader" : ""}`} key={t.id}>
                <div className="t-rank">{i + 1}</div>
                <div>
                  <div className="t-ico">{t.nome[0]}</div>
                </div>
                <div className="t-n">{t.nome}</div>
                <div className="t-pts-cell">{t.pts}</div>
                <div className="t-v">{t.v}</div>
                <div className="t-d">{t.d}</div>
                <div className="t-sets">{t.sets[0]}/{t.sets[1]}</div>
                <div>
                  <div className="form-badges">
                    {form.map((r, fi) => (
                      <div key={fi} className={`fb ${r}`}>{r}</div>
                    ))}
                  </div>
                </div>
                <div className="t-pct">{pct}%</div>
              </div>
            </>
          );
        })}
      </div>

      {/* Mata-mata bracket (simplificado) */}
      <div style={{ marginTop: 24 }}>
        <div className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>Chaveamento — Mata-Mata</div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {[
              { label: "Semifinais", matches: [["Tigres FC","Falcões RJ"], ["Leões SP","Águias MG"]], status: "AGENDADA" },
              { label: "Final", matches: [["TBD","TBD"]], status: "AGENDADA" },
              { label: "3º lugar", matches: [["TBD","TBD"]], status: "AGENDADA" },
            ].map(phase => (
              <div key={phase.label}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-muted)", marginBottom: 8 }}>{phase.label}</div>
                {phase.matches.map((m, mi) => (
                  <div key={mi} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{m[0]}</div>
                    <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{m[1]}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}