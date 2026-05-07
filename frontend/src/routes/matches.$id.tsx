import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  api, type Match, type MatchPlayer, type MatchEvent, type PointType, type PointSide,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, RotateCcw, Flag, ChevronDown, ChevronUp,
  Loader2, Check, Trophy, Clock, X,
} from "lucide-react";

export const Route = createFileRoute("/matches/$id")({
  component: LiveMatchPage,
});

/* ── Point / Error definitions ──────────────────────────────── */
type ActionDef = {
  type: PointType;
  label: string;
  emoji: string;
  color: string;        // tailwind bg
  isError: boolean;     // true = erro (ponto adversário)
};

const POINT_ACTIONS: ActionDef[] = [
  { type: "SAQUE",          label: "Saque",          emoji: "🏐", color: "bg-blue-500",    isError: false },
  { type: "ATAQUE",         label: "Ataque",          emoji: "⚡", color: "bg-amber-500",   isError: false },
  { type: "BLOQUEIO",       label: "Bloqueio",        emoji: "🛡️", color: "bg-purple-500",  isError: false },
  { type: "ERRO_ADVERSARIO",label: "Erro adversário", emoji: "🎯", color: "bg-green-600",   isError: false },
];
const ERROR_ACTIONS: ActionDef[] = [
  { type: "ERRO_SAQUE",  label: "Erro de saque",  emoji: "❌", color: "bg-red-500",    isError: true },
  { type: "ERRO_ATAQUE", label: "Erro de ataque", emoji: "💨", color: "bg-red-400",    isError: true },
  { type: "TOQUE_REDE",  label: "Toque na rede",  emoji: "🕸️", color: "bg-orange-500", isError: true },
  { type: "INVASAO",     label: "Invasão",         emoji: "⚠️", color: "bg-orange-400", isError: true },
  { type: "BOLA_FORA",   label: "Bola fora",      emoji: "📤", color: "bg-rose-500",   isError: true },
  { type: "DUPLO",       label: "Duplo toque",    emoji: "✌️", color: "bg-rose-400",   isError: true },
];

const TYPE_LABEL: Record<PointType, string> = {
  SAQUE: "Saque", ATAQUE: "Ataque", BLOQUEIO: "Bloqueio", ERRO_ADVERSARIO: "Erro adversário",
  ERRO_SAQUE: "Erro de saque", ERRO_ATAQUE: "Erro de ataque",
  TOQUE_REDE: "Toque na rede", INVASAO: "Invasão", BOLA_FORA: "Bola fora", DUPLO: "Duplo toque",
};

/* ── Player Picker Modal ─────────────────────────────────── */
function PlayerPickerModal({
  title,
  players,
  onPick,
  onSkip,
}: {
  title: string;
  players: MatchPlayer[];
  onPick: (mp: MatchPlayer) => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="font-display font-bold text-foreground">{title}</p>
          <button onClick={onSkip} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto p-3 space-y-1.5">
          {players.map(mp => (
            <button key={mp.id} onClick={() => onPick(mp)}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-primary/5 hover:border-primary/30 border border-transparent transition-all text-left">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0 text-xs font-black">
                {mp.jerseyNumber ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{mp.playerName}</p>
                {mp.position && <p className="text-xs text-muted-foreground">{mp.position}</p>}
              </div>
            </button>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border">
          <button onClick={onSkip}
            className="w-full rounded-lg py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium">
            Continuar sem especificar jogador
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Scoreboard Header ───────────────────────────────────── */
function Scoreboard({ match }: { match: Match }) {
  const setN = match.sets.length + 1;
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-lg mb-6"
      style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #0a3d1f 100%)" }}
    >
      <div className="px-4 py-2 flex items-center justify-between text-xs"
        style={{ background: "rgba(0,132,61,0.3)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span className="font-bold uppercase tracking-widest text-white/70">Set {setN}</span>
        <div className="flex items-center gap-3">
          {match.sets.map((s, i) => (
            <span key={i} className="font-mono text-white/50 text-xs">{s.home}–{s.away}</span>
          ))}
          <span className="flex items-center gap-1 font-bold" style={{ color: "#4ade80" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Ao vivo
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 items-center py-6 px-4 gap-4">
        {/* Home */}
        <div className="text-center">
          <p className="font-display font-black text-white text-base leading-tight">{match.homeTeamName}</p>
          <p className="text-xs mt-1 font-bold" style={{ color: "#4ade80" }}>Sets: {match.homeSets}</p>
        </div>

        {/* Scores */}
        <div className="flex items-center justify-center gap-3">
          <span className="font-display text-5xl font-black text-white">{match.currentSetHome}</span>
          <span className="font-display text-2xl font-black text-white/30">–</span>
          <span className="font-display text-5xl font-black text-white">{match.currentSetAway}</span>
        </div>

        {/* Away */}
        <div className="text-center">
          <p className="font-display font-black text-white text-base leading-tight">{match.awayTeamName}</p>
          <p className="text-xs mt-1 font-bold" style={{ color: "#4ade80" }}>Sets: {match.awaySets}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Action Buttons Grid ─────────────────────────────────── */
function ActionGrid({
  side,
  label,
  actions,
  onAction,
  disabled,
}: {
  side: PointSide;
  label: string;
  actions: ActionDef[];
  onAction: (action: ActionDef, side: PointSide) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(a => (
          <button
            key={a.type}
            disabled={disabled}
            onClick={() => onAction(a, side)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl p-3 text-white font-semibold text-xs transition-all active:scale-95 shadow-sm",
              a.color,
              disabled ? "opacity-40 cursor-not-allowed" : "hover:brightness-110"
            )}
          >
            <span className="text-xl">{a.emoji}</span>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── History ─────────────────────────────────────────────── */
function HistoryPanel({ events, homeTeamName, awayTeamName }: {
  events: MatchEvent[]; homeTeamName: string; awayTeamName: string;
}) {
  const [open, setOpen] = useState(false);
  const visible = [...events].filter(e => !e.voided).reverse().slice(0, 40);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-foreground hover:bg-muted/40 transition-colors"
      >
        <span>Histórico da partida ({visible.length} eventos)</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border max-h-96 overflow-y-auto">
          {visible.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">Nenhum evento ainda.</p>
          )}
          {visible.map((e, idx) => {
            const isHome = e.side === "HOME";
            const teamName = isHome ? homeTeamName : awayTeamName;
            return (
              <div key={e.id} className={cn("flex items-center gap-3 px-5 py-3",
                idx === 0 ? "bg-primary/5" : "")}>
                <span className="text-lg">{ERROR_ACTIONS.find(a => a.type === e.type)?.emoji ?? POINT_ACTIONS.find(a => a.type === e.type)?.emoji ?? "🏐"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    <span className={cn("mr-1", isHome ? "text-primary" : "text-amber-500")}>[{teamName}]</span>
                    {TYPE_LABEL[e.type]}
                    {e.playerName && <span className="ml-1 text-muted-foreground">— {e.playerName}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Set {e.setIndex + 1} • {e.scoreHome}–{e.scoreAway}
                    {" · "}{new Date(e.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Stats Summary ───────────────────────────────────────── */
function StatsSummary({ events, homeTeamName, awayTeamName }: {
  events: MatchEvent[]; homeTeamName: string; awayTeamName: string;
}) {
  const active = events.filter(e => !e.voided);
  const stat = (side: PointSide, type: PointType) => active.filter(e => e.side === side && e.type === type).length;

  const rows: { label: string; type: PointType; emoji: string }[] = [
    { label: "Saques",    type: "SAQUE",    emoji: "🏐" },
    { label: "Ataques",   type: "ATAQUE",   emoji: "⚡" },
    { label: "Bloqueios", type: "BLOQUEIO", emoji: "🛡️" },
    { label: "Erros adv.",type: "ERRO_ADVERSARIO", emoji: "🎯" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <p className="text-sm font-bold text-foreground">Estatísticas</p>
      </div>
      <div className="px-5 py-3 space-y-2">
        {rows.map(r => {
          const h = stat("HOME", r.type);
          const a = stat("AWAY", r.type);
          const total = h + a;
          return (
            <div key={r.type} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-bold text-primary">{h}</span>
                <span>{r.emoji} {r.label}</span>
                <span className="font-bold text-amber-500">{a}</span>
              </div>
              <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-muted">
                {total > 0 && (
                  <>
                    <div className="bg-primary rounded-full transition-all" style={{ width: `${(h/total)*100}%` }} />
                    <div className="bg-amber-400 rounded-full transition-all" style={{ width: `${(a/total)*100}%` }} />
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div className="pt-1 flex justify-between text-xs text-muted-foreground border-t border-border mt-2">
          <span className="font-bold text-foreground">{homeTeamName}</span>
          <span className="font-bold text-foreground">{awayTeamName}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */
function LiveMatchPage() {
  const { id: matchId } = Route.useParams();
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [match, setMatch]           = useState<Match | null>(null);
  const [homePlayers, setHomePlayers] = useState<MatchPlayer[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<MatchPlayer[]>([]);
  const [events, setEvents]         = useState<MatchEvent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [undoing, setUndoing]       = useState(false);
  const [finishing, setFinishing]   = useState(false);

  // Pending action state (waiting for player pick)
  const [pendingAction, setPendingAction] = useState<{
    action: ActionDef; side: PointSide;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, evs, mp] = await Promise.all([
        api.getMatch(matchId),
        api.listMatchEvents(matchId),
        api.listMatchPlayers(matchId),
      ]);
      setMatch(m);
      setEvents(evs);
      setHomePlayers(mp.filter(p => p.teamId === m.homeTeamId));
      setAwayPlayers(mp.filter(p => p.teamId === m.awayTeamId));
    } finally { setLoading(false); }
  }, [matchId]);

  useEffect(() => { load(); }, [load]);

  // Compute current set index
  const setIndex = match ? match.sets.length : 0;

  const registerPoint = useCallback(async (
    action: ActionDef,
    side: PointSide,
    pickedPlayer?: MatchPlayer,
  ) => {
    if (!match) return;

    // who gets the point
    const pointSide: PointSide = action.isError ? (side === "HOME" ? "AWAY" : "HOME") : side;

    const activeEvents = events.filter(e => !e.voided && e.matchId === matchId);
    const setEvs = activeEvents.filter(e => e.setIndex === setIndex);
    const last = setEvs[setEvs.length - 1];
    const scoreHome = (last?.scoreHome ?? 0) + (pointSide === "HOME" ? 1 : 0);
    const scoreAway = (last?.scoreAway ?? 0) + (pointSide === "AWAY" ? 1 : 0);

    const { event, match: updatedMatch } = await api.addMatchEvent(matchId, {
      setIndex,
      side: pointSide,
      type: action.type,
      playerId: pickedPlayer?.playerId,
      playerName: pickedPlayer?.playerName,
      scoreHome,
      scoreAway,
    });

    setEvents(prev => [...prev, event]);
    setMatch(updatedMatch);
    setPendingAction(null);

    // check set end
    const pts = setIndex >= match.setsToWinMatch * 2 - 2
      ? match.pointsToWinLastSet
      : match.pointsToWinSet;
    const diff = match.tieBreakEnabled ? 2 : 1; // not in Match type yet, default 2
    if (
      (scoreHome >= pts || scoreAway >= pts) &&
      Math.abs(scoreHome - scoreAway) >= 2
    ) {
      // set ended — check match end
      const newHomeSets = updatedMatch.homeSets;
      const newAwaySets = updatedMatch.awaySets;
      if (newHomeSets >= match.setsToWinMatch || newAwaySets >= match.setsToWinMatch) {
        if (confirm("Partida encerrada! Finalizar agora?")) {
          const finished = await api.finishMatch(matchId);
          setMatch(finished);
        }
      }
    }
  }, [match, events, matchId, setIndex]);

  const handleAction = (action: ActionDef, side: PointSide) => {
    setPendingAction({ action, side });
  };

  const handlePickPlayer = (mp: MatchPlayer) => {
    if (!pendingAction) return;
    registerPoint(pendingAction.action, pendingAction.side, mp);
  };

  const handleSkipPlayer = () => {
    if (!pendingAction) return;
    registerPoint(pendingAction.action, pendingAction.side, undefined);
  };

  const handleUndo = async () => {
    setUndoing(true);
    try {
      const { match: updated } = await api.voidLastEvent(matchId);
      setMatch(updated);
      setEvents(prev => {
        const nonVoided = prev.filter(e => !e.voided);
        const lastId = nonVoided[nonVoided.length - 1]?.id;
        return prev.map(e => e.id === lastId ? { ...e, voided: true } : e);
      });
    } catch (e) { alert((e as Error).message); }
    finally { setUndoing(false); }
  };

  const handleFinish = async () => {
    if (!confirm("Finalizar a partida agora?")) return;
    setFinishing(true);
    try {
      const updated = await api.finishMatch(matchId);
      setMatch(updated);
    } finally { setFinishing(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!match) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Partida não encontrada.</p>
    </div>
  );

  const isLive     = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const pickingFor = pendingAction
    ? (pendingAction.action.isError
        ? (pendingAction.side === "HOME" ? awayPlayers : homePlayers)
        : (pendingAction.side === "HOME" ? homePlayers : awayPlayers))
    : [];

  const pickTitle = pendingAction
    ? `${pendingAction.action.isError ? "Quem cometeu o erro?" : "Quem fez o ponto?"}`
    : "";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Player picker */}
      {pendingAction && (
        <PlayerPickerModal
          title={pickTitle}
          players={pickingFor}
          onPick={handlePickPlayer}
          onSkip={handleSkipPlayer}
        />
      )}

      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Back */}
        <Link
          to="/tournaments/$id/matches"
          params={{ id: match.tournamentId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Partidas
        </Link>

        {/* Scoreboard */}
        <Scoreboard match={match} />

        {/* Finished banner */}
        {isFinished && (
          <div className="rounded-2xl border-2 border-primary bg-primary/10 p-6 text-center space-y-2">
            <Trophy className="h-10 w-10 text-primary mx-auto" />
            <h2 className="font-display text-2xl font-bold text-foreground">Partida encerrada!</h2>
            <p className="text-muted-foreground text-sm">
              {match.homeSets > match.awaySets ? match.homeTeamName : match.awayTeamName} venceu por {match.homeSets}–{match.awaySets} sets.
            </p>
          </div>
        )}

        {/* Live controls */}
        {isLive && canManage && (
          <>
            {/* HOME points */}
            <div className="rounded-2xl border-2 border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-foreground">{match.homeTeamName}</h3>
                <Badge className="bg-primary/10 text-primary border-primary/20">Casa</Badge>
              </div>
              <ActionGrid side="HOME" label="Pontos" actions={POINT_ACTIONS} onAction={handleAction} disabled={!!pendingAction} />
              <ActionGrid side="HOME" label="Erros" actions={ERROR_ACTIONS} onAction={handleAction} disabled={!!pendingAction} />
            </div>

            {/* AWAY points */}
            <div className="rounded-2xl border-2 border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-foreground">{match.awayTeamName}</h3>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">Visitante</Badge>
              </div>
              <ActionGrid side="AWAY" label="Pontos" actions={POINT_ACTIONS} onAction={handleAction} disabled={!!pendingAction} />
              <ActionGrid side="AWAY" label="Erros" actions={ERROR_ACTIONS} onAction={handleAction} disabled={!!pendingAction} />
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2 h-11"
                onClick={handleUndo}
                disabled={undoing || events.filter(e => !e.voided).length === 0}
              >
                {undoing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Anular último
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleFinish}
                disabled={finishing}
              >
                {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                Encerrar partida
              </Button>
            </div>
          </>
        )}

        {/* Stats */}
        {events.filter(e => !e.voided).length > 0 && (
          <StatsSummary
            events={events}
            homeTeamName={match.homeTeamName}
            awayTeamName={match.awayTeamName}
          />
        )}

        {/* History */}
        <HistoryPanel
          events={events}
          homeTeamName={match.homeTeamName}
          awayTeamName={match.awayTeamName}
        />
      </div>
    </div>
  );
}