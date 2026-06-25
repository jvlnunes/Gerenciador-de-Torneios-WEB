import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, Plus, MapPin, Calendar } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, type Torneio } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/services/utils";

const statusColor: Record<string, string> = {
  RASCUNHO:     "bg-muted text-muted-foreground",
  ABERTO:       "bg-success/20 text-success border-success/30",
  EM_ANDAMENTO: "bg-primary/20 text-primary border-primary/30",
  FINALIZADO:   "bg-secondary text-secondary-foreground",
};

const statusLabel: Record<string, string> = {
  RASCUNHO:     "Rascunho",
  ABERTO:       "Inscrições abertas",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADO:   "Finalizado",
};

function TournamentCard({
  t,
  canManage,
  onClick,
  onDelete,
}: {
  t: Torneio;
  canManage: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <article
      onClick={canManage ? onClick : undefined}
      className={cn(
        "group flex flex-col rounded-2xl border-2 border-border bg-card overflow-hidden transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg",
        canManage && "cursor-pointer"
      )}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Banner */}
      <div className="relative h-32 shrink-0 overflow-hidden bg-muted">
        {t.bannerUrl ? (
          <img
            src={t.bannerUrl}
            alt={`Banner ${t.nome}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {t.status && (
          <div className="absolute top-3 right-3">
            <Badge className={cn("text-xs border", statusColor[t.status] ?? "")}>
              {statusLabel[t.status] ?? t.status}
            </Badge>
          </div>
        )}

        <div className="absolute bottom-3 left-3">
          {t.logoUrl ? (
            <img
              src={t.logoUrl}
              alt={`Logo ${t.nome}`}
              className="h-12 w-12 rounded-xl object-cover border-2 border-white/40 shadow-md"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-xl border-2 border-white/30 shadow-md grid place-items-center"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Trophy className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {canManage && (
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-white text-sm font-bold bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
              Gerenciar torneio
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-display text-xl font-bold text-foreground leading-tight">{t.nome}</h3>
        {t.descricao && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.descricao}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {t.local && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {t.local}
            </span>
          )}
          {t.dataInicio && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(t.dataInicio).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>

        {canManage && (
          <div className="mt-auto pt-4 border-t border-border flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              Excluir
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function TorneiosListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<Torneio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";

  const load = async () => {
    setLoading(true);
    try {
      setList(await api.listarTorneios());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Excluir este torneio?")) return;
    await api.removerTorneio(id);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
              Torneios
            </h1>
            <p className="mt-1 text-muted-foreground">
              {canManage
                ? "Clique em um torneio para gerenciá-lo."
                : "Explore os torneios de vôlei."}
            </p>
          </div>
          {canManage && (
            <Button asChild>
              <Link to="/torneios/novo">
                <Plus className="mr-1 h-4 w-4" /> Novo torneio
              </Link>
            </Button>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="mt-16 rounded-2xl border-2 border-dashed border-border py-20 text-center">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 font-display text-2xl font-bold text-foreground">
              Nenhum torneio ainda
            </h2>
            <p className="mt-2 text-muted-foreground">Crie o primeiro torneio para começar.</p>
            {canManage ? (
              <Button className="mt-6" asChild>
                <Link to="/torneios/novo">
                  <Plus className="mr-1 h-4 w-4" /> Criar torneio
                </Link>
              </Button>
            ) : (
              <Button className="mt-6" asChild>
                <Link to="/login">Entre como organizador</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {list.map((t) => (
              <TournamentCard
                key={t.id}
                t={t}
                canManage={canManage}
                onClick={() => navigate(`/torneios/${t.id}`)}
                onDelete={(e) => remove(e, t.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}