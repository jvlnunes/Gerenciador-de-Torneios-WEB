import { Outlet, NavLink, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { api, type Torneio } from "@/services/api";
import { SiteHeader } from "@/components/site-header";
import {
  Home, Swords, Users, BarChart3, Settings,
  ChevronLeft, ChevronRight, Loader2, Trophy,
} from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────
interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  end?: boolean;
}

// ── Sidebar ───────────────────────────────────────────────────
function TorneioSidebar({
  torneio,
  torneioId,
  liveCount,
  collapsed,
  onToggle,
}: {
  torneio: Torneio;
  torneioId: string;
  liveCount: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const base = `/torneios/${torneioId}`;

  const navItems: NavItem[] = [
    { to: base,                     icon: Home,      label: "Visão geral",  end: true },
    { to: `${base}/partidas`,       icon: Swords,    label: "Partidas",     badge: liveCount > 0 ? liveCount : undefined },
    { to: `${base}/times`,          icon: Users,     label: "Times" },
    { to: `${base}/classificacao`,  icon: BarChart3, label: "Classificação" },
    { to: `${base}/configuracoes`,  icon: Settings,  label: "Configurações" },
  ];

  return (
    <aside
      className="sidebar-torneio"
      style={{ width: collapsed ? 56 : 220 }}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="sidebar-toggle-btn"
        title={collapsed ? "Expandir" : "Recolher"}
      >
        {collapsed
          ? <ChevronRight className="h-3.5 w-3.5" />
          : <ChevronLeft  className="h-3.5 w-3.5" />}
      </button>

      {/* Tournament info */}
      {!collapsed && (
        <div className="sidebar-torneio-info">
          <div className="sidebar-torneio-logo">
            {torneio.logoUrl
              ? <img src={torneio.logoUrl} alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
              : <Trophy className="h-4 w-4" style={{ color: "var(--torneio-primary)" }} />}
          </div>
          <div className="sidebar-torneio-nome-wrap">
            <p className="sidebar-torneio-nome">{torneio.nome}</p>
            {torneio.local && (
              <p className="sidebar-torneio-meta">📍 {torneio.local}</p>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-torneio-nav">
        {navItems.map(({ to, icon: Icon, label, badge, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? " active" : ""}${collapsed ? " collapsed" : ""}`
            }
          >
            <Icon className="sidebar-nav-icon" />
            {!collapsed && <span className="sidebar-nav-label">{label}</span>}
            {!collapsed && badge !== undefined && (
              <span className="sidebar-nav-badge live">{badge} ao vivo</span>
            )}
            {collapsed && badge !== undefined && (
              <span className="sidebar-nav-badge-dot" />
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

// ── Layout principal ──────────────────────────────────────────
export default function TorneioLayout() {
  const { torneioId } = useParams<{ torneioId: string }>();
  const navigate = useNavigate();

  const [torneio,   setTorneio]   = useState<Torneio | null>(null);
  const [liveCount, setLiveCount] = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const load = useCallback(async () => {
    if (!torneioId) return;
    try {
      const [t, partidas] = await Promise.all([
        api.buscarTorneio(torneioId),
        api.listarPartidas(torneioId),
      ]);
      setTorneio(t);
      setLiveCount(partidas.filter((p) => p.status === "AO_VIVO").length);
    } catch {
      navigate("/torneios");
    } finally {
      setLoading(false);
    }
  }, [torneioId, navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!torneio) return null;

  return (
    <div className="torneio-shell">
      <SiteHeader />
      <div className="torneio-body">
        <TorneioSidebar
          torneio={torneio}
          torneioId={torneioId!}
          liveCount={liveCount}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
        <main className="torneio-main">
          {/* Passa o torneio pelo context para as páginas filhas usarem */}
          <Outlet context={{ torneio, setTorneio, torneioId, liveCount }} />
        </main>
      </div>
    </div>
  );
}