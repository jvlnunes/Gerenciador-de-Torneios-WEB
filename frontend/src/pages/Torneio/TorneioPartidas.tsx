import { useEffect, useState, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { api, type Torneio, type Partida, type Time } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/services/utils";
import {
  Plus, Loader2, Swords, Trophy, Play, Clock, MapPin, Trash2, X,
  Calendar, CheckCircle2,
} from "lucide-react";

interface TorneioCtx { torneio: Torneio; torneioId: string; liveCount: number; }

/* ── Modal criar partida ── */
function CreateMatchModal({
  torneioId,
  times,
  onCreated,
  onClose,
}: {
  torneioId: string;
  times: Time[];
  onCreated: (m: Partida) => void;
  onClose: () => void;
}) {
  const [timeCasaId, setTimeCasaId] = useState("");
  const [timeVisitanteId, setTimeVisitanteId] = useState("");
  const [agendadoPara, setAgendadoPara] = useState("");
  const [local, setLocal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!timeCasaId || !timeVisitanteId) { setError("Selecione os dois times"); return; }
    if (timeCasaId === timeVisitanteId) { setError("Os times precisam ser diferentes"); return; }
    setSaving(true); setError(null);
    try {
      const m = await api.criarPartida({
        torneioId,
        timeCasaId,
        timeVisitanteId,
        agendadoPara: agendadoPara || undefined,
        local: local || undefined,
      } as unknown as Omit<Partida, "id">);
      onCreated(m);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const sel = "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Nova partida</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2 rounded-lg">{error}</p>}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Time da casa *</label>
            <select value={timeCasaId} onChange={e => setTimeCasaId(e.target.value)} className={sel}>
              <option value="">— Selecionar —</option>
              {times.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">vs</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Time visitante *</label>
            <select value={timeVisitanteId} onChange={e => setTimeVisitanteId(e.target.value)} className={sel}>
              <option value="">— Selecionar —</option>
              {times.filter(t => t.id !== timeCasaId).map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Data/hora
            </label>
            <input
              type="datetime-local"
              value={agendadoPara}
              onChange={e => setAgendadoPara(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Local
            </label>
            <input
              type="text"
              value={local}
              onChange={e => setLocal(e.target.value)}
              placeholder="Ex: Quadra principal"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
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

/* ── Card de partida ── */
function MatchCard({
  match,
  canManage,
  onStart,
  onDelete,
  onOpen,
}: {
  match: Partida;
  canManage: boolean;
  onStart: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const isLive     = match.status === "AO_VIVO";
  const isFinished = match.status === "FINALIZADA";
  const isScheduled = match.status === "AGENDADA" || match.status === "AQUECIMENTO";

  const statusColor: Record<string, string> = {
    AO_VIVO:    "bg-green-100 text-green-700 border-green-200",
    AGENDADA:   "bg-muted text-muted-foreground",
    AQUECIMENTO:"bg-amber-100 text-amber-700 border-amber-200",
    FINALIZADA: "bg-secondary text-secondary-foreground",
  };
  const statusLabel: Record<string, string> = {
    AO_VIVO: "Ao vivo", AGENDADA: "Agendada",
    AQUECIMENTO: "Aquecimento", FINALIZADA: "Finalizada",
  };

  return (
    <div className={cn(
      "rounded-2xl border-2 bg-card overflow-hidden shadow-sm transition-all",
      isLive ? "border-green-300 shadow-green-100/50" : "border-border hover:border-primary/30"
    )}>
      {isLive && <div className="h-1 w-full bg-gradient-to-r from-green-400 to-green-600" />}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge className={cn("text-xs border", statusColor[match.status])}>
            {isLive && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse mr-1.5 inline-block" />}
            {statusLabel[match.status] ?? match.status}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {match.agendadoPara && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(match.agendadoPara).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
              </span>
            )}
            {match.local && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {match.local}</span>
            )}
          </div>
        </div>

        <div
          className={cn("flex items-center gap-3", !isScheduled || isLive ? "cursor-pointer" : "")}
          onClick={!isScheduled || isLive ? onOpen : undefined}
        >
          <div className="flex-1 text-right">
            <p className="font-display font-bold text-foreground">{match.nomeTimeCasa}</p>
            <p className="text-xs text-muted-foreground">Casa</p>
          </div>
          {isScheduled ? (
            <div className="px-4 py-2 rounded-xl bg-muted text-center min-w-[4rem]">
              <span className="font-display text-lg font-black text-muted-foreground">vs</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl text-center min-w-[5rem]"
              style={{ background: "linear-gradient(135deg,#0a0a0a,#052e16)" }}>
              <span className="font-display text-2xl font-black text-white">
                {match.setAtualCasa} – {match.setAtualVisitante}
              </span>
            </div>
          )}
          <div className="flex-1 text-left">
            <p className="font-display font-bold text-foreground">{match.nomeTimeVisitante}</p>
            <p className="text-xs text-muted-foreground">Visitante</p>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
            {isScheduled && (
              <Button size="sm" onClick={onStart} className="flex-1 gap-1.5 h-9">
                <Play className="h-3.5 w-3.5" /> Iniciar
              </Button>
            )}
            {isLive && (
              <Button size="sm" onClick={onOpen} className="flex-1 gap-1.5 h-9">
                <Swords className="h-3.5 w-3.5" /> Gerenciar ao vivo
              </Button>
            )}
            {isFinished && (
              <Button size="sm" variant="outline" onClick={onOpen} className="flex-1 gap-1.5 h-9">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ver resultado
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onDelete}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 px-2">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Página principal ── */
export default function TorneioPartidas() {
  const { torneio, torneioId } = useOutletContext<TorneioCtx>();
  const navigate = useNavigate();

  // Detectar se o user pode gerenciar (baseado no localStorage igual ao hook useAuth)
  const user = (() => { try { return JSON.parse(localStorage.getItem("vb_user") ?? "null"); } catch { return null; } })();
  const canManage = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";

  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [times, setTimes] = useState<Time[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ps, ts] = await Promise.all([
        api.listarPartidas(torneioId),
        api.listarTimes(torneioId),
      ]);
      setPartidas(ps);
      setTimes(ts);
    } finally {
      setLoading(false); }
  }, [torneioId]);

  useEffect(() => { load(); }, [load]);

  const handleStart = async (id: string) => {
    setStarting(id);
    try {
      const updated = await api.comecaPartida(id);
      setPartidas(prev => prev.map(m => m.id === id ? updated : m));
      navigate(`/partidas/${id}`);
    } finally { setStarting(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta partida?")) return;
    await api.removerPartida(id);
    setPartidas(prev => prev.filter(m => m.id !== id));
  };

  const live      = partidas.filter(m => m.status === "AO_VIVO");
  const scheduled = partidas.filter(m => m.status === "AGENDADA" || m.status === "AQUECIMENTO");
  const finished  = partidas.filter(m => m.status === "FINALIZADA");

  return (
    <div className="p-6 max-w-2xl">
      {showCreate && (
        <CreateMatchModal
          torneioId={torneioId}
          times={times}
          onCreated={m => { setPartidas(prev => [...prev, m]); setShowCreate(false); }}
          onClose={() => setShowCreate(false)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-black text-foreground">Partidas</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {torneio.nome} · {partidas.length} partida{partidas.length !== 1 ? "s" : ""}
            {live.length > 0 && ` · ${live.length} ao vivo`}
          </p>
        </div>
        {canManage && times.length >= 2 && (
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova partida
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : partidas.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <Swords className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h2 className="mt-4 font-display text-2xl font-bold text-foreground">Nenhuma partida ainda</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
            {times.length < 2
              ? "Cadastre pelo menos 2 times para criar partidas."
              : "Crie a primeira partida para começar a registrar pontos."}
          </p>
          {canManage && times.length >= 2 && (
            <Button className="mt-6 gap-2" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Criar primeira partida
            </Button>
          )}
          {!canManage && (
            <p className="mt-4 text-xs text-muted-foreground">Entre como administrador para gerenciar partidas.</p>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {live.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-green-600 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Ao vivo
              </h2>
              {live.map(m => (
                <MatchCard key={m.id} match={m} canManage={canManage}
                  onStart={() => handleStart(m.id)}
                  onDelete={() => handleDelete(m.id)}
                  onOpen={() => navigate(`/partidas/${m.id}`)}
                />
              ))}
            </section>
          )}

          {scheduled.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Agendadas</h2>
              {scheduled.map(m => (
                <MatchCard key={m.id} match={m} canManage={canManage}
                  onStart={() => handleStart(m.id)}
                  onDelete={() => handleDelete(m.id)}
                  onOpen={() => navigate(`/partidas/${m.id}`)}
                />
              ))}
              {starting && (
                <div className="text-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary inline-block" />
                </div>
              )}
            </section>
          )}

          {finished.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5" /> Finalizadas
              </h2>
              {finished.map(m => (
                <MatchCard key={m.id} match={m} canManage={canManage}
                  onStart={() => handleStart(m.id)}
                  onDelete={() => handleDelete(m.id)}
                  onOpen={() => navigate(`/partidas/${m.id}`)}
                />
              ))}
            </section>
          )}

          {canManage && times.length >= 2 && (
            <Button variant="outline" className="w-full gap-2 h-11" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Nova partida
            </Button>
          )}
        </div>
      )}
    </div>
  );
}