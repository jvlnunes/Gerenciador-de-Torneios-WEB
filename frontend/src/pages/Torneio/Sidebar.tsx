import { NavLink, useParams } from 'react-router-dom';

type NavSection = "torneio" | "ao_vivo" | "gestao";

// ─── Configurações do Menu ────────────────────────────────────
const NAV_ITEMS: Array<{
  id: string;
  icon: string;
  label: string;
  section: NavSection;
  badge?: string | null;
}> = [
  { id: "home",          icon: "🏠", label: "Início",         section: "torneio" },
  { id: "classificacao", icon: "📊", label: "Classificação",  section: "torneio", badge: null },
  { id: "estatisticas",  icon: "📈", label: "Estatísticas",   section: "torneio" },
  { id: "midias",        icon: "📸", label: "Mídias",         section: "torneio" },
  { id: "partidas",      icon: "⚔️", label: "Partidas",       section: "ao_vivo", badge: "2 ao vivo" },
  { id: "configuracoes", icon: "⚙️", label: "Configurações",  section: "gestao" },
];

const SECTIONS: Record<NavSection, string> = {
  torneio:  "Torneio",
  ao_vivo:  "Ao Vivo",
  gestao:   "Gestão",
};

export function Sidebar({ collapsed, onToggle }) {
  const { torneioId } = useParams();
  let lastSection: NavSection | null = null;
  

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-toggle">
        <button className="icon-btn" onClick={onToggle} title={collapsed ? "Expandir" : "Recolher"}>
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-header">
          {/* Futuramente, estes dados virão da sua API de torneios */}
          <div className="t-name">Copa Verão 2026</div>
          <div className="t-meta">📍 Fortaleza · 8 times</div>
          <div className="t-status">
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--primary)", display: "inline-block" }} />
            Em andamento
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const showSection = !collapsed && item.section !== lastSection;
          if (showSection) lastSection = item.section;

          // Monta a URL. Se for "home", vai para a raiz do torneio.
          const toPath = item.id === "home" 
            ? `/torneios/${torneioId}` 
            : `/torneios/${torneioId}/${item.id}`;

          return (
            <div key={item.id}>
              {showSection && (
                <div className="nav-section">{SECTIONS[item.section]}</div>
              )}
              
              <NavLink
                to={toPath}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                title={collapsed ? item.label : ""}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge ${item.id === "partidas" ? "live-b" : ""}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}