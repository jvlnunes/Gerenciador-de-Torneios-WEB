import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { api, type Torneio, type Time, type Jogador } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Plus, Settings, X, Loader2, AlertCircle,
  Users, Shield, Copy, Check, Swords, Trophy, MapPin,
  Calendar, ChevronRight, Trash2, Link2, RefreshCw, ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/tournaments/$id/edit")({
  component: TournamentManagePage,
});

/* ── Status helpers ───────────────────────────────────────── */
const statusColor: Record<string, string> = {
  RASCUNHO: "bg-muted text-muted-foreground",
  ABERTO: "bg-success/20 text-success border-success/30",
  EM_ANDAMENTO: "bg-primary/20 text-primary border-primary/30",
  FINALIZADO: "bg-secondary text-secondary-foreground",
};
const statusLabel: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ABERTO: "Inscrições abertas",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADO: "Finalizado",
};

const isPreparing = (status?: string) => status === "DRAFT" || status === "OPEN";

/* ── Auto-assign jersey number ────────────────────────────── */
function nextJerseyNumber(players: Jogador[]): number {
  const used = new Set(players.map(p => p.numeroCamisa).filter(Boolean) as number[]);
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

/* ── Quick Settings Modal ─────────────────────────────────── */
function QuickSettingsModal({
  tournament, onClose, onSaved,
}: {
  tournament: Torneio;
  onClose: () => void;
  onSaved: (t: Torneio) => void;
}) {
  const [name, setName]               = useState(tournament.nome);
  const [description, setDescription] = useState(tournament.descricao ?? "");
  const [location, setLocation]       = useState(tournament.local ?? "");
  const [status, setStatus]           = useState(tournament.status ?? "DRAFT");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) { setError("O nome é obrigatório"); return; }
    setSaving(true); setError(null);
    try {
      const updated = await api.atualizarTorneio(tournament.id, {
        nome: name.trim(), descricao: description, local: location, status: status as Torneio["status"],
      });
      onSaved(updated);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Configurações do torneio</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do torneio" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Descrição</Label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Descrição opcional..."
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Local</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ginásio Municipal" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Status</Label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="DRAFT">🗒️ Rascunho</option>
              <option value="OPEN">✅ Inscrições abertas</option>
              <option value="ONGOING">🏐 Em andamento</option>
              <option value="FINISHED">🏆 Finalizado</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">Cancelar</Button>
          <Button onClick={save} disabled={saving} className="flex-1 h-11 gap-2 font-semibold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Team Modal ────────────────────────────────────── */
function CreateTeamModal({
  tournamentId, onCreated, onClose,
}: {
  tournamentId: string;
  onCreated: (t: Time) => void;
  onClose: () => void;
}) {
  const [name, setName]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) { setError("Informe o nome do time"); return; }
    setSaving(true); setError(null);
    try {
      const t = await api.criarTime({ torneioId:tournamentId, nome: name.trim() });
      onCreated(t);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Novo time</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2 rounded-lg">{error}</div>
        )}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Nome do time *</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Ex: Tigres FC"
            className="h-11"
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="flex-1 h-11 gap-2 font-semibold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Inline editable cell ─────────────────────────────────── */
const POSITIONS = ["Levantador", "Ponteiro", "Oposto", "Central", "Líbero", "Outro"];

function EditableCell({
  value,
  type = "text",
  placeholder,
  isSelect,
  options,
  onSave,
}: {
  value: string;
  type?: string;
  placeholder?: string;
  isSelect?: boolean;
  options?: string[];
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    if (isSelect) {
      return (
        <select
          value={draft}
          onChange={e => { setDraft(e.target.value); setEditing(false); onSave(e.target.value); }}
          onBlur={() => setEditing(false)}
          autoFocus
          className="h-7 rounded border border-primary bg-background px-1 text-xs focus:outline-none"
        >
          <option value="">—</option>
          {options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className="h-7 w-full rounded border border-primary bg-background px-2 text-xs focus:outline-none"
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className="cursor-text hover:bg-muted/60 rounded px-1 py-0.5 transition-colors text-xs select-none"
      title="Clique para editar"
    >
      {value || <span className="text-muted-foreground italic">{placeholder ?? "—"}</span>}
    </span>
  );
}

/* ── Add Player inline row ────────────────────────────────── */
function AddPlayerRow({
  players,
  teamId,
  onCreated,
}: {
  players: Jogador[];
  teamId: string;
  onCreated: (p: Jogador) => void;
}) {
  const [name, setName]       = useState("");
  const [jersey, setJersey]   = useState("");
  const [position, setPosition] = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!name.trim()) { setError("Nome obrigatório"); nameRef.current?.focus(); return; }
    setSaving(true); setError(null);
    const jerseyNum = jersey ? Number(jersey) : nextJerseyNumber(players);
    try {
      const p = await api.criarJogador({
        timeId: teamId,
        nome: name.trim(),
        numeroCamisa: jerseyNum,
        posicao: position || undefined,
      });
      onCreated(p);
      setName(""); setJersey(""); setPosition("");
      nameRef.current?.focus();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div className="border-t border-border pt-3 space-y-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        {/* Jersey */}
        <input
          type="number"
          min={1}
          max={99}
          value={jersey}
          onChange={e => setJersey(e.target.value)}
          placeholder="Nº"
          className="h-8 w-12 rounded-md border border-input bg-background px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
        />
        {/* Name */}
        <input
          ref={nameRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Nome do jogador"
          className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />
        {/* Position */}
        <select
          value={position}
          onChange={e => setPosition(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Posição</option>
          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {/* Add button */}
        <button
          onClick={submit}
          disabled={saving}
          className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center hover:bg-primary/90 transition-colors shrink-0"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Nº será atribuído automaticamente se não preenchido · Pressione Enter para adicionar
      </p>
    </div>
  );
}

/* ── Team Card ────────────────────────────────────────────── */
function TeamCard({
  team,
  isActive,
  canManage,
  onActivate,
  onDelete,
}: {
  team: Time;
  isActive: boolean;
  canManage: boolean;
  onActivate: () => void;
  onDelete: () => void;
}) {
  const [players, setPlayers]     = useState<Jogador[]>([]);
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);

  useEffect(() => {
    if (!isActive || players.length > 0) return;
    setLoading(true);
    api.listarJogadores(team.id)
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, [isActive, team.id]);

  const inviteUrl = team.tokenConvite
    ? `${window.location.origin}/join/${team.tokenConvite}`
    : null;

  const copyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenInvite = async () => {
    setRegenLoading(true);
    try { await api.regenerateTeamInvite(team.id); }
    finally { setRegenLoading(false); }
  };

  const deletePlayer = async (playerId: string) => {
    if (!confirm("Remover jogador?")) return;
    await api.deletarJogador(team.id, playerId);
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  const updatePlayer = async (playerId: string, data: Partial<Player>) => {
    try {
      const updated = await api.atualizarJogador(team.id, playerId, data);
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ...updated } : p));
    } catch (e) { console.error(e); }
  };

  return (
    <div className={cn(
      "rounded-2xl border-2 bg-card shadow-sm overflow-hidden transition-all",
      isActive ? "border-primary/50" : "border-border"
    )}>
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors",
          isActive ? "hover:bg-primary/5" : "hover:bg-muted/30"
        )}
        onClick={onActivate}
      >
        <div className={cn(
          "h-10 w-10 rounded-xl grid place-items-center shrink-0",
          isActive ? "bg-primary/15" : "bg-muted"
        )}>
          <Shield className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-foreground">{team.nome}</h3>
          <p className="text-xs text-muted-foreground">
            {isActive ? players.length : (team.playerCount ?? 0)} jogador{((isActive ? players.length : (team.playerCount ?? 0)) !== 1) ? "es" : ""}
          </p>
        </div>
        {isActive
          ? <Badge className="text-xs border border-primary/30 bg-primary/10 text-primary">Aberto</Badge>
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
      </div>

      {/* Expanded content */}
      {isActive && (
        <div className="border-t border-border">
          {/* Invite link */}
          {inviteUrl && (
            <div className="px-5 py-3 bg-muted/30 flex items-center gap-2 border-b border-border">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground flex-1 truncate font-mono">{inviteUrl}</span>
              <button onClick={copyInvite} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              {canManage && (
                <button onClick={regenInvite} disabled={regenLoading} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <RefreshCw className={cn("h-3.5 w-3.5", regenLoading && "animate-spin")} />
                </button>
              )}
            </div>
          )}

          {/* Players table */}
          <div className="px-5 py-3">
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                {players.length > 0 && (
                  <div className="mb-2">
                    {/* Column headers */}
                    <div className="grid grid-cols-[2rem_1fr_5rem_1fr_2rem] gap-x-2 px-1 mb-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground text-center">Nº</span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Nome</span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Posição</span>
                      <span />
                      <span />
                    </div>
                    {/* Rows */}
                    <div className="space-y-0.5">
                      {players.map(p => (
                        <div key={p.id} className="grid grid-cols-[2rem_1fr_5rem_1rem] gap-x-2 items-center px-1 py-1.5 rounded-lg hover:bg-muted/40 group transition-colors">
                          {/* Jersey */}
                          <div className="text-center">
                            <EditableCell
                              value={p.numeroCamisa?.toString() ?? ""}
                              type="number"
                              placeholder="Nº"
                              onSave={v => updatePlayer(p.id, { jerseyNumber: v ? Number(v) : undefined })}
                            />
                          </div>
                          {/* Name */}
                          <EditableCell
                            value={p.nome}
                            placeholder="Nome"
                            onSave={v => v.trim() && updatePlayer(p.id, { name: v.trim() })}
                          />
                          {/* Position */}
                          <EditableCell
                            value={p.posicao ?? ""}
                            placeholder="Posição"
                            isSelect
                            options={POSITIONS}
                            onSave={v => updatePlayer(p.id, { position: v || undefined })}
                          />
                          {/* Delete */}
                          {canManage && (
                            <button
                              onClick={() => deletePlayer(p.id)}
                              className="p-0.5 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {players.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">Nenhum jogador ainda — adicione abaixo</p>
                )}

                {/* Add player inline */}
                {canManage && (
                  <AddPlayerRow
                    players={players}
                    teamId={team.id}
                    onCreated={p => setPlayers(prev => [...prev, p])}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer actions */}
          {canManage && (
            <div className="flex justify-end px-5 py-3 border-t border-border">
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir time
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
function TournamentManagePage() {
  const { id: tournamentId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";

  const [tournament, setTournament]     = useState<Torneio | null>(null);
  const [teams, setTeams]               = useState<Time[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [matchCount, setMatchCount]     = useState(0);
  // activeTeamId: which team is currently expanded/open (null = none)
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, ts, ms] = await Promise.all([
        api.buscarTorneio(tournamentId),
        api.listarTimes(tournamentId),
        api.listarPartidas(tournamentId),
      ]);
      setTournament(t);
      setTeams(ts);
      setMatchCount(ms.length);
    } finally { setLoading(false); }
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  const deleteTeam = async (id: string) => {
    if (!confirm("Excluir este time?")) return;
    await api.removerTime(id);
    setTeams(prev => prev.filter(t => t.id !== id));
    if (activeTeamId === id) setActiveTeamId(null);
  };

  const handleActivate = (teamId: string) => {
    setActiveTeamId(prev => prev === teamId ? null : teamId);
  };

  const preparing = isPreparing(tournament?.status);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );

  if (!tournament) return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="flex items-center justify-center py-32">
        <p className="text-muted-foreground">Torneio não encontrado.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {showSettings && (
        <QuickSettingsModal
          tournament={tournament}
          onClose={() => setShowSettings(false)}
          onSaved={t => { setTournament(t); setShowSettings(false); }}
        />
      )}

      {showCreateTeam && (
        <CreateTeamModal
          tournamentId={tournamentId}
          onCreated={t => {
            setTeams(prev => [...prev, t]);
            setShowCreateTeam(false);
            // Auto-open the newly created team
            setActiveTeamId(t.id);
          }}
          onClose={() => setShowCreateTeam(false)}
        />
      )}

      <div className="container mx-auto max-w-3xl px-4 py-10">
        {/* Back */}
        <Link
          to="/tournaments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para torneios
        </Link>

        {/* Tournament Header */}
        <div className="rounded-2xl border-2 border-border bg-card overflow-hidden mb-8 shadow-sm">
          {/* Banner */}
          <div className="relative h-36 bg-muted overflow-hidden">
            {tournament.bannerUrl ? (
              <img src={tournament.bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Status + gear */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {tournament.status && (
                <Badge className={cn("text-xs border", statusColor[tournament.status])}>
                  {statusLabel[tournament.status]}
                </Badge>
              )}
              {canManage && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-sm"
                  title="Configurações do torneio"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Logo + name */}
            <div className="absolute bottom-3 left-4 flex items-end gap-3">
              {tournament.logoUrl ? (
                <img src={tournament.logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-cover border-2 border-white/30 shadow" />
              ) : (
                <div className="h-12 w-12 rounded-xl border-2 border-white/20 grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
                  <Trophy className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h1 className="font-display text-2xl font-black text-white leading-tight">{tournament.nome}</h1>
                <div className="flex items-center gap-3 mt-0.5">
                  {tournament.local && (
                    <span className="text-xs text-white/70 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {tournament.local}
                    </span>
                  )}
                  {tournament.dataInicio && (
                    <span className="text-xs text-white/70 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(tournament.dataInicio).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip — 2 columns only */}
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="px-5 py-4 text-center">
              <p className="font-display text-2xl font-black text-foreground">{teams.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Times</p>
            </div>
            <div className="px-5 py-4 text-center">
              <p className="font-display text-2xl font-black text-foreground">{matchCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Partidas</p>
            </div>
          </div>
        </div>

        {/* Go to matches (ongoing) */}
        {!preparing && (
          <div
            className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 mb-6 flex items-center justify-between cursor-pointer hover:border-primary/60 transition-all"
            onClick={() => navigate({ to: "/tournaments/$id/matches", params: { id: tournamentId } })}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center">
                <Swords className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-foreground">Partidas</p>
                <p className="text-xs text-muted-foreground">{matchCount} partida{matchCount !== 1 ? "s" : ""} • Clique para gerenciar</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-primary" />
          </div>
        )}

        {/* Teams section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Times</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {teams.length} time{teams.length !== 1 ? "s" : ""} cadastrado{teams.length !== 1 ? "s" : ""}
                {activeTeamId && " · Clique no time ativo para fechar"}
              </p>
            </div>
            {canManage && (
              <Button size="sm" onClick={() => setShowCreateTeam(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Novo time
              </Button>
            )}
          </div>

          {teams.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <h3 className="mt-3 font-display text-lg font-bold text-foreground">Nenhum time ainda</h3>
              <p className="mt-1 text-sm text-muted-foreground">Adicione os times participantes do torneio.</p>
              {canManage && (
                <Button className="mt-4 gap-2" size="sm" onClick={() => setShowCreateTeam(true)}>
                  <Plus className="h-4 w-4" /> Criar time
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map(t => (
                <TeamCard
                  key={t.id}
                  team={t}
                  isActive={activeTeamId === t.id}
                  canManage={canManage}
                  onActivate={() => handleActivate(t.id)}
                  onDelete={() => deleteTeam(t.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Matches shortcut for preparing tournaments */}
        {preparing && teams.length >= 2 && canManage && (
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full gap-2 h-11"
              onClick={() => navigate({ to: "/tournaments/$id/matches", params: { id: tournamentId } })}
            >
              <Swords className="h-4 w-4" /> Ir para partidas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}