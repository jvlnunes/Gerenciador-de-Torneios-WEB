import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Plus, MapPin, Calendar, Pencil } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, type Tournament } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/tournaments")({
  head: () => ({ meta: [{ title: "Torneios — VolleyHub" }, { name: "description", content: "Lista de torneios de vôlei." }] }),
  component: TournamentsPage,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Não foi possível carregar</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <Button className="mt-6" onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  ),
  notFoundComponent: () => <div className="p-10">Não encontrado</div>,
});

const statusColor: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  OPEN: "bg-success text-success-foreground",
  ONGOING: "bg-primary text-primary-foreground",
  FINISHED: "bg-secondary text-secondary-foreground",
};

function TournamentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const load = async () => {
    setLoading(true);
    try {
      setList(await api.listTournaments());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Excluir este torneio?")) return;
    await api.deleteTournament(id);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Torneios</h1>
            <p className="mt-1 text-muted-foreground">Explore, gerencie e edite torneios de vôlei.</p>
          </div>
          {canManage && (
            <Button onClick={() => navigate({ to: "/tournaments/new" })}>
              <Plus className="mr-1 h-4 w-4" /> Novo torneio
            </Button>
          )}
        </div>

        {error && <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        {loading ? (
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed py-20 text-center">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h2 className="mt-4 font-display text-2xl font-bold">Nenhum torneio ainda</h2>
            <p className="mt-2 text-muted-foreground">Crie o primeiro torneio para começar.</p>
            {canManage ? (
              <Button className="mt-6" onClick={() => navigate({ to: "/tournaments/new" })}>
                <Plus className="mr-1 h-4 w-4" /> Criar torneio
              </Button>
            ) : (
              <Button className="mt-6" asChild><Link to="/login" search={{}}>Entre como organizador</Link></Button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {list.map(t => (
              <article key={t.id} className="group flex flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40" style={{ boxShadow: "var(--shadow-elevated)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                    <Trophy className="h-5 w-5" />
                  </div>
                  {t.status && <Badge className={statusColor[t.status]}>{t.status}</Badge>}
                </div>
                <h3 className="mt-4 font-display text-xl font-bold">{t.name}</h3>
                {t.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {t.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {t.location}</span>}
                  {t.startDate && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(t.startDate).toLocaleDateString()}</span>}
                </div>
                {canManage && (
                  <div className="mt-5 flex gap-2 border-t pt-4">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate({ to: "/tournaments/$id/edit", params: { id: t.id } })}>
                      <Pencil className="mr-1 h-3 w-3" /> Editar
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(t.id)}>Excluir</Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
