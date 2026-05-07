import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

// Esta rota é apenas um layout wrapper.
// O componente renderiza <Outlet /> para que as rotas filhas
// (/tournaments/new e /tournaments/$id/edit) sejam exibidas.
// A lista de torneios ficou em tournaments.index.tsx

export const Route = createFileRoute("/tournaments")({
  component: TournamentsLayout,
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
});

function TournamentsLayout() {
  return <Outlet />;
}