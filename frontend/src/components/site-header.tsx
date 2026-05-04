import { Link, useNavigate } from "@tanstack/react-router";
import { Trophy, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </span>
          <span>VolleyHub</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }} className="hover:text-primary transition-colors">
            Início
          </Link>
          <Link to="/tournaments" activeProps={{ className: "text-primary" }} className="hover:text-primary transition-colors">
            Torneios
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                Olá, <span className="font-semibold text-foreground">{user?.name}</span>
                <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{user?.role}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => { logout(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login" search={{}}>Entrar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/login" search={{}}>Começar</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
