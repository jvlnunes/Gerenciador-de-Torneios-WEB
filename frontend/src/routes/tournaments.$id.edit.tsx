import { createFileRoute, useNavigate, Link, redirect, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { TournamentForm } from "@/components/tournament-form";
import { Button } from "@/components/ui/button";
import { api, auth } from "@/lib/api";

export const Route = createFileRoute("/tournaments/$id/edit")({
  beforeLoad: ({ params }) => {
    const u = auth.getUser();
    if (!u) throw redirect({ to: "/login", search: { redirect: `/tournaments/${params.id}/edit` } });
    if (u.role !== "ADMIN" && u.role !== "MANAGER") throw redirect({ to: "/tournaments" });
  },
  loader: async ({ params }) => {
    try { return await api.getTournament(params.id); }
    catch { throw notFound(); }
  },
  head: () => ({ meta: [{ title: "Editar torneio — VolleyHub" }] }),
  component: EditTournament,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Erro</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <Button className="mt-6" onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  ),
  notFoundComponent: () => {
    const { id } = Route.useParams();
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold">Torneio não encontrado</h1>
          <p className="mt-2 text-muted-foreground">ID: {id}</p>
          <Button asChild className="mt-6"><Link to="/tournaments">Voltar</Link></Button>
        </div>
      </div>
    );
  },
});

function EditTournament() {
  const t = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Link to="/tournaments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar para torneios
        </Link>
        <h1 className="mt-4 font-display text-4xl font-bold">Editar torneio</h1>
        <p className="mt-1 text-muted-foreground">{t.name}</p>
        <div className="mt-8 rounded-2xl border bg-card p-8" style={{ boxShadow: "var(--shadow-elevated)" }}>
          <TournamentForm initial={t} onDone={() => navigate({ to: "/tournaments" })} />
        </div>
      </div>
    </div>
  );
}
