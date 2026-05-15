import { useState } from "react";
import { MOCK_MIDIAS } from "./mockData";

export default function MidiasPage() {
  const [filter, setFilter] = useState("todos");

  const filtered = filter === "todos" ? MOCK_MIDIAS : MOCK_MIDIAS.filter(m => m.tipo === filter);

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">Mídias</div>
        <div className="section-sub">Fotos e vídeos do campeonato</div>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { id: "todos", label: "Todos" },
          { id: "foto",  label: "📸 Fotos" },
          { id: "video", label: "▶️ Vídeos" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
            background: filter === f.id ? "var(--primary-bg)" : "var(--surface)",
            border: `1px solid ${filter === f.id ? "rgba(0,196,79,.3)" : "var(--border)"}`,
            color: filter === f.id ? "var(--primary)" : "var(--text-muted)",
            cursor: "pointer", transition: "all .2s",
          }}>{f.label}</button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>
          {filtered.length} itens
        </div>
      </div>

      <div className="media-grid">
        {filtered.map(m => (
          <div className="media-card" key={m.id}>
            <div className="media-thumb" style={{ background: m.cor }}>
              <span style={{ fontSize: 44 }}>{m.emoji}</span>
              <div className="media-overlay" />
              {m.tipo === "video" && <div className="media-play">▶</div>}
            </div>
            <div className="media-info">
              <div className="media-title">{m.titulo}</div>
              <div className="media-type">{m.tipo === "foto" ? "📸 foto" : "▶️ vídeo"}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload area */}
      <div style={{
        marginTop: 20, padding: "24px 20px", borderRadius: 10,
        border: "2px dashed var(--border2)", background: "var(--surface)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📤</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Enviar mídia</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Arraste fotos ou vídeos, ou clique para selecionar</div>
        <button style={{
          marginTop: 12, padding: "7px 18px", borderRadius: 7,
          background: "var(--primary-bg)", border: "1px solid rgba(0,196,79,.3)",
          color: "var(--primary)", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>Selecionar arquivo</button>
      </div>
    </div>
  );
}