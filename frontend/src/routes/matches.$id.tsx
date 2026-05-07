import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  api, type Match, type MatchEvent, type PointType, type PointSide, type Player,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, RotateCcw, Flag, ChevronDown, ChevronUp,
  Loader2, Trophy, X,
} from "lucide-react";

export const Route = createFileRoute("/matches/$id")({
  component: LiveMatchPage,
});

/* ── Action definitions ──────────────────────────────────── */
type ActionDef = {
  type: PointType;
  label: string;
  emoji: string;
  isError: boolean;
};

const POINT_ACTIONS: ActionDef[] = [
  { type: "SAQUE",    label: "Saque",    emoji: "🏐", isError: false },
  { type: "ATAQUE",   label: "Ataque",   emoji: "⚡", isError: false },
  { type: "BLOQUEIO", label: "Bloqueio", emoji: "🛡️", isError: false },
];

const ERROR_ACTIONS: ActionDef[] = [
  { type: "ERRO_SAQUE", label: "Erro de saque", emoji: "❌", isError: true },
  { type: "TOQUE_REDE", label: "Toque na rede", emoji: "🕸️", isError: true },
  { type: "INVASAO",    label: "Invasão",       emoji: "⚠️", isError: true },
  { type: "BOLA_FORA",  label: "Bola fora",     emoji: "📤", isError: true },
  { type: "DUPLO",      label: "Duplo",         emoji: "✌️", isError: true },
];

const ALL_ACTIONS = [...POINT_ACTIONS, ...ERROR_ACTIONS];

const TYPE_LABEL: Record<PointType, string> = {
  SAQUE: "Saque", ATAQUE: "Ataque", BLOQUEIO: "Bloqueio", ERRO_ADVERSARIO: "Erro adversário",
  ERRO_SAQUE: "Erro de saque", ERRO_ATAQUE: "Erro de ataque",
  TOQUE_REDE: "Toque na rede", INVASAO: "Invasão", BOLA_FORA: "Bola fora", DUPLO: "Duplo toque",
};

/* ── Player Picker Modal ─────────────────────────────────── */
function PlayerPickerModal({
  title, players, onPick, onSkip,
}: {
  title: string;
  players: Player[];
  onPick: (p: Player) => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
          <p className="font-display font-bold text-foreground">{title}</p>
          <button onClick={onSkip} className="p-1.5 rounded-lg text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto p-3 space-y-1.5">
          {players.length === 0 && (
            <div className="py-6 text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">Nenhum jogador listado</p>
              <p className="text-xs text-muted-foreground px-4">Os jogadores aparecerão aqui assim que forem cadastrados no time pelo painel.</p>
            </div>
          )}
          {players.map(p => (
            <button key={p.id} onClick={() => onPick(p)}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent transition-all text-left">
              <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-border grid place-items-center shrink-0 text-xs font-black text-foreground">
                {p.jerseyNumber ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                {p.position && <p className="text-xs text-muted-foreground">{p.position}</p>}
              </div>
            </button>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-border bg-zinc-50 dark:bg-zinc-900">
          <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800">
            Continuar sem identificar jogador
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Action button (Corrigido para evitar botões pretos) ─── */
function ActionBtn({
  action, side, onAction, disabled
}: {
  action: ActionDef; side: PointSide;
  onAction: (a: ActionDef, s: PointSide) => void;
  disabled: boolean;
}) {
  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={() => onAction(action, side)}
      className={cn(
        "h-14 flex flex-col justify-center gap-1 transition-all active:scale-95 w-full",
        action.isError 
          // Estilo suave para ERROS (Cinza claro/escuro legível)
          ? "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800"
          // Estilo para PONTOS (Hover esverdeado para manter a identidade)
          : "hover:border-emerald-500/50 hover:bg-emerald-500/10 text-foreground"
      )}
    >
      <span className="text-sm font-semibold flex items-center gap-2">
        <span>{action.emoji}</span> {action.label}
      </span>
    </Button>
  );
}

/* ── One side panel (Horizontal Layout) ──────────────────── */
function SidePanel({
  teamName, side, onAction, disabled, isHome,
}: {
  teamName: string; side: PointSide;
  onAction: (a: ActionDef, s: PointSide) => void;
  disabled: boolean; isHome: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col bg-background border border-border rounded-2xl p-6 shadow-sm">
      {/* Team Header */}
      <div className="text-center mb-8 pb-6 border-b border-border">
        <h2 className="text-2xl font-display font-bold text-foreground truncate">{teamName}</h2>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          {isHome ? "Time da Casa" : "Time Visitante"}
        </p>
      </div>

      {/* Action Areas */}
      <div className="space-y-8 mt-auto">
        {/* Points */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-3 text-center">
            Pontos a favor (+)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {POINT_ACTIONS.map(a => (
              <ActionBtn key={a.type} action={a} side={side} onAction={onAction} disabled={disabled} />
            ))}
          </div>
        </div>

        {/* Errors */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 text-center">
            Erros cometidos (-)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ERROR_ACTIONS.map(a => (
              <ActionBtn key={a.type} action={a} side={side} onAction={onAction} disabled={disabled} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── History Panel ───────────────────────────────────────── */
function HistoryPanel({ events, homeTeamName, awayTeamName }: {
  events: MatchEvent[]; homeTeamName: string; awayTeamName: string;
}) {
  const [open, setOpen] = useState(true);
  const visible = [...events].reverse().slice(0, 60);

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden mt-6">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-sm font-bold text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
      >
        <span>Histórico da Partida ({events.length} eventos)</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border max-h-80 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-900/50">
          {visible.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum evento registrado ainda.</p>
          )}
          {visible.map((e, idx) => {
            const isHome   = e.side === "HOME";
            const teamName = isHome ? homeTeamName : awayTeamName;
            const emoji    = ALL_ACTIONS.find(a => a.type === e.type)?.emoji ?? "🏐";
            const isVoided = e.voided;

            return (
              <div key={e.id} className={cn(
                "flex items-center gap-4 px-6 py-3",
                idx === 0 && !isVoided && "bg-emerald-500/5 dark:bg-emerald-500/10",
                isVoided && "opacity-50 bg-red-500/5",
              )}>
                <span className="text-xl">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold text-foreground", isVoided && "line-through text-muted-foreground")}>
                    <span className="mr-2 text-xs font-bold px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {teamName}
                    </span>
                    {TYPE_LABEL[e.type]}
                    {e.playerName && <span className="ml-1 text-muted-foreground font-normal">— {e.playerName}</span>}
                    {isVoided && <span className="ml-2 text-xs font-normal text-red-500 dark:text-red-400 not-italic">(anulado)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Set {e.setIndex + 1} · Placar: {e.scoreHome}–{e.scoreAway}
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

/* ── Main Page ───────────────────────────────────────────── */
export default function LiveMatchPage() {
  const { id: matchId } = Route.useParams();
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [match, setMatch]             = useState<Match | null>(null);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [events, setEvents]           = useState<MatchEvent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [undoing, setUndoing]         = useState(false);
  const [finishing, setFinishing]     = useState(false);

  const [pendingAction, setPendingAction] = useState<{
    action: ActionDef; side: PointSide;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, evs] = await Promise.all([
        api.getMatch(matchId),
        api.listMatchEvents(matchId),
      ]);
      setMatch(m);
      setEvents(evs);
      
      const [hp, ap] = await Promise.all([
        api.listPlayers(m.homeTeamId),
        api.listPlayers(m.awayTeamId),
      ]);
      setHomePlayers(hp);
      setAwayPlayers(ap);
    } finally { setLoading(false); }
  }, [matchId]);

  useEffect(() => { load(); }, [load]);

  const setIndex = match ? match.sets.length : 0;

  const registerPoint = useCallback(async (
    action: ActionDef,
    side: PointSide,
    pickedPlayer?: Player,
  ) => {
    if (!match) return;

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
      playerId: pickedPlayer?.id,
      playerName: pickedPlayer?.name,
      scoreHome,
      scoreAway,
    });

    setEvents(prev => [...prev, event]);
    setMatch(updatedMatch);
    setPendingAction(null);

    const pts = setIndex >= match.setsToWinMatch * 2 - 2
      ? match.pointsToWinLastSet
      : match.pointsToWinSet;
    if ((scoreHome >= pts || scoreAway >= pts) && Math.abs(scoreHome - scoreAway) >= 2) {
      if (updatedMatch.homeSets >= match.setsToWinMatch || updatedMatch.awaySets >= match.setsToWinMatch) {
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

  const handlePickPlayer = (p: Player) => {
    if (!pendingAction) return;
    registerPoint(pendingAction.action, pendingAction.side, p);
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
        const lastActive = [...prev].reverse().find(e => !e.voided);
        if (!lastActive) return prev;
        return prev.map(e => e.id === lastActive.id ? { ...e, voided: true } : e);
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
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!match) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Partida não encontrada.</p>
    </div>
  );

  const isLive     = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const hasActiveEvents = events.filter(e => !e.voided).length > 0;

  const pickingFor: Player[] = pendingAction
    ? (pendingAction.action.isError
        ? (pendingAction.side === "HOME" ? homePlayers : awayPlayers) 
        : (pendingAction.side === "HOME" ? homePlayers : awayPlayers))
    : [];

  const pickTitle = pendingAction
    ? (pendingAction.action.isError ? "Quem cometeu o erro?" : "Quem fez o ponto?")
    : "";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#16171d] flex flex-col">
      <SiteHeader />

      {pendingAction && (
        <PlayerPickerModal
          title={pickTitle}
          players={pickingFor}
          onPick={handlePickPlayer}
          onSkip={handleSkipPlayer}
        />
      )}

      {/* ── HEADER / PLACAR SUPERIOR (Horizontal) ── */}
      <header className="border-b border-border bg-background shadow-sm sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          {/* Esquerda: Voltar */}
          <div className="w-1/4">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/tournaments/$id/matches" params={{ id: match.tournamentId }}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Link>
            </Button>
          </div>

          {/* Centro: Placar Principal */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-1">
              {isLive && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Set {setIndex + 1}
              </span>
            </div>
            <div className="flex items-center justify-center gap-8 text-5xl font-display font-black text-foreground">
              <span className="w-16 text-right">{match.currentSetHome}</span>
              <span className="text-2xl text-muted-foreground/30 font-medium">X</span>
              <span className="w-16 text-left">{match.currentSetAway}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm font-semibold text-muted-foreground">
              <span>Sets: {match.homeSets}</span>
              <span className="text-border px-2">|</span>
              <span>Sets: {match.awaySets}</span>
            </div>
          </div>

          {/* Direita: Ações Globais */}
          <div className="w-1/4 flex justify-end gap-2">
            {isLive && canManage && (
              <>
                <Button variant="outline" size="sm" onClick={handleUndo} disabled={undoing || !hasActiveEvents} className="border-zinc-300 dark:border-zinc-700">
                  {undoing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  Anular
                </Button>
                <Button size="sm" onClick={handleFinish} disabled={finishing} className="bg-emerald-600 text-white hover:bg-emerald-700 border-none">
                  {finishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Flag className="w-4 h-4 mr-2" />}
                  Encerrar
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── ÁREA PRINCIPAL ── */}
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
        
        {isFinished && (
          <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center space-y-3 shadow-sm">
            <Trophy className="h-12 w-12 text-emerald-500 mx-auto" />
            <h2 className="font-display text-3xl font-bold text-foreground">Partida encerrada!</h2>
            <p className="text-muted-foreground">
              {match.homeSets > match.awaySets ? match.homeTeamName : match.awayTeamName} venceu por {match.homeSets} a {match.awaySets} em sets.
            </p>
          </div>
        )}

        {/* ── Painéis dos Times (Lado a Lado) ── */}
        {(isLive && canManage) && (
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            <SidePanel
              teamName={match.homeTeamName}
              side="HOME"
              onAction={handleAction}
              disabled={!!pendingAction}
              isHome={true}
            />
            {/* Divisória Visual */}
            <div className="hidden lg:flex w-px bg-border/50 my-6" />
            <SidePanel
              teamName={match.awayTeamName}
              side="AWAY"
              onAction={handleAction}
              disabled={!!pendingAction}
              isHome={false}
            />
          </div>
        )}

        {/* ── Histórico ── */}
        <HistoryPanel
          events={events}
          homeTeamName={match.homeTeamName}
          awayTeamName={match.awayTeamName}
        />
      </main>
    </div>
  );
}