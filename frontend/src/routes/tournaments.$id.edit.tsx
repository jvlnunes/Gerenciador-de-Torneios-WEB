import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  api, type Match, type Team, type Player, type MatchPlayer,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Plus, Play, Trophy, Clock, Users, X, Check,
  Pencil, ChevronRight, Loader2, AlertCircle, Shield,
  Swords, Calendar,
} from "lucide-react";

export const Route = createFileRoute("/tournaments/$id/edit")({
  component: MatchesPage,
});

/* ── helpers ──────────────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Agendada", WARMUP: "Aquecimento", LIVE: "Ao vivo", FINISHED: "Finalizada",
};
const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: "bg-muted text-muted-foreground",
  WARMUP:    "bg-amber-100 text-amber-700",
  LIVE:      "bg-green-100 text-green-700",
  FINISHED:  "bg-secondary text-secondary-foreground",
};
const POSITIONS = ["Levantador", "Ponteiro", "Oposto", "Central", "Líbero", "Outro"];

/* ── ScoreBoard mini ──────────────────────────────────────── */
function ScoreBoard({ match }: { match: Match }) {
  return (
    <div className="flex items-center gap-3 mt-3">
      <span className="flex-1 text-sm font-bold text-foreground truncate text-right">{match.homeTeamName}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        {match.sets.map((s, i) => (
          <div key={i} className="text-xs text-muted-foreground font-mono">
            {s.home}-{s.away}
          </div>
        ))}
        {match.status !== "FINISHED" && (
          <div className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-sm font-black font-mono">
            {match.currentSetHome} – {match.currentSetAway}
          </div>
        )}
        {match.status === "FINISHED" && (
          <div className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-sm font-black font-mono">
            {match.homeSets} – {match.awaySets}
          </div>
        )}
      </div>
      <span className="flex-1 text-sm font-bold text-foreground truncate">{match.awayTeamName}</span>
    </div>
  );
}

/* ── Create Match Modal ───────────────────────────────────── */
function CreateMatchModal({
  tournamentId,
  teams,
  onCreated,
  onClose,
}: {
  tournamentId: string;
  teams: Team[];
  onCreated: (m: Match) => void;
  onClose: () => void;
}) {
  const [homeId, setHomeId]       = useState("");
  const [awayId, setAwayId]       = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const submit = async () => {
    if (!homeId || !awayId) { setError("Selecione os dois times"); return; }
    if (homeId === awayId)  { setError("Times devem ser diferentes"); return; }
    setSaving(true); setError(null);
    try {
      const m = await api.createMatch({
        tournamentId, homeTeamId: homeId, awayTeamId: awayId,
        scheduledAt: scheduledAt || undefined,
        location: location || undefined,
      });
      onCreated(m);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Nova partida</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Time da casa</Label>
            <select value={homeId} onChange={e => setHomeId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">— Selecione —</option>
              {teams.filter(t => t.id !== awayId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="pb-1 text-muted-foreground font-bold text-lg">×</div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Visitante</Label>
            <select value={awayId} onChange={e => setAwayId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">— Selecione —</option>
              {teams.filter(t => t.id !== homeId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Data/hora
            </Label>
            <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Local</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Quadra A" className="h-10" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="flex-1 h-11 gap-2 font-semibold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar partida
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Lineup Editor Modal ──────────────────────────────────── */
function LineupModal({
  match,
  onClose,
  onStart,
}: {
  match: Match;
  onClose: () => void;
  onStart: (updated: Match) => void;
}) {
  const [homePlayers, setHomePlayers]   = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers]   = useState<Player[]>([]);
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
  const [loading, setLoading]           = useState(true);
  const [starting, setStarting]         = useState(false);
  const [tab, setTab]                   = useState<"home" | "away">("home");

  useEffect(() => {
    Promise.all([
      api.listPlayers(match.homeTeamId),
      api.listPlayers(match.awayTeamId),
      api.listMatchPlayers(match.id),
    ]).then(([hp, ap, mp]) => {
      setHomePlayers(hp); setAwayPlayers(ap); setMatchPlayers(mp);
    }).finally(() => setLoading(false));
  }, [match.id, match.homeTeamId, match.awayTeamId]);

  const getMP = (playerId: string) => matchPlayers.find(mp => mp.playerId === playerId);

  const toggleStarter = async (player: Player, teamId: string) => {
    const existing = getMP(player.id);
    const isStarter = existing?.isStarter ?? false;
    const currentStarters = matchPlayers.filter(mp => mp.teamId === teamId && mp.isStarter).length;
    if (!isStarter && currentStarters >= match.startersPerTeam) return; // limit reached

    const mp = await api.upsertMatchPlayer(match.id, {
      playerId: player.id, teamId,
      playerName: player.name,
      jerseyNumber: existing?.jerseyNumber ?? player.jerseyNumber,
      position: existing?.position ?? player.position,
      isStarter: !isStarter,
    });
    setMatchPlayers(prev => {
      const i = prev.findIndex(p => p.playerId === player.id);
      return i >= 0 ? prev.map(p => p.playerId === player.id ? mp : p) : [...prev, mp];
    });
  };

  const updateMP = async (playerId: string, teamId: string, playerName: string, field: "jerseyNumber" | "position", value: string | number) => {
    const existing = getMP(playerId);
    const mp = await api.upsertMatchPlayer(match.id, {
      playerId, teamId, playerName,
      jerseyNumber: field === "jerseyNumber" ? Number(value) : existing?.jerseyNumber,
      position: field === "position" ? String(value) : existing?.position,
      isStarter: existing?.isStarter ?? false,
    });
    setMatchPlayers(prev => {
      const i = prev.findIndex(p => p.playerId === playerId);
      return i >= 0 ? prev.map(p => p.playerId === playerId ? mp : p) : [...prev, mp];
    });
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const updated = await api.startMatch(match.id);
      onStart(updated);
    } catch (e) { alert((e as Error).message); setStarting(false); }
  };

  const players = tab === "home" ? homePlayers : awayPlayers;
  const teamId  = tab === "home" ? match.homeTeamId : match.awayTeamId;
  const teamName = tab === "home" ? match.homeTeamName : match.awayTeamName;
  const starters = matchPlayers.filter(mp => mp.teamId === teamId && mp.isStarter).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="w-full max-w-2xl bg-background rounded-2xl border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Escalação</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {match.homeTeamName} × {match.awayTeamName} — {match.startersPerTeam} titulares por time
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["home", "away"] as const).map(side => {
            const tid = side === "home" ? match.homeTeamId : match.awayTeamId;
            const tn  = side === "home" ? match.homeTeamName : match.awayTeamName;
            const sc  = matchPlayers.filter(mp => mp.teamId === tid && mp.isStarter).length;
            return (
              <button key={side} onClick={() => setTab(side)}
                className={cn("flex-1 px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px",
                  tab === side ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                {tn}
                <span className={cn("ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold",
                  sc >= match.startersPerTeam ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                  {sc}/{match.startersPerTeam}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-6 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : players.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum jogador cadastrado neste time.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground font-medium">
                Titulares selecionados: <strong className="text-foreground">{starters}/{match.startersPerTeam}</strong>
                {starters >= match.startersPerTeam && " ✓ Completo"}
              </p>
              <div className="space-y-2">
                {players.map(p => {
                  const mp = getMP(p.id);
                  const isStarter = mp?.isStarter ?? false;
                  const canAdd = !isStarter && starters < match.startersPerTeam;

                  return (
                    <div key={p.id}
                      className={cn("rounded-xl border-2 transition-all",
                        isStarter ? "border-primary bg-primary/5" : "border-border bg-card")}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <button
                          onClick={() => toggleStarter(p, teamId)}
                          disabled={!isStarter && !canAdd}
                          className={cn(
                            "h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                            isStarter
                              ? "border-primary bg-primary text-primary-foreground"
                              : canAdd
                                ? "border-border hover:border-primary text-muted-foreground hover:text-primary"
                                : "border-border text-muted-foreground opacity-40 cursor-not-allowed"
                          )}>
                          {isStarter ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </button>

                        <div className="h-8 w-8 rounded-full bg-secondary/15 grid place-items-center shrink-0">
                          <span className="text-xs font-bold text-secondary">
                            {mp?.jerseyNumber ?? p.jerseyNumber ?? "—"}
                          </span>
                        </div>

                        <span className="flex-1 text-sm font-semibold text-foreground">{p.name}</span>

                        {isStarter && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number" min={1} max={99}
                              defaultValue={mp?.jerseyNumber ?? p.jerseyNumber ?? ""}
                              placeholder="#"
                              className="h-8 w-16 text-center text-xs"
                              onBlur={e => updateMP(p.id, teamId, p.name, "jerseyNumber", e.target.value)}
                            />
                            <select
                              defaultValue={mp?.position ?? p.position ?? ""}
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              onChange={e => updateMP(p.id, teamId, p.name, "position", e.target.value)}
                            >
                              <option value="">Posição</option>
                              {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          {match.status !== "LIVE" && match.status !== "FINISHED" && (
            <Button onClick={handleStart} disabled={starting} className="gap-2 font-semibold"
              style={{ background: "#00843D", border: "none", color: "#fff" }}>
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Iniciar partida
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Match Card ───────────────────────────────────────────── */
function MatchCard({ match, canManage, onLineup, onDelete }: {
  match: Match; canManage: boolean;
  onLineup: () => void; onDelete: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-5 hover:border-primary/30 transition-all shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Badge className={cn("text-xs", STATUS_COLOR[match.status])}>
          {match.status === "LIVE" && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
          {STATUS_LABEL[match.status]}
        </Badge>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {match.scheduledAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(match.scheduledAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            </span>
          )}
          {match.location && <span>• {match.location}</span>}
        </div>
      </div>

      <ScoreBoard match={match} />

      <div className="mt-4 flex gap-2">
        {(match.status === "LIVE") && (
          <Button size="sm" className="flex-1 gap-1.5 font-semibold"
            style={{ background: "#00843D", border: "none", color: "#fff" }}
            onClick={() => navigate({ to: "/matches/$id", params: { id: match.id } })}>
            <Play className="h-3.5 w-3.5" /> Placar ao vivo
          </Button>
        )}
        {(match.status === "SCHEDULED" || match.status === "WARMUP") && canManage && (
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={onLineup}>
            <Users className="h-3.5 w-3.5" /> Escalação / Iniciar
          </Button>
        )}
        {match.status === "FINISHED" && (
          <Button size="sm" variant="outline" className="flex-1 gap-1.5"
            onClick={() => navigate({ to: "/matches/$id", params: { id: match.id } })}>
            Relatório
          </Button>
        )}
        {canManage && match.status !== "LIVE" && match.status !== "FINISHED" && (
          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}>
            Excluir
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
export default function MatchesPage() {
  const { id: tournamentId } = Route.useParams();
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [matches, setMatches]         = useState<Match[]>([]);
  const [teams, setTeams]             = useState<Team[]>([]);
  const [loading, setLoading]         = useState(true);
  const [creating, setCreating]       = useState(false);
  const [lineupMatch, setLineupMatch] = useState<Match | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ms, ts] = await Promise.all([api.listMatches(tournamentId), api.listTeams(tournamentId)]);
      setMatches(ms); setTeams(ts);
    } finally { setLoading(false); }
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta partida?")) return;
    await api.deleteMatch(id);
    setMatches(prev => prev.filter(m => m.id !== id));
  };

  const handleMatchStarted = (updated: Match) => {
    setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
    setLineupMatch(null);
  };

  const live    = matches.filter(m => m.status === "LIVE");
  const sched   = matches.filter(m => m.status === "SCHEDULED" || m.status === "WARMUP");
  const done    = matches.filter(m => m.status === "FINISHED");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {creating && (
        <CreateMatchModal
          tournamentId={tournamentId}
          teams={teams}
          onCreated={m => { setMatches(prev => [...prev, m]); setCreating(false); }}
          onClose={() => setCreating(false)}
        />
      )}

      {lineupMatch && (
        <LineupModal
          match={lineupMatch}
          onClose={() => setLineupMatch(null)}
          onStart={handleMatchStarted}
        />
      )}

      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Link to="/tournaments/$id/edit" params={{ id: tournamentId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">Partidas</h1>
            <p className="text-muted-foreground mt-1">{matches.length} partida{matches.length !== 1 ? "s" : ""} cadastrada{matches.length !== 1 ? "s" : ""}</p>
          </div>
          {canManage && teams.length >= 2 && (
            <Button onClick={() => setCreating(true)} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Nova partida
            </Button>
          )}
        </div>

        {teams.length < 2 && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Cadastre pelo menos 2 times antes de criar partidas.
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border py-20 text-center">
            <Swords className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">Nenhuma partida ainda</h2>
            <p className="mt-2 text-sm text-muted-foreground">Crie a primeira partida do torneio.</p>
            {canManage && teams.length >= 2 && (
              <Button className="mt-6 gap-2" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Criar partida
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {live.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Ao vivo
                </h2>
                <div className="space-y-4">
                  {live.map(m => <MatchCard key={m.id} match={m} canManage={canManage}
                    onLineup={() => setLineupMatch(m)} onDelete={() => handleDelete(m.id)} />)}
                </div>
              </section>
            )}
            {sched.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-bold text-foreground mb-3">Agendadas</h2>
                <div className="space-y-4">
                  {sched.map(m => <MatchCard key={m.id} match={m} canManage={canManage}
                    onLineup={() => setLineupMatch(m)} onDelete={() => handleDelete(m.id)} />)}
                </div>
              </section>
            )}
            {done.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-bold text-foreground mb-3">Finalizadas</h2>
                <div className="space-y-4">
                  {done.map(m => <MatchCard key={m.id} match={m} canManage={canManage}
                    onLineup={() => setLineupMatch(m)} onDelete={() => handleDelete(m.id)} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}