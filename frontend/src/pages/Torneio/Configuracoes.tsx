import { useState } from "react";

export default function ConfiguracoesPage() {
  const [expandido, setExpandido] = useState(null);

  const blocks = [
    {
      id: "info",
      icon: "🏆",
      title: "Informações básicas",
      sub: "Nome, data, local e status",
      fields: [
        { l: "Nome", v: "Copa Verão 2026" },
        { l: "Status", v: <span className="cfg-badge green">Em andamento</span> },
        { l: "Local", v: "Ginásio Municipal de Fortaleza" },
        { l: "Início", v: "01/06/2026" },
        { l: "Término", v: "15/06/2026" },
        { l: "Visibilidade", v: "Público" },
      ],
    },
    {
      id: "fases",
      icon: "🔀",
      title: "Fases e formato",
      sub: "Estrutura de disputa",
      fields: [
        { l: "Formato geral", v: <span className="cfg-badge green">Híbrido</span> },
        {
          l: "Fases",
          v: (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className="phase-chip">📊 Fase de grupos</span>
              <span className="phase-chip">⚔️ Mata-Mata</span>
            </div>
          ),
        },
        { l: "Máx. times", v: "8 times" },
        { l: "Classificados", v: "Top 4 → Semifinal" },
      ],
    },
    {
      id: "regras",
      icon: "📋",
      title: "Regras de partida",
      sub: "Sets, pontos e formação",
      fields: [
        { l: "Titulares por equipe", v: "6 jogadores" },
        { l: "Sets para vencer", v: "3 de 5 sets" },
        { l: "Pontos por set", v: "25 pontos" },
        { l: "Set decisivo", v: "15 pontos" },
        { l: "Vencer por 2 diferença", v: <span className="cfg-badge green">Ativo</span> },
      ],
    },
    {
      id: "organizadores",
      icon: "👥",
      title: "Organizadores",
      sub: "Responsáveis pelo torneio",
      fields: [
        { l: "Principal", v: "João Vitor Nunes" },
        { l: "E-mail", v: "jvnunes@volleyhub.com" },
        { l: "Assistentes", v: "2 assistentes" },
      ],
    },
    {
      id: "midia",
      icon: "🎨",
      title: "Mídia e identidade",
      sub: "Banner, logo e redes sociais",
      fields: [
        { l: "Banner", v: <span className="cfg-badge amber">Não configurado</span> },
        { l: "Logo", v: <span className="cfg-badge amber">Não configurado</span> },
      ],
      extra: (
        <div className="social-links-cfg">
          {["📸 Instagram", "💬 WhatsApp", "▶️ YouTube"].map(s => (
            <div key={s} className="social-link-badge">{s}</div>
          ))}
        </div>
      ),
    },
    {
      id: "danger",
      icon: "⚠️",
      title: "Zona de risco",
      sub: "Ações irreversíveis",
      fields: [],
      danger: true,
    },
  ];

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">Configurações</div>
        <div className="section-sub">Gerencie cada aspecto do torneio</div>
      </div>

      <div className="config-blocks">
        {blocks.map(b => (
          <div className="config-block" key={b.id} style={b.danger ? { borderColor: "rgba(239,68,68,.2)" } : {}}>
            <div className="config-block-header" style={b.danger ? { background: "rgba(239,68,68,.04)" } : {}}>
              <div className="config-icon" style={b.danger ? { background: "rgba(239,68,68,.1)", borderColor: "rgba(239,68,68,.2)" } : {}}>
                {b.icon}
              </div>
              <div>
                <div className="config-block-title" style={b.danger ? { color: "var(--red)" } : {}}>{b.title}</div>
                <div className="config-block-sub">{b.sub}</div>
              </div>
              {!b.danger && (
                <button className="config-edit-btn" onClick={() => setExpandido(expandido === b.id ? null : b.id)}>
                  {expandido === b.id ? "Fechar" : "Editar"}
                </button>
              )}
              <button
                onClick={() => setExpandido(expandido === b.id ? null : b.id)}
                style={{ marginLeft: b.danger ? "auto" : 4, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, transition: "transform .2s", transform: expandido === b.id ? "rotate(180deg)" : "rotate(0)" }}
              >▾</button>
            </div>

            {expandido === b.id && (
              <>
                {b.fields.length > 0 && (
                  <div className="config-fields">
                    {b.fields.map(f => (
                      <div className="config-field" key={f.l}>
                        <span className="cfg-lbl">{f.l}</span>
                        <span className="cfg-val">{f.v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {b.extra}
                {b.danger && (
                  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Encerrar inscrições", color: "var(--amber)" },
                      { label: "Resetar resultados", color: "var(--red)" },
                      { label: "Excluir torneio", color: "var(--red)" },
                    ].map(a => (
                      <button key={a.label} style={{
                        padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                        border: `1px solid ${a.color}30`, background: `${a.color}08`,
                        color: a.color, cursor: "pointer", textAlign: "left",
                        transition: "all .2s",
                      }} onMouseEnter={e => { e.currentTarget.style.background = `${a.color}18`; }}
                         onMouseLeave={e => { e.currentTarget.style.background = `${a.color}08`; }}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}