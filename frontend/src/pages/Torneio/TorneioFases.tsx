import type { Torneio, Time, Partida } from "@/services/api/interfaces";
import { useEffect, useState, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";
import { cn } from "@/services/utils";
import {
  Plus, Loader2, Swords, Trophy, Play, Clock, MapPin, Trash2, X,
  Calendar, CheckCircle2, Users, ChevronRight, ChevronDown, Layers,
  BarChart3, GitBranch, Award, ArrowRight, RefreshCw,
} from "lucide-react";

interface TorneioCtx {
  torneio: Torneio;
  torneioId: string;
  liveCount: number;
  canManage: boolean;
}

// ── Tipos de fase ────────────────────────────────────────────────
type FormatoFase = "GRUPOS" | "MATA_MATA";

interface Fase {
  id: string;
  nome: string;
  formato: FormatoFase;
  ordem: number;
  status: "pendente" | "em_andamento" | "concluida";
  descricao: string;
}

interface GrupoConfig {
  nome: string;
  timeIds: string[];
}

// ── Persistência local de fases (sem backend dedicado) ───────────
const FASE_KEY = (torneioId: string) => `fases_torneio_${torneioId}`;

function loadFases(torneioId: string): Fase[] {
  try {
    return JSON.parse(localStorage.getItem(FASE_KEY(torneioId)) ?? "[]");
  } catch {
    return [];
  }
}

function saveFases(torneioId: string, fases: Fase[]) {
  localStorage.setItem(FASE_KEY(torneioId), JSON.stringify(fases));
}

const GRUPOS_KEY = (torneioId: string, faseId: string) =>
  `grupos_fase_${torneioId}_${faseId}`;

function loadGrupos(torneioId: string, faseId: string): GrupoConfig[] {
  try {
    return JSON.parse(localStorage.getItem(GRUPOS_KEY(torneioId, faseId)) ?? "[]");
  } catch {
    return [];
  }
}

function saveGrupos(torneioId: string, faseId: string, grupos: GrupoConfig[]) {
  localStorage.setItem(GRUPOS_KEY(torneioId, faseId), JSON.stringify(grupos));
}

// ── Modal criar fase ─────────────────────────────────────────────
function ModalCriarFase({
  ordem,
  onSave,
  onClose,
}: {
  ordem: number;
  onSave: (fase: Fase) => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(`Fase ${ordem}`);
  const [formato, setFormato] = useState<FormatoFase>("GRUPOS");
  const [descricao, setDescricao] = useState("");

  const formatos: { value: FormatoFase; label: string; icon: string; desc: string }[] = [
    {
      value: "GRUPOS",
      label: "Fase de grupos",
      icon: "📊",
      desc: "Times jogam entre si dentro de cada grupo. Os melhores avançam.",
    },
    {
      value: "MATA_MATA",
      label: "Mata-mata",
      icon: "⚔️",
      desc: "Eliminação direta. Quem perde, sai. Ideal para semifinal e final.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Nova fase</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Nome da fase</label>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Formato</label>
          <div className="grid grid-cols-1 gap-2">
            {formatos.map((f) => (
              <button
                key={f.value}
                onClick={() => setFormato(f.value)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
                  formato === f.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="text-2xl shrink-0">{f.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
                {formato === f.value && (
                  <div className="ml-auto h-4 w-4 rounded-full bg-primary shrink-0 mt-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Descrição (opcional)</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            placeholder="Regras específicas desta fase..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">Cancelar</Button>
          <Button
            onClick={() => {
              if (!nome.trim()) return;
              onSave({
                id: crypto.randomUUID(),
                nome: nome.trim(),
                formato,
                ordem,
                status: "pendente",
                descricao,
              });
            }}
            className="flex-1 h-11 gap-2 font-semibold"
          >
            <Plus className="h-4 w-4" /> Criar fase
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Modal criar partida ──────────────────────────────────────────
function ModalCriarPartida({
  torneioId,
  times,
  faseNome,
  grupoNome,
  timesPermitidos,
  onCreated,
  onClose,
}: {
  torneioId: string;
  times: Time[];
  faseNome: string;
  grupoNome?: string;
  timesPermitidos?: string[];
  onCreated: (m: Partida) => void;
  onClose: () => void;
}) {
  const [timeCasaId, setTimeCasaId] = useState("");
  const [timeVisitanteId, setTimeVisitanteId] = useState("");
  const [agendadoPara, setAgendadoPara] = useState("");
  const [local, setLocal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timesDisponiveis = timesPermitidos
    ? times.filter((t) => timesPermitidos.includes(t.id))
    : times;

  const submit = async () => {
    if (!timeCasaId || !timeVisitanteId) { setError("Selecione os dois times"); return; }
    if (timeCasaId === timeVisitanteId) { setError("Times precisam ser diferentes"); return; }

    setSaving(true);
    setError(null);

    try {
      const m = await api.partidas.criar(torneioId, {
        torneioId,
        timeCasaId,
        timeVisitanteId,
        agendadoPara: agendadoPara || undefined,
        local: local || undefined,
      });

      onCreated(m);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Nova partida</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {faseNome}{grupoNome ? ` · ${grupoNome}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2 rounded-lg">{error}</p>}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Time da casa *</label>
            <select value={timeCasaId} onChange={(e) => setTimeCasaId(e.target.value)} className={sel}>
              <option value="">— Selecionar —</option>
              {timesDisponiveis.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-bold text-muted-foreground">VS</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Time visitante *</label>
            <select value={timeVisitanteId} onChange={(e) => setTimeVisitanteId(e.target.value)} className={sel}>
              <option value="">— Selecionar —</option>
              {timesDisponiveis.filter((t) => t.id !== timeCasaId).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Data/hora
            </label>
            <input type="datetime-local" value={agendadoPara} onChange={(e) => setAgendadoPara(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Local
            </label>
            <input type="text" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Quadra A" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="flex-1 h-11 gap-2 font-semibold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Partida mini-card ────────────────────────────────────────────
function PartidaMini({
  partida,
  canManage,
  onStart,
  onOpen,
  onDelete,
}: {
  partida: Partida;
  canManage: boolean;
  onStart: () => void;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const isLive = partida.status === "AO_VIVO";
  const isFinished = partida.status === "FINALIZADA";

  return (
    <div className={cn(
      "rounded-xl border bg-card p-3 flex items-center gap-3 transition-all",
      isLive ? "border-green-300 shadow-green-100/50 shadow-sm" : "border-border hover:border-primary/30"
    )}>
      {isLive && <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />}
      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <p className="text-xs font-semibold text-foreground truncate text-right">{partida.nomeTimeCasa}</p>
        {isFinished ? (
          <span className="font-display text-sm font-black text-foreground px-2 whitespace-nowrap">
            {partida.setsCasa} × {partida.setsVisitante}
          </span>
        ) : isLive ? (
          <span className="font-display text-sm font-black text-foreground px-2 whitespace-nowrap">
            {partida.setAtualCasa} - {partida.setAtualVisitante}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground font-bold px-2">vs</span>
        )}
        <p className="text-xs font-semibold text-foreground truncate">{partida.nomeTimeVisitante}</p>
      </div>
      {canManage && (
        <div className="flex items-center gap-1 shrink-0">
          {partida.status === "AGENDADA" && (
            <button onClick={onStart} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Iniciar">
              <Play className="h-3 w-3" />
            </button>
          )}
          {(isLive || isFinished) && (
            <button onClick={onOpen} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 transition-colors" title="Ver">
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Excluir">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Bloco de fase de grupos ──────────────────────────────────────
function FaseGrupos({
  fase,
  torneioId,
  times,
  partidas,
  canManage,
  onPartidaCreated,
  onPartidaDeleted,
  onPartidaStart,
  onPartidaOpen,
  onFaseProgress,
}: {
  fase: Fase;
  torneioId: string;
  times: Time[];
  partidas: Partida[];
  canManage: boolean;
  onPartidaCreated: (m: Partida) => void;
  onPartidaDeleted: (id: string) => void;
  onPartidaStart: (id: string) => void;
  onPartidaOpen: (id: string) => void;
  onFaseProgress: () => void;
}) {
  const [grupos, setGrupos] = useState<GrupoConfig[]>(() => loadGrupos(torneioId, fase.id));
  const [novoGrupoNome, setNovoGrupoNome] = useState("");
  const [addingGrupo, setAddingGrupo] = useState(false);
  const [modalPartida, setModalPartida] = useState<{ grupoNome: string; timeIds: string[] } | null>(null);
  const [expandedGrupo, setExpandedGrupo] = useState<string | null>(grupos[0]?.nome ?? null);

  const updateGrupos = (g: GrupoConfig[]) => {
    setGrupos(g);
    saveGrupos(torneioId, fase.id, g);
  };

  const addGrupo = () => {
    if (!novoGrupoNome.trim()) return;
    const updated = [...grupos, { nome: novoGrupoNome.trim(), timeIds: [] }];
    updateGrupos(updated);
    setNovoGrupoNome("");
    setAddingGrupo(false);
    setExpandedGrupo(novoGrupoNome.trim());
  };

  const addTimeToGrupo = (grupoNome: string, timeId: string) => {
    updateGrupos(grupos.map((g) => g.nome === grupoNome ? { ...g, timeIds: [...g.timeIds, timeId] } : g));
  };

  const removeTimeFromGrupo = (grupoNome: string, timeId: string) => {
    updateGrupos(grupos.map((g) => g.nome === grupoNome ? { ...g, timeIds: g.timeIds.filter((id) => id !== timeId) } : g));
  };

  const allTimeIds = grupos.flatMap((g) => g.timeIds);
  const timesDisponiveis = times.filter((t) => !allTimeIds.includes(t.id));

  return (
    <div className="space-y-3">
      {grupos.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border py-8 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">Nenhum grupo criado.</p>
          {canManage && <p className="text-xs text-muted-foreground">Adicione grupos e distribua os times.</p>}
        </div>
      )}

      {grupos.map((grupo) => {
        const grupoTimes = times.filter((t) => grupo.timeIds.includes(t.id));
        const grupoPartidas = partidas.filter(
          (p) => grupo.timeIds.includes(p.timeCasaId) && grupo.timeIds.includes(p.timeVisitanteId)
        );
        const isExpanded = expandedGrupo === grupo.nome;

        return (
          <div key={grupo.nome} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header do grupo */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedGrupo(isExpanded ? null : grupo.nome)}
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                <span className="text-xs font-black text-primary">{grupo.nome.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{grupo.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {grupoTimes.length} time{grupoTimes.length !== 1 ? "s" : ""} · {grupoPartidas.length} partida{grupoPartidas.length !== 1 ? "s" : ""}
                </p>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
            </div>

            {isExpanded && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Times do grupo */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Times</p>
                  <div className="flex flex-wrap gap-2">
                    {grupoTimes.map((t) => (
                      <div key={t.id} className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-lg px-2.5 py-1.5">
                        <span className="text-xs font-semibold text-foreground">{t.nome}</span>
                        {canManage && (
                          <button
                            onClick={() => removeTimeFromGrupo(grupo.nome, t.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {canManage && timesDisponiveis.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => e.target.value && addTimeToGrupo(grupo.nome, e.target.value)}
                        className="h-8 rounded-lg border border-dashed border-primary/40 bg-transparent px-2 text-xs text-primary font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">+ Adicionar time</option>
                        {timesDisponiveis.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {/* Partidas do grupo */}
                {grupoPartidas.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Partidas</p>
                    <div className="space-y-2">
                      {grupoPartidas.map((p) => (
                        <PartidaMini
                          key={p.id}
                          partida={p}
                          canManage={canManage}
                          onStart={() => onPartidaStart(p.id)}
                          onOpen={() => onPartidaOpen(p.id)}
                          onDelete={() => onPartidaDeleted(p.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {canManage && grupoTimes.length >= 2 && (
                  <button
                    onClick={() => setModalPartida({ grupoNome: grupo.nome, timeIds: grupo.timeIds })}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 py-2.5 text-xs font-semibold text-primary hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Nova partida neste grupo
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {canManage && (
        addingGrupo ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={novoGrupoNome}
              onChange={(e) => setNovoGrupoNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGrupo()}
              placeholder="Nome do grupo (ex: Grupo A)"
              className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button size="sm" onClick={addGrupo} className="h-9">Criar</Button>
            <Button size="sm" variant="ghost" onClick={() => setAddingGrupo(false)} className="h-9">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setAddingGrupo(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <Plus className="h-4 w-4" /> Adicionar grupo
          </button>
        )
      )}

      {modalPartida && (
        <ModalCriarPartida
          torneioId={torneioId}
          times={times}
          faseNome={fase.nome}
          grupoNome={modalPartida.grupoNome}
          timesPermitidos={modalPartida.timeIds}
          onCreated={(m) => { onPartidaCreated(m); setModalPartida(null); }}
          onClose={() => setModalPartida(null)}
        />
      )}
    </div>
  );
}

// ── Bloco de fase mata-mata ──────────────────────────────────────
function FaseMataMata({
  fase,
  torneioId,
  times,
  partidas,
  canManage,
  onPartidaCreated,
  onPartidaDeleted,
  onPartidaStart,
  onPartidaOpen,
}: {
  fase: Fase;
  torneioId: string;
  times: Time[];
  partidas: Partida[];
  canManage: boolean;
  onPartidaCreated: (m: Partida) => void;
  onPartidaDeleted: (id: string) => void;
  onPartidaStart: (id: string) => void;
  onPartidaOpen: (id: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);

  // Agrupa em rodadas pelo índice de criação (4 por rodada = quartas, 2 = semi, 1 = final)
  const rodadas: Partida[][] = [];
  const sizes = [8, 4, 2, 1];
  let remaining = [...partidas];
  for (const size of sizes) {
    if (remaining.length === 0) break;
    const rodada = remaining.splice(0, size);
    rodadas.push(rodada);
  }
  if (remaining.length > 0) rodadas.push(remaining);

  const rodadaLabels = ["Oitavas", "Quartas de final", "Semifinal", "Final", "Extra"];

  return (
    <div className="space-y-4">
      {rodadas.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border py-8 text-center">
          <GitBranch className="mx-auto h-8 w-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">Chaveamento não gerado.</p>
          {canManage && <p className="text-xs text-muted-foreground">Adicione as partidas desta fase.</p>}
        </div>
      )}

      {rodadas.map((rodada, ri) => (
        <div key={ri} className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {rodadaLabels[ri] ?? `Rodada ${ri + 1}`}
            </p>
            <div className="flex-1 h-px bg-border" />
          </div>
          {rodada.map((p) => (
            <PartidaMini
              key={p.id}
              partida={p}
              canManage={canManage}
              onStart={() => onPartidaStart(p.id)}
              onOpen={() => onPartidaOpen(p.id)}
              onDelete={() => onPartidaDeleted(p.id)}
            />
          ))}
        </div>
      ))}

      {canManage && (
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 py-3 text-sm font-semibold text-primary hover:border-primary hover:bg-primary/5 transition-all"
        >
          <Plus className="h-4 w-4" /> Adicionar confronto
        </button>
      )}

      {showModal && (
        <ModalCriarPartida
          torneioId={torneioId}
          times={times}
          faseNome={fase.nome}
          onCreated={(m) => { onPartidaCreated(m); setShowModal(false); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
export default function TorneioFases() {
  const { torneio, torneioId, canManage } = useOutletContext<TorneioCtx>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [times, setTimes] = useState<Time[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [fases, setFases] = useState<Fase[]>(() => loadFases(torneioId));
  const [showCriarFase, setShowCriarFase] = useState(false);
  const [expandedFase, setExpandedFase] = useState<string | null>(fases[0]?.id ?? null);
  const [starting, setStarting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [ts, ps] = await Promise.all([
      api.times.listarPorTorneio(torneioId),
      api.partidas.listarPorTorneio(torneioId),
    ]);
    setTimes(ts);
    setPartidas(ps);
    setLoading(false);
  }, [torneioId]);

  useEffect(() => { load(); }, [load]);

  const updateFases = (f: Fase[]) => {
    setFases(f);
    saveFases(torneioId, f);
  };

  const handleCriarFase = (fase: Fase) => {
    const updated = [...fases, fase];
    updateFases(updated);
    setShowCriarFase(false);
    setExpandedFase(fase.id);
  };

  const deleteFase = (id: string) => {
    if (!confirm("Excluir esta fase e seus dados locais?")) return;
    updateFases(fases.filter((f) => f.id !== id));
  };

  const handleStart = async (partidaId: string) => {
    setStarting(partidaId);
    try {
      const updated = await api.partidas.comecaPartida(partidaId);
      setPartidas((prev) => prev.map((m) => m.id === partidaId ? updated : m));
      navigate(`/partidas/${partidaId}`);
    } finally { setStarting(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta partida?")) return;
    await api.partidas.removerPartida(id);
    setPartidas((prev) => prev.filter((m) => m.id !== id));
  };

  const liveCount = partidas.filter((p) => p.status === "AO_VIVO").length;

  if (loading)
    return (
      <div className="p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="p-6 max-w-3xl">
      {showCriarFase && (
        <ModalCriarFase
          ordem={fases.length + 1}
          onSave={handleCriarFase}
          onClose={() => setShowCriarFase(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-black text-foreground">Fases</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {torneio.nome} · {fases.length} fase{fases.length !== 1 ? "s" : ""}
            {liveCount > 0 && ` · ${liveCount} ao vivo`}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCriarFase(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova fase
          </Button>
        )}
      </div>

      {/* Pipeline visual */}
      {fases.length > 1 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {fases.map((fase, i) => (
            <div key={fase.id} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setExpandedFase(fase.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all border",
                  expandedFase === fase.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                <span>{fase.formato === "GRUPOS" ? "📊" : "⚔️"}</span>
                {fase.nome}
              </button>
              {i < fases.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {fases.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h2 className="mt-4 font-display text-2xl font-bold text-foreground">Nenhuma fase configurada</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
            Configure as fases do seu torneio: fase de grupos, semifinal, final.
          </p>
          {canManage && (
            <Button className="mt-6 gap-2" onClick={() => setShowCriarFase(true)}>
              <Plus className="h-4 w-4" /> Criar primeira fase
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {fases.map((fase) => {
            const isExpanded = expandedFase === fase.id;

            return (
              <div
                key={fase.id}
                className={cn(
                  "rounded-2xl border-2 bg-card shadow-sm overflow-hidden transition-all",
                  isExpanded ? "border-primary/50" : "border-border"
                )}
              >
                {/* Header da fase */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedFase(isExpanded ? null : fase.id)}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl grid place-items-center text-xl shrink-0",
                    fase.formato === "GRUPOS" ? "bg-blue-50 dark:bg-blue-900/20" : "bg-orange-50 dark:bg-orange-900/20"
                  )}>
                    {fase.formato === "GRUPOS" ? "📊" : "⚔️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-foreground">{fase.nome}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {fase.formato === "GRUPOS" ? "Grupos" : "Mata-mata"}
                      </Badge>
                    </div>
                    {fase.descricao && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{fase.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteFase(fase.id); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border p-5">
                    {fase.formato === "GRUPOS" ? (
                      <FaseGrupos
                        fase={fase}
                        torneioId={torneioId}
                        times={times}
                        partidas={partidas}
                        canManage={canManage}
                        onPartidaCreated={(m) => setPartidas((prev) => [...prev, m])}
                        onPartidaDeleted={handleDelete}
                        onPartidaStart={handleStart}
                        onPartidaOpen={(id) => navigate(`/partidas/${id}`)}
                        onFaseProgress={() => { }}
                      />
                    ) : (
                      <FaseMataMata
                        fase={fase}
                        torneioId={torneioId}
                        times={times}
                        partidas={partidas}
                        canManage={canManage}
                        onPartidaCreated={(m) => setPartidas((prev) => [...prev, m])}
                        onPartidaDeleted={handleDelete}
                        onPartidaStart={handleStart}
                        onPartidaOpen={(id) => navigate(`/partidas/${id}`)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Botão adicionar mais fase */}
          {canManage && (
            <button
              onClick={() => setShowCriarFase(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-4 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Plus className="h-4 w-4" /> Adicionar próxima fase
            </button>
          )}
        </div>
      )}
    </div>
  );
}