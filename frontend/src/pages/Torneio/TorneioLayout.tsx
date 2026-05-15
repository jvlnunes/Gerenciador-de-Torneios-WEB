import { Outlet } from 'react-router-dom';
import { useState } from "react";
import { Sidebar } from "./Sidebar";

// ─── Componentes Auxiliares ───────────────────────────────────
function Badge({ children, className = "" }) {
  return (
    <span className={`live-badge ${className}`}>
      <span className="live-dot" />
      {children}
    </span>
  );
}

// ─── Componente Principal ─────────────────────────────────────
export default function TorneioLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="shell">
      {/* Top Header */}
      <header className="top-header">
        <a className="logo" href="#">
          <div className="logo-icon">🏐</div>
          VolleyHub
        </a>
        
        <div className="breadcrumb">
          <span>Torneios</span>
          <span>›</span>
          {/* Futuramente isso será dinâmico também */}
          <strong>Copa Verão 2026</strong>
          <div style={{ width: 1, height: 14, background: "var(--border)", margin: "0 4px" }} />
          <Badge>Em andamento</Badge>
        </div>
      </header>

      {/* Body da Aplicação */}
      <div className="body-split">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
        />
        
        <main className="main-content">
          {/* O TanStack Router vai injetar a página correta (Home, Classificação, etc) aqui dentro */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}