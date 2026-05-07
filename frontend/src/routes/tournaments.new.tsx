import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { CreateTournamentForm } from "@/components/tournament/create/create-tournament-form";

export const Route = createFileRoute("/tournaments/new")({
  head: () => ({ meta: [{ title: "Criar Torneio — VolleyHub" }] }),
  component: NewTournamentPage,
});

function NewTournamentPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-10">
        <Link
          to="/tournaments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para torneios
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            Criar novo torneio
          </h1>
          <p className="text-muted-foreground mt-2">
            Preencha as informações em cada etapa para configurar seu torneio.
          </p>
        </div>

        <CreateTournamentForm />
      </div>
    </div>
  );
}