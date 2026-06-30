import { useEffect, useState, useCallback } from "react";
import { api, type RegrasTorneio } from "@/services/api";
import { cn } from "@/services/utils";
import {
  Loader2, Check, AlertCircle, Trophy, Zap,
  Users, RotateCcw, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Presets de regra ───────────────────────────────────── */
interface Preset {
  label: string;
  icon: string;
  desc: string;
  values: Omit<RegrasTorneio, "id" | "torneioId">;
}

const PRESETS: Preset[] = [
  {
    label: "Vôlei Padrão",
    icon: "🏐",
    desc: "6x6 · Melhor de 5 · 25/15 pts",
    values: {
      setsParaVencer: 3,
      pontosPorSet: 25,
      pontosTieBreak: 15,
      vantagemDoisPontos: true,
      limiteJogadoresPorTime: 6,
    },
  },
  {
    label: "Beach Vôlei",
    icon: "🏖️",
    desc: "2x2 · Melhor de 3 · 21/15 pts",
    values: {
      setsParaVencer: 2,
      pontosPorSet: 21,
      pontosTieBreak: 15,
      vantagemDoisPontos: true,
      limiteJogadoresPorTime: 2,
    },
  },
  {
    label: "Reduzido",
    icon: "⚡",
    desc: "4x4 · Melhor de 3 · 25/15 pts",
    values: {
      setsParaVencer: 2,
      pontosPorSet: 25,
      pontosTieBreak: 15,
      vantagemDoisPontos: true,
      limiteJogadoresPorTime: 4,
    },
  },
  {
    label: "Personalizado",
    icon: "🎛️",
    desc: "Ajuste cada campo manualmente",
    values: {
      setsParaVencer: 3,
      pontosPorSet: 25,
      pontosTieBreak: 15,
      vantagemDoisPontos: true,
      limiteJogadoresPorTime: 6,
    },
  },
];

/* ─── Stepper numérico ───────────────────────────────────── */
function NumberStepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const dec = () => !disabled && onChange(Math.max(min, value - 1));
  const inc = () => !disabled && onChange(Math.min(max, value + 1));

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {hint && <p className="text-xs text-muted-foreground leading-snug">{hint}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={dec}
          disabled={disabled || value <= min}
          className="h-9 w-9 rounded-lg border border-border bg-card text-foreground font-bold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          −
        </button>
        <div className="h-9 w-16 rounded-lg border border-input bg-background flex items-center justify-center font-display font-black text-lg text-foreground tabular-nums">
          {value}
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={disabled || value >= max}
          className="h-9 w-9 rounded-lg border border-border bg-card text-foreground font-bold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ─── Toggle booleano ────────────────────────────────────── */
function BooleanToggle({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          value ? "bg-primary" : "bg-muted",
          disabled && "opacity-40 cursor-not-allowed"
        )}
        role="switch"
        aria-checked={value}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            value ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

/* ─── Resumo das regras ──────────────────────────────────── */
function ResumoRegras({ r }: { r: Omit<RegrasTorneio, "id" | "torneioId"> }) {
  const totalSets = r.setsParaVencer * 2 - 1;
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1.5 text-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
        Resumo
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <p className="text-muted-foreground flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            Melhor de <strong className="text-foreground">{totalSets} sets</strong>{" "}
            (primeiro a vencer <strong className="text-foreground">{r.setsParaVencer}</strong>)
          </span>
        </p>
        <p className="text-muted-foreground flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            Sets regulares: <strong className="text-foreground">{r.pontosPorSet} pts</strong>
          </span>
        </p>
        <p className="text-muted-foreground flex items-center gap-2">
          <RotateCcw className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            {r.setsParaVencer > 1 ? `${totalSets}º set` : "Set decisivo"}:{" "}
            <strong className="text-foreground">{r.pontosTieBreak} pts</strong>
          </span>
        </p>
        <p className="text-muted-foreground flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            <strong className="text-foreground">{r.limiteJogadoresPorTime}</strong> titulares por equipe
          </span>
        </p>
        <p className="text-muted-foreground flex items-center gap-2 sm:col-span-2">
          <Info className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            Vencer por 2 pontos de diferença:{" "}
            <strong className="text-foreground">{r.vantagemDoisPontos ? "Sim" : "Não"}</strong>
          </span>
        </p>
      </div>
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────── */
interface Props {
  torneioId: string;
  canManage: boolean;
}

export function RegrasTorneioForm({ torneioId, canManage }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [dirty, setDirty]     = useState(false);

  const [form, setForm] = useState<Omit<RegrasTorneio, "id" | "torneioId">>({
    setsParaVencer: 3,
    pontosPorSet: 25,
    pontosTieBreak: 15,
    vantagemDoisPontos: true,
    limiteJogadoresPorTime: 6,
  });

  // Salva o estado original para detectar mudanças
  const [original, setOriginal] = useState({ ...form });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const regras = await api.buscarRegras(torneioId);
      const values = {
        setsParaVencer:         regras.setsParaVencer,
        pontosPorSet:           regras.pontosPorSet,
        pontosTieBreak:         regras.pontosTieBreak,
        vantagemDoisPontos:     regras.vantagemDoisPontos,
        limiteJogadoresPorTime: regras.limiteJogadoresPorTime,
      };
      setForm(values);
      setOriginal(values);
    } catch (e) {
      setError("Não foi possível carregar as regras.");
    } finally {
      setLoading(false);
    }
  }, [torneioId]);

  useEffect(() => { load(); }, [load]);

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSuccess(false);
  };

  const applyPreset = (preset: Preset) => {
    setForm(preset.values);
    setDirty(true);
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.atualizarRegras(torneioId, form);
      setOriginal({ ...form });
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ ...original });
    setDirty(false);
    setError(null);
  };

  // Detecta qual preset está ativo (comparação de valores)
  const activePreset = PRESETS.find(
    (p) =>
      p.values.setsParaVencer         === form.setsParaVencer &&
      p.values.pontosPorSet           === form.pontosPorSet &&
      p.values.pontosTieBreak         === form.pontosTieBreak &&
      p.values.limiteJogadoresPorTime === form.limiteJogadoresPorTime
  );

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Erro de carregamento/salvamento */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Presets */}
      <div>
        <p className="text-sm font-bold text-foreground mb-3">Preset de regras</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((preset) => {
            const isActive = activePreset?.label === preset.label;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => canManage && applyPreset(preset)}
                disabled={!canManage}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/40",
                  !canManage && "cursor-default"
                )}
              >
                <span className="text-xl">{preset.icon}</span>
                <span className="text-sm font-bold text-foreground leading-tight">{preset.label}</span>
                <span className="text-[11px] text-muted-foreground leading-tight">{preset.desc}</span>
                {isActive && (
                  <span className="text-[10px] font-bold text-primary">● Ativo</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Configuração detalhada
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Campos numéricos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <NumberStepper
          label="Sets para vencer a partida"
          hint={`Melhor de ${form.setsParaVencer * 2 - 1} sets`}
          value={form.setsParaVencer}
          min={1}
          max={5}
          onChange={(v) => update("setsParaVencer", v)}
          disabled={!canManage}
        />

        <NumberStepper
          label="Titulares por equipe"
          hint="Jogadores em quadra ao mesmo tempo"
          value={form.limiteJogadoresPorTime}
          min={1}
          max={12}
          onChange={(v) => update("limiteJogadoresPorTime", v)}
          disabled={!canManage}
        />

        <NumberStepper
          label="Pontos por set regular"
          hint="Exceto o set decisivo"
          value={form.pontosPorSet}
          min={10}
          max={50}
          onChange={(v) => update("pontosPorSet", v)}
          disabled={!canManage}
        />

        <NumberStepper
          label={`Pontos no set decisivo (${form.setsParaVencer * 2 - 1}º set)`}
          hint="Tie-break"
          value={form.pontosTieBreak}
          min={10}
          max={50}
          onChange={(v) => update("pontosTieBreak", v)}
          disabled={!canManage}
        />
      </div>

      {/* Toggle vantagem */}
      <BooleanToggle
        label="Vencer por 2 pontos de diferença"
        hint="Ex: empate em 24–24 exige 26–24 para vencer. Aplica em todos os sets."
        value={form.vantagemDoisPontos}
        onChange={(v) => update("vantagemDoisPontos", v)}
        disabled={!canManage}
      />

      {/* Resumo */}
      <ResumoRegras r={form} />

      {/* Ações */}
      {canManage && (
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="gap-2 h-11 px-8 font-semibold"
          >
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
              : <><Check className="h-4 w-4" /> Salvar regras</>}
          </Button>

          {dirty && !saving && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="h-11 text-muted-foreground"
            >
              Descartar
            </Button>
          )}

          {success && (
            <span className="text-sm text-green-600 flex items-center gap-1.5 font-medium">
              <Check className="h-4 w-4" /> Regras salvas com sucesso!
            </span>
          )}
        </div>
      )}

      {!canManage && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          Apenas administradores podem alterar as regras do torneio.
        </div>
      )}
    </div>
  );
}