import { Link, NavLink, useNavigate } from "react-router-dom";
import { Trophy, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-xl font-bold tracking-tight"
        >
          <span
            className="grid h-9 w-9 place-items-center rounded-lg"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </span>
          <span>VolleyHub</span>
        </Link>

        {/* Navegação */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `transition-colors hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"}`
            }
          >
            Início
          </NavLink>
          <NavLink
            to="/torneios"
            className={({ isActive }) =>
              `transition-colors hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"}`
            }
          >
            Torneios
          </NavLink>
        </nav>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                Olá, <span className="font-semibold text-foreground">{user?.nome}</span>
                <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  {user?.perfil}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/login">Começar</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
