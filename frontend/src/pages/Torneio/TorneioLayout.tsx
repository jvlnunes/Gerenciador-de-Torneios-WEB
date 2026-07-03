import type { Torneio } from "@/services/api/interfaces";
import { Outlet, NavLink, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { api, podeGerenciarTorneio } from "@/services/api";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import {
  Home, Swords, Users, BarChart3, Settings,
  ChevronLeft, ChevronRight, Loader2, Trophy,
} from "lucide-react";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  end?: boolean;
}

function TorneioSidebar({
  torneio,
  torneioId,
  liveCount,
  collapsed,
  canManage,
  onToggle,
}: {
  torneio: Torneio;
  torneioId: string;
  liveCount: number;
  collapsed: boolean;
  canManage: boolean;
  onToggle: () => void;
}) {
  const base = `/torneios/${torneioId}`;

  const navItems: NavItem[] = [
    { to: base,                    icon: Home,      label: "Visão geral",  end: true },
    { to: `${base}/partidas`,      icon: Swords,    label: "Partidas",     badge: liveCount > 0 ? liveCount : undefined },
    { to: `${base}/times`,         icon: Users,     label: "Times" },
    { to: `${base}/classificacao`, icon: Trophy,    label: "Classificação" },
    { to: `${base}/estatisticas`,  icon: BarChart3, label: "Estatísticas" },
    { to: `${base}/configuracoes`, icon: Settings,  label: "Configurações" },
  ];

  return (
    <aside
      style={{
        width: collapsed ? 56 : 220,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--card)",
        borderRight: "1px solid var(--color-border)",
        transition: "width 200ms cubic-bezier(0.4,0,0.2,1)",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Toggle */}
      <button
        onClick={onToggle}
        title={collapsed ? "Expandir" : "Recolher"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "10px 12px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "var(--color-muted-foreground)",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
          transition: "color 200ms",
        }}
      >
        {collapsed
          ? <ChevronRight className="h-3.5 w-3.5" />
          : <ChevronLeft  className="h-3.5 w-3.5" />}
      </button>

      {/* Tournament info */}
      {!collapsed && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
          overflow: "hidden",
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: "color-mix(in oklch, var(--color-primary) 15%, transparent)",
            border: "1px solid color-mix(in oklch, var(--color-primary) 30%, transparent)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}>
            {torneio.logoUrl
              ? <img src={torneio.logoUrl} alt="Logo" className="h-6 w-6 rounded object-cover" />
              : <Trophy className="h-4 w-4" style={{ color: "var(--color-primary)" }} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--color-foreground)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.3,
            }}>
              {torneio.nome}
            </p>
            {torneio.local && (
              <p style={{
                fontSize: 10,
                color: "var(--color-muted-foreground)",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                📍 {torneio.local}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {navItems.map(({ to, icon: Icon, label, badge, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "10px" : "9px 14px",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              color: isActive
                ? "var(--color-primary)"
                : "var(--color-muted-foreground)",
              background: isActive
                ? "color-mix(in oklch, var(--color-primary) 10%, transparent)"
                : "transparent",
              borderLeft: `2px solid ${isActive ? "var(--color-primary)" : "transparent"}`,
              transition: "all 200ms",
              whiteSpace: "nowrap",
              position: "relative",
            })}
            className={({ isActive }) =>
              `hover:bg-muted hover:text-foreground ${isActive ? "" : ""}`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
            {!collapsed && badge !== undefined && (
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 99,
                background: "color-mix(in oklch, var(--color-primary) 18%, transparent)",
                color: "var(--color-primary)",
                border: "1px solid color-mix(in oklch, var(--color-primary) 30%, transparent)",
                animation: "pulse 1.6s ease infinite",
              }}>
                {badge} ao vivo
              </span>
            )}
            {collapsed && badge !== undefined && (
              <span style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--color-primary)",
              }} />
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default function TorneioLayout() {
  const { torneioId } = useParams<{ torneioId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const canManage = podeGerenciarTorneio(torneio, user);
  const isOwner = ( user?.perfil === "GERENTE" || user?.perfil === "ADMIN" ) && canManage;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <SiteHeader />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <TorneioSidebar
          torneio={torneio}
          torneioId={torneioId!}
          liveCount={liveCount}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          canManage={canManage} 
        />
        <main style={{ flex: 1, overflowY: "auto", background: "var(--color-background)" }}>
          <Outlet context={{ torneio, setTorneio, torneioId, liveCount }} />
        </main>
      </div>
    </div>
  );
}