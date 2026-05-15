import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Trophy, Shield } from "lucide-react";
import type { Torneio } from "@/lib/api";

interface NavItem {
  label: string;
  icon: string;
  to: string;
  adminOnly?: boolean;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Visão geral",   icon: "ti-layout-dashboard", to: "overview"  },
  { label: "Classificação", icon: "ti-chart-bar",         to: "standings" },
  { label: "Estatísticas",  icon: "ti-activity",          to: "stats"     },
  { label: "Mídias",        icon: "ti-photo",             to: "media"     },
  { label: "Configurações", icon: "ti-settings",          to: "settings", adminOnly: true },
];

const STATUS_LABEL: Record<string, string> = {
  RASCUNHO:    "Rascunho",
  ABERTO:      "Inscrições abertas",
  EM_ANDAMENTO:"Em andamento",
  FINALIZADO:  "Finalizado",
};

const STATUS_DOT: Record<string, string> = {
  RASCUNHO:    "bg-muted-foreground",
  ABERTO:      "bg-success",
  EM_ANDAMENTO:"bg-primary animate-pulse",
  FINALIZADO:  "bg-secondary-foreground",
};

interface Props {
  torneio: Torneio;
  torneioId: string;
  canManage: boolean;
  liveCount?: number;
}

export function TournamentSidebar({ torneio, torneioId, canManage, liveCount = 0 }: Props) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const isActive = (to: string) => currentPath.includes(`/${to}`);

  const items = NAV_ITEMS.filter(item => !item.adminOnly || canManage);

  return (
    <aside className="flex h-full w-[220px] min-w-[220px] flex-col border-r border-border bg-card">
      {/* Header do torneio */}
      <div className="border-b border-border p-4">
        <div className="flex items-start gap-3">
          {torneio.logoUrl ? (
            <img
              src={torneio.logoUrl}
              alt={`Logo ${torneio.nome}`}
              className="h-10 w-10 rounded-xl object-cover border border-border flex-shrink-0"
            />
          ) : (
            <div
              className="h-10 w-10 rounded-xl flex-shrink-0 grid place-items-center"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Trophy className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-display font-bold text-foreground leading-tight truncate">
              {torneio.nome}
            </p>
            {torneio.status && (
              <span className="flex items-center gap-1.5 mt-1">
                <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", STATUS_DOT[torneio.status])} />
                <span className="text-[11px] text-muted-foreground">
                  {STATUS_LABEL[torneio.status]}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-3 pb-1 pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1">
            Torneio
          </p>
        </div>

        {items.slice(0, 4).map((item) => (
          <Link
            key={item.to}
            to={`/torneios/${torneioId}/${item.to}` as any}
            className={cn(
              "flex items-center gap-2.5 mx-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group",
              isActive(item.to)
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <i
              className={cn("ti", item.icon, "text-base flex-shrink-0 transition-colors",
                isActive(item.to) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}
              aria-hidden="true"
            />
            <span>{item.label}</span>
            {item.to === "overview" && liveCount > 0 && (
              <span className="ml-auto text-[10px] font-bold bg-green-500/15 text-green-600 px-1.5 py-0.5 rounded-full">
                {liveCount}
              </span>
            )}
          </Link>
        ))}

        {canManage && (
          <>
            <div className="px-3 pb-1 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1">
                Admin
              </p>
            </div>
            <Link
              to={`/torneios/${torneioId}/settings` as any}
              className={cn(
                "flex items-center gap-2.5 mx-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group",
                isActive("settings")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <i
                className={cn("ti ti-settings text-base flex-shrink-0 transition-colors",
                  isActive("settings") ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
                aria-hidden="true"
              />
              <span>Configurações</span>
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2">
        <Link
          to="/torneios"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
        >
          <i className="ti ti-arrow-left text-base" aria-hidden="true" />
          <span>Todos os torneios</span>
        </Link>
      </div>
    </aside>
  );
}