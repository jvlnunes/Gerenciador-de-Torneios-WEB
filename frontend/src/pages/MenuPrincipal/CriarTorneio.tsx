import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, CheckCircle2, Loader2, MapPin, Calendar,
  AlertCircle, Plus, Trash2, GripVertical, Info,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/services/utils";

import api from "@/services/api";

/* ─── Tipos ──────────────────────────────────────────────── */
type Status = "RASCUNHO" | "ABERTO" | "EM_ANDAMENTO" | "FINALIZADO";
type PhaseFormat = "MATA_MATA" | "PONTOS" | "HIBRIDO";
type TipoTorneio = "NORMAL" | "RACHA";
type ModoFormacaoTimes = "MANUAL" | "POOL_SORTEIO";
type CriterioSorteio = "ALEATORIO" | "NOTA";
type ModoGeracaoPartidas = "MANUAL" | "AUTOMATICO";

interface PhaseRules {
  setsParaVencer: number;
  pontosPorSet: number;
  pontosTieBreak: number;
  vantagemDoisPontos: boolean;
  limiteJogadoresPorTime: number;
}

interface Phase {
  id: string;
  name: string;
  format: PhaseFormat;
  regrasPersonalizadas: boolean;
  regras: PhaseRules;
}

interface BasicInfo {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: Status;
}

interface RachaConfig {
  jogadoresPorTime: number;
  modoFormacaoTimes: ModoFormacaoTimes;
  criterioSorteio: CriterioSorteio;
  modoGeracaoPartidas: ModoGeracaoPartidas;
  vitoriasSeguidasParaSair: number;
}

const REGRAS_PADRAO_FASE: PhaseRules = {
  setsParaVencer: 3,
  pontosPorSet: 25,
  pontosTieBreak: 15,
  vantagemDoisPontos: true,
  limiteJogadoresPorTime: 6,
};

const RACHA_PADRAO: RachaConfig = {
  jogadoresPorTime: 4,
  modoFormacaoTimes: "MANUAL",
  criterioSorteio: "ALEATORIO",
  modoGeracaoPartidas: "MANUAL",
  vitoriasSeguidasParaSair: 2,
};

// Mapeia o formato usado na UI para o enum aceito pelo backend em /torneios/:id/fases
const FORMATO_BACKEND: Record<PhaseFormat, "MATA_MATA" | "PONTOS_CORRIDOS"> = {
  MATA_MATA: "MATA_MATA",
  PONTOS: "PONTOS_CORRIDOS",
  HIBRIDO: "MATA_MATA", // sem equivalente direto no backend hoje
};

/* ─── Stepper ────────────────────────────────────────────── */
function Stepper({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-border" />
        <div
          className="absolute left-0 top-5 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${(current / (labels.length - 1)) * 100}%` }}
        />
        {labels.map((label, id) => {
          const done = current > id;
          const active = current === id;
          return (
            <div key={id} className="flex flex-col items-center gap-2 relative z-10">
              <div className={cn(
                "h-10 w-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all",
                done ? "bg-primary border-primary text-primary-foreground"
                  : active ? "bg-card border-primary text-primary shadow-md"
                    : "bg-card border-border text-muted-foreground"
              )}>
                {done ? <CheckCircle2 className="h-5 w-5" /> : id + 1}
              </div>
              <span className={cn(
                "text-xs font-medium hidden sm:block",
                active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Card de opção genérico (usado no tipo de torneio e configs do racha) ── */
function OpcaoCard<T extends string>({
  value,
  current,
  onSelect,
  icon,
  label,
  desc,
  disabled,
}: {
  value: T;
  current: T;
  onSelect: (v: T) => void;
  icon: string;
  label: string;
  desc: string;
  disabled?: boolean;
}) {
  const ativo = value === current;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(value)}
      className={cn(
        "flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        ativo ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40",
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-bold text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground leading-tight">{desc}</span>
    </button>
  );
}

/* ─── Step 0: Tipo de torneio ────────────────────────────── */
function StepTipoTorneio({
  value,
  onSelect,
}: {
  value: TipoTorneio | null;
  onSelect: (t: TipoTorneio) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onSelect("NORMAL")}
          className={cn(
            "text-left rounded-2xl border-2 p-6 transition-all",
            value === "NORMAL"
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border bg-card hover:border-primary/40"
          )}
        >
          <span className="text-3xl">🏆</span>
          <p className="font-display text-lg font-bold text-foreground mt-3">Torneio</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Fases configuráveis: mata-mata, pontos corridos ou híbrido. Ideal para campeonatos com chaveamento.
          </p>
          {value === "NORMAL" && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-3">
              <CheckCircle2 className="h-3.5 w-3.5" /> Selecionado
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelect("RACHA")}
          className={cn(
            "text-left rounded-2xl border-2 p-6 transition-all",
            value === "RACHA"
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border bg-card hover:border-primary/40"
          )}
        >
          <span className="text-3xl">🤝</span>
          <p className="font-display text-lg font-bold text-foreground mt-3">Racha</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Pool de jogadores, sorteio de times e fila "rei da quadra". Ideal para peladas recorrentes.
          </p>
          {value === "RACHA" && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-3">
              <CheckCircle2 className="h-3.5 w-3.5" /> Selecionado
            </span>
          )}
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Essa escolha define toda a estrutura do torneio e não pode ser alterada depois de criado.
        </p>
      </div>
    </div>
  );
}

/* ─── Step 1: Informações básicas ────────────────────────── */
function StepBasicInfo({
  data,
  setData,
  onNext,
  onBack,
}: {
  data: BasicInfo;
  setData: (d: Partial<BasicInfo>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [dateError, setDateError] = useState<string | null>(null);

  const handleStart = (v: string) => {
    setData({ startDate: v });
    if (data.endDate && v && new Date(v) > new Date(data.endDate))
      setDateError("Data de início não pode ser após o término.");
    else setDateError(null);
  };

  const handleEnd = (v: string) => {
    setData({ endDate: v });
    if (data.startDate && v && new Date(v) < new Date(data.startDate))
      setDateError("Data de término não pode ser antes do início.");
    else setDateError(null);
  };

  const canAdvance = data.name.trim().length > 0 && !dateError;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Nome do torneio *</Label>
        <Input
          value={data.name}
          onChange={(e) => setData({ name: e.target.value })}
          placeholder="Ex: Copa Verão 2026"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Descrição</Label>
        <Textarea
          value={data.description}
          onChange={(e) => setData({ description: e.target.value })}
          placeholder="Descreva o torneio, regulamento, premiação..."
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" /> Local
        </Label>
        <Input
          value={data.location}
          onChange={(e) => setData({ location: e.target.value })}
          placeholder="Ex: Ginásio Municipal"
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" /> Início
          </Label>
          <Input
            type="date"
            value={data.startDate}
            onChange={(e) => handleStart(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" /> Término
          </Label>
          <Input
            type="date"
            value={data.endDate}
            min={data.startDate || undefined}
            onChange={(e) => handleEnd(e.target.value)}
            className={cn("h-11", dateError && "border-destructive")}
          />
        </div>
      </div>

      {dateError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {dateError}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Status inicial</Label>
        <select
          value={data.status}
          onChange={(e) => setData({ status: e.target.value as Status })}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="RASCUNHO">🗒️ Rascunho</option>
          <option value="ABERTO">✅ Inscrições abertas</option>
          <option value="EM_ANDAMENTO">🏐 Em andamento</option>
        </select>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2 h-11">
          ← Voltar
        </Button>
        <Button onClick={onNext} disabled={!canAdvance} className="h-11 px-8 font-semibold gap-2">
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 2 (Normal): Fases ─────────────────────────────── */
const FORMAT_OPTIONS: { value: PhaseFormat; label: string; icon: string; desc: string }[] = [
  { value: "MATA_MATA", label: "Mata-Mata",       icon: "⚔️", desc: "Eliminação direta." },
  { value: "PONTOS",    label: "Pontos corridos", icon: "📊", desc: "Todos jogam entre si." },
  { value: "HIBRIDO",   label: "Híbrido",         icon: "🔀", desc: "Grupos + eliminatórias." },
];

function RegrasFaseEditor({
  regras,
  onChange,
}: {
  regras: PhaseRules;
  onChange: (r: Partial<PhaseRules>) => void;
}) {
  const NumStepper = ({
    label, value, min, max, onChange,
  }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) => (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-7 w-7 rounded-md border border-border bg-card text-xs font-bold hover:bg-muted transition-colors"
        >
          −
        </button>
        <div className="h-7 w-10 rounded-md border border-input bg-background flex items-center justify-center text-xs font-black tabular-nums">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-7 w-7 rounded-md border border-border bg-card text-xs font-bold hover:bg-muted transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
      <NumStepper label="Sets p/ vencer" value={regras.setsParaVencer} min={1} max={5}
        onChange={(v) => onChange({ setsParaVencer: v })} />
      <NumStepper label="Pts/set" value={regras.pontosPorSet} min={10} max={50}
        onChange={(v) => onChange({ pontosPorSet: v })} />
      <NumStepper label="Pts tie-break" value={regras.pontosTieBreak} min={10} max={50}
        onChange={(v) => onChange({ pontosTieBreak: v })} />
      <NumStepper label="Titulares" value={regras.limiteJogadoresPorTime} min={1} max={12}
        onChange={(v) => onChange({ limiteJogadoresPorTime: v })} />
      <label className="col-span-2 sm:col-span-4 flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
        <input
          type="checkbox"
          checked={regras.vantagemDoisPontos}
          onChange={(e) => onChange({ vantagemDoisPontos: e.target.checked })}
          className="rounded border-border"
        />
        Vencer por 2 pontos de diferença
      </label>
    </div>
  );
}

function StepFases({
  phases,
  setPhases,
  onNext,
  onBack,
}: {
  phases: Phase[];
  setPhases: (p: Phase[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const add = () => {
    setPhases([
      ...phases,
      {
        id: crypto.randomUUID(),
        name: `Fase ${phases.length + 1}`,
        format: "HIBRIDO",
        regrasPersonalizadas: false,
        regras: { ...REGRAS_PADRAO_FASE },
      },
    ]);
  };

  const remove = (id: string) => setPhases(phases.filter((p) => p.id !== id));

  const update = (id: string, data: Partial<Phase>) => {
    setPhases(phases.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Configure as fases em ordem. Cada uma pode ter um formato e regras de partida próprias —
          se não personalizar, a fase herda as regras padrão do torneio.
        </p>
      </div>

      <div className="space-y-4">
        {phases.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma fase adicionada.</p>
          </div>
        )}

        {phases.map((phase, i) => (
          <div key={phase.id} className="rounded-xl border-2 border-border bg-card overflow-hidden">
            {/* Cabeçalho da fase */}
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b border-border">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Fase {i + 1}
              </span>
              <input
                value={phase.name}
                onChange={(e) => update(phase.id, { name: e.target.value })}
                className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none"
                placeholder="Nome da fase..."
              />
              <button
                onClick={() => remove(phase.id)}
                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Formato */}
            <div className="p-4 grid grid-cols-3 gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update(phase.id, { format: opt.value })}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-all",
                    phase.format === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-lg">{opt.icon}</span>
                    {phase.format === opt.value && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Regras personalizadas da fase */}
            <div className="border-t border-border px-4 py-3 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-foreground">
                  Regras personalizadas para esta fase
                </span>
                <button
                  type="button"
                  onClick={() => update(phase.id, { regrasPersonalizadas: !phase.regrasPersonalizadas })}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors shrink-0",
                    phase.regrasPersonalizadas ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                    phase.regrasPersonalizadas ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </button>
              </label>
              {!phase.regrasPersonalizadas ? (
                <p className="text-[11px] text-muted-foreground italic">
                  Esta fase herda as regras padrão do torneio.
                </p>
              ) : (
                <RegrasFaseEditor
                  regras={phase.regras}
                  onChange={(r) => update(phase.id, { regras: { ...phase.regras, ...r } })}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-4 text-sm font-semibold text-primary hover:border-primary hover:bg-primary/5 transition-all"
      >
        <Plus className="h-4 w-4" /> Adicionar fase
      </button>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2 h-11">
          ← Voltar
        </Button>
        <Button
          onClick={onNext}
          disabled={phases.length === 0}
          className="gap-2 h-11 px-8 font-semibold"
        >
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 2 (Racha): Configuração do racha ──────────────── */
function StepConfigRacha({
  racha,
  setRacha,
  onNext,
  onBack,
}: {
  racha: RachaConfig;
  setRacha: (r: Partial<RachaConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <Info className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-700">
          Essas opções definem como os times serão formados e como as partidas serão geradas.
          Você pode ajustá-las depois na aba <strong>Racha</strong> do torneio.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">Formação dos times</Label>
        <div className="grid grid-cols-2 gap-2">
          <OpcaoCard<ModoFormacaoTimes>
            value="MANUAL"
            current={racha.modoFormacaoTimes}
            onSelect={(v) => setRacha({ modoFormacaoTimes: v })}
            icon="🧑‍🤝‍🧑"
            label="Manual"
            desc="Você cria e monta os times normalmente."
          />
          <OpcaoCard<ModoFormacaoTimes>
            value="POOL_SORTEIO"
            current={racha.modoFormacaoTimes}
            onSelect={(v) => setRacha({ modoFormacaoTimes: v })}
            icon="🎲"
            label="Pool + sorteio"
            desc="Jogadores entram numa pool e os times são sorteados."
          />
        </div>
      </div>

      {racha.modoFormacaoTimes === "POOL_SORTEIO" && (
        <div className="space-y-2 pl-1 border-l-2 border-primary/20 ml-1">
          <Label className="text-sm font-semibold text-foreground pl-3">Critério do sorteio</Label>
          <div className="grid grid-cols-2 gap-2 pl-3">
            <OpcaoCard<CriterioSorteio>
              value="ALEATORIO"
              current={racha.criterioSorteio}
              onSelect={(v) => setRacha({ criterioSorteio: v })}
              icon="🔀"
              label="Aleatório"
              desc="Distribuição totalmente aleatória entre os times."
            />
            <OpcaoCard<CriterioSorteio>
              value="NOTA"
              current={racha.criterioSorteio}
              onSelect={(v) => setRacha({ criterioSorteio: v })}
              icon="⭐"
              label="Por nota"
              desc="Equilibra a nota de habilidade de cada jogador."
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">Geração de partidas</Label>
        <div className="grid grid-cols-2 gap-2">
          <OpcaoCard<ModoGeracaoPartidas>
            value="MANUAL"
            current={racha.modoGeracaoPartidas}
            onSelect={(v) => setRacha({ modoGeracaoPartidas: v })}
            icon="🗒️"
            label="Manual"
            desc="Você cria cada confronto na aba Partidas."
          />
          <OpcaoCard<ModoGeracaoPartidas>
            value="AUTOMATICO"
            current={racha.modoGeracaoPartidas}
            onSelect={(v) => setRacha({ modoGeracaoPartidas: v })}
            icon="👑"
            label='Automático ("rei da quadra")'
            desc="O vencedor fica na quadra até perder ou bater o limite de vitórias seguidas."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-foreground">Jogadores por time</Label>
          <Input
            type="number"
            min={1}
            value={racha.jogadoresPorTime}
            onChange={(e) => setRacha({ jogadoresPorTime: Number(e.target.value) })}
            className="h-10"
          />
        </div>

        {racha.modoGeracaoPartidas === "AUTOMATICO" && (
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">Vitórias seguidas p/ sair</Label>
            <Input
              type="number"
              min={1}
              value={racha.vitoriasSeguidasParaSair}
              onChange={(e) => setRacha({ vitoriasSeguidasParaSair: Number(e.target.value) })}
              className="h-10"
            />
          </div>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2 h-11">
          ← Voltar
        </Button>
        <Button onClick={onNext} className="gap-2 h-11 px-8 font-semibold">
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 3 (Normal): Revisão ───────────────────────────── */
const FORMAT_LABELS: Record<string, string> = {
  MATA_MATA: "⚔️ Mata-Mata", PONTOS: "📊 Pontos corridos", HIBRIDO: "🔀 Híbrido",
};

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho", ABERTO: "Inscrições abertas",
  EM_ANDAMENTO: "Em andamento", FINALIZADO: "Finalizado",
};

function ResumoInfoBasica({ basicInfo }: { basicInfo: BasicInfo }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 bg-muted/50 border-b border-border">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Informações</h3>
      </div>
      <div className="p-5 space-y-2">
        {[
          { label: "Nome", value: basicInfo.name },
          { label: "Status", value: STATUS_LABELS[basicInfo.status] },
          { label: "Descrição", value: basicInfo.description },
          { label: "Local", value: basicInfo.location },
          {
            label: "Período",
            value: basicInfo.startDate || basicInfo.endDate
              ? `${basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleDateString("pt-BR") : "—"} → ${basicInfo.endDate ? new Date(basicInfo.endDate).toLocaleDateString("pt-BR") : "—"}`
              : "",
          },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4 py-2 border-b border-border last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-foreground text-right">
              {value || <span className="italic text-muted-foreground">Não informado</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepRevisao({
  basicInfo,
  phases,
  submitting,
  error,
  onBack,
  onSubmit,
}: {
  basicInfo: BasicInfo;
  phases: Phase[];
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <ResumoInfoBasica basicInfo={basicInfo} />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 bg-muted/50 border-b border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Fases ({phases.length})
          </h3>
        </div>
        <div className="p-5 space-y-3">
          {phases.map((p, i) => (
            <div key={p.id} className="py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                <span className="text-sm font-medium text-foreground flex-1">{p.name}</span>
                <span className="text-xs text-muted-foreground">{FORMAT_LABELS[p.format]}</span>
              </div>
              {p.regrasPersonalizadas && (
                <p className="text-[11px] text-primary font-medium pl-8 mt-1">
                  Regras personalizadas · {p.regras.setsParaVencer * 2 - 1} sets · {p.regras.pontosPorSet} pts
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={submitting} className="gap-2 h-11">
          ← Voltar
        </Button>
        <Button onClick={onSubmit} disabled={submitting} className="gap-2 h-11 px-8 font-semibold">
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Criando...</>
          ) : (
            <><CheckCircle2 className="h-4 w-4" /> Criar torneio</>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 3 (Racha): Revisão ─────────────────────────────── */
const MODO_FORMACAO_LABELS: Record<ModoFormacaoTimes, string> = {
  MANUAL: "Manual",
  POOL_SORTEIO: "Pool + sorteio",
};
const CRITERIO_SORTEIO_LABELS: Record<CriterioSorteio, string> = {
  ALEATORIO: "Aleatório",
  NOTA: "Por nota",
};
const MODO_GERACAO_LABELS: Record<ModoGeracaoPartidas, string> = {
  MANUAL: "Manual",
  AUTOMATICO: 'Automático ("rei da quadra")',
};

function StepRevisaoRacha({
  basicInfo,
  racha,
  submitting,
  error,
  onBack,
  onSubmit,
}: {
  basicInfo: BasicInfo;
  racha: RachaConfig;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <ResumoInfoBasica basicInfo={basicInfo} />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 bg-muted/50 border-b border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            🤝 Configuração do racha
          </h3>
        </div>
        <div className="p-5 space-y-2">
          {[
            { label: "Formação dos times", value: MODO_FORMACAO_LABELS[racha.modoFormacaoTimes] },
            ...(racha.modoFormacaoTimes === "POOL_SORTEIO"
              ? [{ label: "Critério do sorteio", value: CRITERIO_SORTEIO_LABELS[racha.criterioSorteio] }]
              : []),
            { label: "Geração de partidas", value: MODO_GERACAO_LABELS[racha.modoGeracaoPartidas] },
            { label: "Jogadores por time", value: String(racha.jogadoresPorTime) },
            ...(racha.modoGeracaoPartidas === "AUTOMATICO"
              ? [{ label: "Vitórias seguidas p/ sair", value: String(racha.vitoriasSeguidasParaSair) }]
              : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium text-foreground text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={submitting} className="gap-2 h-11">
          ← Voltar
        </Button>
        <Button onClick={onSubmit} disabled={submitting} className="gap-2 h-11 px-8 font-semibold">
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Criando...</>
          ) : (
            <><CheckCircle2 className="h-4 w-4" /> Criar torneio</>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────── */
export default function CriarTorneioPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tipoTorneio, setTipoTorneio] = useState<TipoTorneio | null>(null);

  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: "", description: "", location: "",
    startDate: "", endDate: "", status: "RASCUNHO",
  });

  const [phases, setPhases] = useState<Phase[]>([
    {
      id: crypto.randomUUID(),
      name: "Fase de grupos",
      format: "HIBRIDO",
      regrasPersonalizadas: false,
      regras: { ...REGRAS_PADRAO_FASE },
    },
  ]);

  const [racha, setRacha] = useState<RachaConfig>({ ...RACHA_PADRAO });

  const STEP_TITLES =
    tipoTorneio === "RACHA"
      ? ["Tipo de torneio", "Informações básicas", "Configuração do racha", "Revisão"]
      : ["Tipo de torneio", "Informações básicas", "Fases do torneio", "Revisão"];

  const STEP_DESCS =
    tipoTorneio === "RACHA"
      ? [
          "Escolha entre torneio normal ou racha.",
          "Defina as informações principais.",
          "Configure como os times e partidas do racha funcionam.",
          "Revise tudo antes de criar.",
        ]
      : [
          "Escolha entre torneio normal ou racha.",
          "Defina as informações principais.",
          "Configure as fases e formatos de disputa.",
          "Revise tudo antes de criar.",
        ];

  const handleSubmit = async () => {
    if (!tipoTorneio) return;
    setSubmitting(true);
    setError(null);
    try {
      const torneio = await api.torneios.criarTorneio({
        nome: basicInfo.name,
        descricao: basicInfo.description,
        local: basicInfo.location,
        dataInicio: basicInfo.startDate || undefined,
        dataFim: basicInfo.endDate || undefined,
        status: basicInfo.status as any,
        tipo: tipoTorneio,
      } as any);

      if (tipoTorneio === "RACHA") {
        try {
          const fases = await api.torneios.listarFases(torneio.id);
          const faseRacha = fases.find((f) => f.tipo === "RACHA");
          if (faseRacha) {
            await api.fases.atualizarConfiguracaoRacha(faseRacha.id, racha);
          }
        } catch (e) {
          console.error("Falha ao salvar configuração inicial do racha:", e);
        }
      } else {
        for (let i = 0; i < phases.length; i++) {
          const phase = phases[i];
          try {
            const fase = await api.fases.criarFase(torneio.id, {
              tipo: FORMATO_BACKEND[phase.format],
              nome: phase.name || undefined,
              ordem: i + 1,
            });

            if (phase.regrasPersonalizadas) {
              await api.fases.atualizarRegras(fase.id, phase.regras);
            }
          } catch (e) {
            console.error(`Falha ao criar fase "${phase.name}":`, e);
          }
        }
      }

      navigate(`/torneios/${torneio.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/torneios"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para torneios
        </Link>

        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            Criar novo torneio
          </h1>
          <p className="text-muted-foreground mt-2">
            Preencha as informações em cada etapa.
          </p>
        </div>

        <Stepper current={step} labels={STEP_TITLES} />

        <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-foreground">{STEP_TITLES[step]}</h2>
            <p className="text-sm text-muted-foreground mt-1">{STEP_DESCS[step]}</p>
          </div>

          {step === 0 && (
            <StepTipoTorneio
              value={tipoTorneio}
              onSelect={(t) => {
                setTipoTorneio(t);
                setStep(1);
              }}
            />
          )}

          {step === 1 && (
            <StepBasicInfo
              data={basicInfo}
              setData={(u) => setBasicInfo((p) => ({ ...p, ...u }))}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}

          {step === 2 && tipoTorneio === "NORMAL" && (
            <StepFases
              phases={phases}
              setPhases={setPhases}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}

          {step === 2 && tipoTorneio === "RACHA" && (
            <StepConfigRacha
              racha={racha}
              setRacha={(u) => setRacha((p) => ({ ...p, ...u }))}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && tipoTorneio === "RACHA" && (
            <StepRevisaoRacha
              basicInfo={basicInfo}
              racha={racha}
              submitting={submitting}
              error={error}
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
            />
          )}

          {step === 3 && tipoTorneio === "NORMAL" && (
            <StepRevisao
              basicInfo={basicInfo}
              phases={phases}
              submitting={submitting}
              error={error}
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}