import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, CheckCircle2, Loader2, MapPin, Calendar, AlertCircle, Plus, Trash2, GripVertical, Info, Lock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/services/utils";

import api from "@/services/api";

/* ─── Tipos ──────────────────────────────────────────────── */
type Status = "RASCUNHO" | "ABERTO" | "EM_ANDAMENTO" | "FINALIZADO";
type PhaseFormat = "RACHA" | "MATA_MATA" | "PONTOS" | "HIBRIDO";

interface Phase {
  id: string;
  name: string;
  format: PhaseFormat;
}

interface BasicInfo {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: Status;
}

/* ─── Stepper ────────────────────────────────────────────── */
const STEPS = [
  { id: 0, label: "Informações" },
  { id: 1, label: "Fases" },
  { id: 2, label: "Revisão" },
];

function Stepper({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-border" />
        <div
          className="absolute left-0 top-5 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((s) => {
          const done = current > s.id;
          const active = current === s.id;
          return (
            <div key={s.id} className="flex flex-col items-center gap-2 relative z-10">
              <div className={cn(
                "h-10 w-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all",
                done ? "bg-primary border-primary text-primary-foreground"
                  : active ? "bg-card border-primary text-primary shadow-md"
                    : "bg-card border-border text-muted-foreground"
              )}>
                {done ? <CheckCircle2 className="h-5 w-5" /> : s.id + 1}
              </div>
              <span className={cn(
                "text-xs font-medium hidden sm:block",
                active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
              )}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 0: Informações básicas ────────────────────────── */
function StepBasicInfo({
  data,
  setData,
  onNext,
}: {
  data: BasicInfo;
  setData: (d: Partial<BasicInfo>) => void;
  onNext: () => void;
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

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!canAdvance} className="h-11 px-8 font-semibold gap-2">
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 1: Fases ──────────────────────────────────────── */
const FORMAT_OPTIONS: { value: PhaseFormat; label: string; icon: string; desc: string }[] = [
  { value: "RACHA",     label: "Racha",          icon: "🤝", desc: "Fase única. Sorteio/times e partidas configurados depois." },
  { value: "MATA_MATA", label: "Mata-Mata",       icon: "⚔️", desc: "Eliminação direta." },
  { value: "PONTOS",    label: "Pontos corridos", icon: "📊", desc: "Todos jogam entre si." },
  { value: "HIBRIDO",   label: "Híbrido",         icon: "🔀", desc: "Grupos + eliminatórias." },
];

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
  const temRacha = phases.some((p) => p.format === "RACHA");

  const add = () => {
    if (temRacha) return; // RACHA é sempre fase única do torneio
    setPhases([
      ...phases,
      { id: crypto.randomUUID(), name: `Fase ${phases.length + 1}`, format: "HIBRIDO" },
    ]);
  };

  const remove = (id: string) => setPhases(phases.filter((p) => p.id !== id));

  const update = (id: string, data: Partial<Phase>) => {
    // Escolher RACHA em qualquer fase remove as demais — não faz sentido
    // misturar racha com outros formatos no mesmo torneio.
    if (data.format === "RACHA") {
      const fase = phases.find((p) => p.id === id);
      if (fase) {
        setPhases([{ ...fase, ...data }]);
        return;
      }
    }
    setPhases(phases.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Configure as fases em ordem. Cada uma pode ter um formato diferente.
        </p>
      </div>

      {temRacha && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <Lock className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-700">
            <strong>Racha</strong> é sempre fase única. Depois de criar o torneio, configure
            times/sorteio e geração de partidas na aba <strong>Racha</strong> do torneio.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {phases.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma fase adicionada.</p>
          </div>
        )}

        {phases.map((phase, i) => (
          <div key={phase.id} className="rounded-xl border-2 border-border bg-card overflow-hidden">
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
              {!temRacha && (
                <button
                  onClick={() => remove(phase.id)}
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
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
          </div>
        ))}
      </div>

      {!temRacha && (
        <button
          onClick={add}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-4 text-sm font-semibold text-primary hover:border-primary hover:bg-primary/5 transition-all"
        >
          <Plus className="h-4 w-4" /> Adicionar fase
        </button>
      )}

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

/* ─── Step 2: Revisão ────────────────────────────────────── */
const FORMAT_LABELS: Record<string, string> = {
  RACHA: "🤝 Racha", MATA_MATA: "⚔️ Mata-Mata",
  PONTOS: "📊 Pontos corridos", HIBRIDO: "🔀 Híbrido",
};

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho", ABERTO: "Inscrições abertas",
  EM_ANDAMENTO: "Em andamento", FINALIZADO: "Finalizado",
};

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

      {/* Info básica */}
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

      {/* Fases */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 bg-muted/50 border-b border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Fases ({phases.length})
          </h3>
        </div>
        <div className="p-5 space-y-2">
          {phases.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
              <span className="text-sm font-medium text-foreground flex-1">{p.name}</span>
              <span className="text-xs text-muted-foreground">{FORMAT_LABELS[p.format]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={submitting} className="gap-2 h-11">
          ← Voltar
        </Button>
        <Button
          onClick={onSubmit}
          disabled={submitting}
          className="gap-2 h-11 px-8 font-semibold"
        >
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

  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: "", description: "", location: "",
    startDate: "", endDate: "", status: "RASCUNHO",
  });

  const [phases, setPhases] = useState<Phase[]>([
    { id: crypto.randomUUID(), name: "Fase de grupos", format: "HIBRIDO" },
  ]);

  const handleSubmit = async () => {
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
      });

      const faseRacha = phases.length === 1 && phases[0].format === "RACHA"
        ? phases[0]
        : null;

      if (faseRacha) {
        try {
          await api.fases.criarFase(torneio.id, {
            tipo: "RACHA",
            nome: faseRacha.name || "Racha",
            ordem: 1,
          });
        } catch (e) {
          console.error("Falha ao criar fase RACHA:", e);
        }
      }

      navigate(`/torneios/${torneio.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  const STEP_TITLES = ["Informações básicas", "Fases do torneio", "Revisão"];
  const STEP_DESCS = [
    "Defina as informações principais.",
    "Configure as fases e formatos de disputa.",
    "Revise tudo antes de criar.",
  ];

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

        <Stepper current={step} />

        <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-foreground">{STEP_TITLES[step]}</h2>
            <p className="text-sm text-muted-foreground mt-1">{STEP_DESCS[step]}</p>
          </div>

          {step === 0 && (
            <StepBasicInfo
              data={basicInfo}
              setData={(u) => setBasicInfo((p) => ({ ...p, ...u }))}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <StepFases
              phases={phases}
              setPhases={setPhases}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <StepRevisao
              basicInfo={basicInfo}
              phases={phases}
              submitting={submitting}
              error={error}
              onBack={() => setStep(1)}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}