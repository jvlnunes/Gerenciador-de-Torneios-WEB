import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus, Trash2, GripVertical, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export type PhaseFormat = "RACHA" | "MATA_MATA" | "PONTOS" | "HIBRIDO"

export interface Phase {
  id: string
  name: string
  format: PhaseFormat
  description: string
}

interface Props {
  phases: Phase[]
  setPhases: (phases: Phase[]) => void
  onNext: () => void
  onBack: () => void
}

const FORMAT_OPTIONS: { value: PhaseFormat; label: string; icon: string; description: string; color: string }[] = [
  {
    value: "RACHA",
    label: "Racha",
    icon: "🤝",
    description: "Times se formam no local. Informal e divertido.",
    color: "bg-green-50 border-green-200 text-green-800 hover:bg-green-100",
  },
  {
    value: "MATA_MATA",
    label: "Mata-Mata",
    icon: "⚔️",
    description: "Eliminação direta. Quem perde, sai.",
    color: "bg-red-50 border-red-200 text-red-800 hover:bg-red-100",
  },
  {
    value: "PONTOS",
    label: "Pontos corridos",
    icon: "📊",
    description: "Todos jogam contra todos. Classificação por pontos.",
    color: "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
  },
  {
    value: "HIBRIDO",
    label: "Híbrido",
    icon: "🔀",
    description: "Fase de grupos + eliminatórias. O clássico.",
    color: "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100",
  },
]

function PhaseCard({
  phase,
  index,
  onRemove,
  onChangeFormat,
  onChangeName,
}: {
  phase: Phase
  index: number
  onRemove: () => void
  onChangeFormat: (f: PhaseFormat) => void
  onChangeName: (n: string) => void
}) {
  const fmt = FORMAT_OPTIONS.find((f) => f.value === phase.format)!

  return (
    <div className="rounded-xl border-2 border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b border-border">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Fase {index + 1}
        </span>
        <input
          value={phase.name}
          onChange={(e) => onChangeName(e.target.value)}
          className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Nome da fase..."
        />
        <button
          onClick={onRemove}
          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Format picker */}
      <div className="p-4 grid grid-cols-2 gap-2">
        {FORMAT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChangeFormat(opt.value)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-all",
              phase.format === opt.value
                ? "border-primary bg-primary/5 shadow-sm"
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
            <span className="text-xs text-muted-foreground leading-tight">{opt.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function FormatStep({ phases, setPhases, onNext, onBack }: Props) {
  const addPhase = () => {
    setPhases([
      ...phases,
      {
        id: crypto.randomUUID(),
        name: `Fase ${phases.length + 1}`,
        format: "HIBRIDO",
        description: "",
      },
    ])
  }

  const removePhase = (id: string) => {
    setPhases(phases.filter((p) => p.id !== id))
  }

  const updatePhase = (id: string, update: Partial<Phase>) => {
    setPhases(phases.map((p) => (p.id === id ? { ...p, ...update } : p)))
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Configure as fases do torneio em ordem. Cada fase tem um formato de disputa diferente.
          Arraste para reordenar (em breve).
        </p>
      </div>

      {/* Phases */}
      <div className="space-y-4">
        {phases.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
            <p className="text-muted-foreground text-sm">Nenhuma fase adicionada ainda.</p>
            <p className="text-muted-foreground text-xs mt-1">Adicione pelo menos uma fase para continuar.</p>
          </div>
        )}
        {phases.map((phase, i) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            index={i}
            onRemove={() => removePhase(phase.id)}
            onChangeFormat={(f) => updatePhase(phase.id, { format: f })}
            onChangeName={(n) => updatePhase(phase.id, { name: n })}
          />
        ))}
      </div>

      {/* Add phase button */}
      <button
        onClick={addPhase}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-4 text-sm font-semibold text-primary hover:border-primary hover:bg-primary/5 transition-all"
      >
        <Plus className="h-4 w-4" /> Adicionar fase
      </button>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2 h-11">
          <ChevronLeft className="h-4 w-4" /> Voltar
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
  )
}