import type { Torneio } from "@/services/api/interfaces";
import { Trophy, Plus, MapPin, Calendar, Lock, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { api, souOrganizador } from "@/services/api";
import { Link, useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  onDelete?: (e: React.MouseEvent) => void;
}) {
  return (
    <article
      onClick={onClick}
      className="group flex flex-col rounded-2xl border-2 border-border bg-card overflow-hidden transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg cursor-pointer"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Banner */}
      <div className="relative h-32 shrink-0 overflow-hidden bg-muted">
        {t.bannerUrl ? (
          <img src={t.bannerUrl} alt={`Banner ${t.nome}`} className="absolute inset-0 w-full h-full object-cover" />
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
            <img src={t.logoUrl} alt={`Logo ${t.nome}`} className="h-12 w-12 rounded-xl object-cover border-2 border-white/40 shadow-md" />
          ) : (
            <div className="h-12 w-12 rounded-xl border-2 border-white/30 shadow-md grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
              <Trophy className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="text-white text-sm font-bold bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
            {canManage ? <>Gerenciar torneio</> : <><Eye className="h-3.5 w-3.5" /> Ver torneio</>}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xl font-bold text-foreground leading-tight">{t.nome}</h3>
          {!canManage && (
            <span title="Somente visualização" className="text-muted-foreground shrink-0">
              <Lock className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        {t.descricao && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.descricao}</p>}

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {t.local && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {t.local}</span>}
          {t.dataInicio && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {new Date(t.dataInicio).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>

        {/* {canManage && onDelete && (
          <div className="mt-auto pt-4 border-t border-border flex justify-end">
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
              Excluir
            </Button>
          </div>
        )} */}
      </div>
    </article>
  );
}

function TournamentGrid({
  list,
  user,
  navigate,
  onDelete,
}: {
  list: Torneio[];
  user: ReturnType<typeof useAuth>["user"];
  navigate: ReturnType<typeof useNavigate>;
  onDelete: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {list.map((t) => {
        const canManage = user?.perfil === "ADMIN" || (user?.perfil === "GERENTE" && souOrganizador(t, user.id));
        return (
          <TournamentCard
            key={t.id}
            t={t}
            canManage={canManage}
            onClick={() => navigate(`/torneios/${t.id}`)}
            onDelete={canManage ? (e) => onDelete(e, t.id) : undefined}
          />
        );
      })}
    </div>
  );
}

export default function TorneiosListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<Torneio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isGerente = user?.perfil === "GERENTE";
  const canCreate = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";

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

  // Separação apenas para GERENTE: meus vs. outros
  const meus   = isGerente ? list.filter((t) => souOrganizador(t, user!.id)) : [];
  const outros = isGerente ? list.filter((t) => !souOrganizador(t, user!.id)) : list;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">Torneios</h1>
            <p className="mt-1 text-muted-foreground">
              {user?.perfil === "ADMIN"
                ? "Você é administrador: pode gerenciar todos os torneios."
                : isGerente
                ? "Gerencie seus torneios ou explore os demais."
                : "Explore os torneios de vôlei."}
            </p>
          </div>
          {canCreate && (
            <Button asChild>
              <Link to="/torneios/novo"><Plus className="mr-1 h-4 w-4" /> Novo torneio</Link>
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
            {[1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="mt-16 rounded-2xl border-2 border-dashed border-border py-20 text-center">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 font-display text-2xl font-bold text-foreground">Nenhum torneio ainda</h2>
            <p className="mt-2 text-muted-foreground">Crie o primeiro torneio para começar.</p>
            {canCreate ? (
              <Button className="mt-6" asChild>
                <Link to="/torneios/novo"><Plus className="mr-1 h-4 w-4" /> Criar torneio</Link>
              </Button>
            ) : (
              <Button className="mt-6" asChild>
                <Link to="/login">Entre como organizador</Link>
              </Button>
            )}
          </div>
        ) : isGerente ? (
          <>
            <section>
              <h2 className="mt-10 font-display text-xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" /> Meus torneios
                <Badge variant="secondary" className="text-xs">{meus.length}</Badge>
              </h2>
              {meus.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Você ainda não organiza nenhum torneio.</p>
              ) : (
                <TournamentGrid list={meus} user={user} navigate={navigate} onDelete={remove} />
              )}
            </section>

            <section>
              <h2 className="mt-12 font-display text-xl font-bold text-foreground flex items-center gap-2">
                <Eye className="h-5 w-5 text-muted-foreground" /> Outros torneios
                <Badge variant="secondary" className="text-xs">{outros.length}</Badge>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Você pode visualizar, mas não editar estes torneios.</p>
              {outros.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Nenhum outro torneio cadastrado.</p>
              ) : (
                <TournamentGrid list={outros} user={user} navigate={navigate} onDelete={remove} />
              )}
            </section>
          </>
        ) : (
          <TournamentGrid list={list} user={user} navigate={navigate} onDelete={remove} />
        )}
      </div>
    </div>
  );
}