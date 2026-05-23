import { useEffect, useState, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { api, type Torneio, type Time, type Jogador } from "@/services/api";
import { useAuth } from "@/hooks/use-auth";
import {
  Plus, Loader2, X, Shield, Users, Copy, Check,
  ChevronDown, Trash2, Link2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/services/utils";

interface TorneioCtx {
  torneio: Torneio;
  torneioId: string;
  liveCount: number;
}

const POSITIONS = ["Levantador", "Ponteiro", "Oposto", "Central", "Líbero", "Outro"];

function nextJerseyNumber(players: Jogador[]): number {
  const used = new Set(players.map((p) => p.numeroCamisa).filter(Boolean) as number[]);
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

/* ── Inline editable cell ─────────────────────────────────── */
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
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (editing) {
    if (isSelect) {
      return (
        <select
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setEditing(false); onSave(e.target.value); }}
          onBlur={() => setEditing(false)}
          autoFocus
          className="h-7 rounded border border-primary bg-background px-1 text-xs focus:outline-none"
        >
          <option value="">—</option>
          {options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
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

/* ── Add Player Row ───────────────────────────────────────── */
function AddPlayerRow({
  players,
  teamId,
  onCreated,
}: {
  players: Jogador[];
  teamId: string;
  onCreated: (p: Jogador) => void;
}) {
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [position, setPosition] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        <input
          type="number"
          min={1}
          max={99}
          value={jersey}
          onChange={(e) => setJersey(e.target.value)}
          placeholder="Nº"
          className="h-8 w-12 rounded-md border border-input bg-background px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
        />
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Nome do jogador"
          className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Posição</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button
          onClick={submit}
          disabled={saving}
          className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center hover:bg-primary/90 transition-colors shrink-0"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Nº atribuído automaticamente se não preenchido · Enter para adicionar
      </p>
    </div>
  );
}

/* ── Create Team Modal ────────────────────────────────────── */
function CreateTeamModal({
  torneioId,
  onCreated,
  onClose,
}: {
  torneioId: string;
  onCreated: (t: Time) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) { setError("Informe o nome do time"); return; }
    setSaving(true); setError(null);
    try {
      const t = await api.criarTime({ torneioId, nome: name.trim() });
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
        {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2 rounded-lg">{error}</p>}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Nome do time *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
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

/* ── Team Card ────────────────────────────────────────────── */
function TeamCard({
  team,
  isActive,
  canManage,
  onActivate,
  onDelete,
  onPlayersLoaded,
}: {
  team: Time;
  isActive: boolean;
  canManage: boolean;
  onActivate: () => void;
  onDelete: () => void;
  onPlayersLoaded: (teamId: string, count: number) => void;
}) {
  const [players, setPlayers] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isActive || players.length > 0) return;
    setLoading(true);
    api.listarJogadores(team.id)
      .then((list) => {
        setPlayers(list);
        onPlayersLoaded(team.id, list.length);
      })
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

  const deletePlayer = async (playerId: string) => {
    if (!confirm("Remover jogador?")) return;
    await api.deletarJogador(team.id, playerId);
    setPlayers((prev) => {
      const next = prev.filter((p) => p.id !== playerId);
      onPlayersLoaded(team.id, next.length);
      return next;
    });
  };

  const updatePlayer = async (playerId: string, data: Partial<Jogador>) => {
    try {
      const updated = await api.atualizarJogador(team.id, playerId, data);
      setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, ...updated } : p)));
    } catch (e) { console.error(e); }
  };

  const handlePlayerCreated = (p: Jogador) => {
    setPlayers((prev) => {
      const next = [...prev, p];
      onPlayersLoaded(team.id, next.length);
      return next;
    });
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
            {isActive ? players.length : (team.quantidadeJogadores ?? 0)} jogador
            {((isActive ? players.length : (team.quantidadeJogadores ?? 0)) !== 1) ? "es" : ""}
          </p>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isActive && "rotate-180")} />
      </div>

      {/* Expanded */}
      {isActive && (
        <div className="border-t border-border">
          {inviteUrl && (
            <div className="px-5 py-3 bg-muted/30 flex items-center gap-2 border-b border-border">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground flex-1 truncate font-mono">{inviteUrl}</span>
              <button onClick={copyInvite} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}

          <div className="px-5 py-3">
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                {players.length > 0 && (
                  <div className="mb-2">
                    <div className="grid grid-cols-[2rem_1fr_5rem_1rem] gap-x-2 px-1 mb-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground text-center">Nº</span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Nome</span>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Posição</span>
                      <span />
                    </div>
                    <div className="space-y-0.5">
                      {players.map((p) => (
                        <div key={p.id} className="grid grid-cols-[2rem_1fr_5rem_1rem] gap-x-2 items-center px-1 py-1.5 rounded-lg hover:bg-muted/40 group transition-colors">
                          <div className="text-center">
                            <EditableCell
                              value={p.numeroCamisa?.toString() ?? ""}
                              type="number"
                              placeholder="Nº"
                              onSave={(v) => updatePlayer(p.id, { numeroCamisa: v ? Number(v) : undefined })}
                            />
                          </div>
                          <EditableCell
                            value={p.nome}
                            placeholder="Nome"
                            onSave={(v) => v.trim() && updatePlayer(p.id, { nome: v.trim() })}
                          />
                          <EditableCell
                            value={p.posicao ?? ""}
                            placeholder="Posição"
                            isSelect
                            options={POSITIONS}
                            onSave={(v) => updatePlayer(p.id, { posicao: v || undefined })}
                          />
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

                {canManage && (
                  <AddPlayerRow
                    players={players}
                    teamId={team.id}
                    onCreated={handlePlayerCreated}
                  />
                )}
              </>
            )}
          </div>

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
export default function TorneioTimes() {
  const { torneio, torneioId } = useOutletContext<TorneioCtx>();
  const { user } = useAuth();
  const canManage = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";

  const [teams, setTeams] = useState<Time[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  // track real player counts after loading
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ts = await api.listarTimes(torneioId);
      setTeams(ts);
    } finally {
      setLoading(false);
    }
  }, [torneioId]);

  useEffect(() => { load(); }, [load]);

  const handlePlayersLoaded = (teamId: string, count: number) => {
    setPlayerCounts((prev) => ({ ...prev, [teamId]: count }));
  };

  const deleteTeam = async (id: string) => {
    if (!confirm("Excluir este time? Todos os jogadores serão removidos.")) return;
    await api.removerTime(id);
    setTeams((prev) => prev.filter((t) => t.id !== id));
    if (activeTeamId === id) setActiveTeamId(null);
  };

  // Merge real player counts into teams display
  const teamsWithCounts = teams.map((t) => ({
    ...t,
    quantidadeJogadores: playerCounts[t.id] ?? t.quantidadeJogadores ?? 0,
  }));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {showCreate && (
        <CreateTeamModal
          torneioId={torneioId}
          onCreated={(t) => {
            setTeams((prev) => [...prev, t]);
            setShowCreate(false);
            setActiveTeamId(t.id);
          }}
          onClose={() => setShowCreate(false)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">Times</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {torneio.nome} · {teams.length} time{teams.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo time
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-3 font-display text-lg font-bold text-foreground">Nenhum time ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">Adicione os times participantes do torneio.</p>
          {canManage && (
            <Button className="mt-4 gap-2" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Criar primeiro time
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {teamsWithCounts.map((t) => (
            <TeamCard
              key={t.id}
              team={t}
              isActive={activeTeamId === t.id}
              canManage={canManage}
              onActivate={() => setActiveTeamId((prev) => prev === t.id ? null : t.id)}
              onDelete={() => deleteTeam(t.id)}
              onPlayersLoaded={handlePlayersLoaded}
            />
          ))}
        </div>
      )}
    </div>
  );
}