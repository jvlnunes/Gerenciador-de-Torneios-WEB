import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { api, type Torneio, type Partida } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { TournamentSidebar } from "@/components/tournament/sidebar/tournament-sidebar";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/torneios/$id")({
  component: TournamentLayout,
});

function TournamentLayout() {
  const { id: torneioId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";

  const [torneio, setTorneio] = useState<Torneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [t, partidas] = await Promise.all([
        api.buscarTorneio(torneioId),
        api.listarPartidas(torneioId),
      ]);
      setTorneio(t);
      setLiveCount(partidas.filter((p: Partida) => p.status === "AO_VIVO").length);
    } catch {
      navigate({ to: "/torneios" });
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
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
        <TournamentSidebar
          torneio={torneio}
          torneioId={torneioId}
          canManage={canManage}
          liveCount={liveCount}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ torneio, setTorneio, torneioId, canManage }} />
        </main>
      </div>
    </div>
  );
}