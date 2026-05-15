import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Users, Target, Info } from "lucide-react"
import { cn } from "@/services/utils"

export interface TournamentRules {
  startersPerTeam: number      // titulares por equipe (ex: 6 para vôlei padrão)
  pointsToWinSet: number       // pontos para ganhar um set (ex: 25)
  pointsToWinLastSet: number   // pontos para ganhar o set decisivo (ex: 15)
  setsToWinMatch: number       // sets para ganhar a partida (ex: 3 = melhor de 5)
  tieBreakEnabled: boolean     // set decisivo com 2 de diferença
}

interface Props {
  rules: TournamentRules
  setRules: (r: Partial<TournamentRules>) => void
  onNext: () => void
  onBack: () => void
}

const PRESETS: { label: string; desc: string; icon: string; values: TournamentRules }[] = [
  {
    label: "Vôlei Padrão",
    desc: "6x6 • 3 de 5 sets • 25 pts",
    icon: "🏐",
    values: { startersPerTeam: 6, pointsToWinSet: 25, pointsToWinLastSet: 15, setsToWinMatch: 3, tieBreakEnabled: true },
  },
  {
    label: "Beach Vôlei",
    desc: "2x2 • 2 de 3 sets • 21 pts",
    icon: "🏖️",
    values: { startersPerTeam: 2, pointsToWinSet: 21, pointsToWinLastSet: 15, setsToWinMatch: 2, tieBreakEnabled: true },
  },
  {
    label: "Vôlei de Quadra Reduzido",
    desc: "4x4 • 2 de 3 sets • 25 pts",
    icon: "⚡",
    values: { startersPerTeam: 4, pointsToWinSet: 25, pointsToWinLastSet: 15, setsToWinMatch: 2, tieBreakEnabled: true },
  },
  {
    label: "Personalizado",
    desc: "Defina suas próprias regras",
    icon: "🎛️",
    values: { startersPerTeam: 6, pointsToWinSet: 25, pointsToWinLastSet: 15, setsToWinMatch: 3, tieBreakEnabled: true },
  },
]

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  icon: Icon,
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
        {label}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-10 w-10 rounded-lg border border-border bg-card text-foreground font-bold text-lg hover:bg-muted transition-colors flex items-center justify-center shrink-0"
        >
          −
        </button>
        <Input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
          className="h-10 text-center font-bold text-lg w-20 mx-auto"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-10 w-10 rounded-lg border border-border bg-card text-foreground font-bold text-lg hover:bg-muted transition-colors flex items-center justify-center shrink-0"
        >
          +
        </button>
      </div>
    </div>
  )
}

export function RulesStep({ rules, setRules, onNext, onBack }: Props) {
  const applyPreset = (preset: TournamentRules) => {
    setRules(preset)
  }

  const matchDesc = `Melhor de ${rules.setsToWinMatch * 2 - 1} sets (primeiro a ganhar ${rules.setsToWinMatch})`

  return (
    <div className="space-y-8">
      {/* Info */}
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-foreground">
          Defina as regras da partida. Você pode usar um preset ou personalizar cada parâmetro.
        </p>
      </div>

      {/* Presets */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Preset de regras</Label>
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map((p) => {
            const isActive =
              rules.startersPerTeam === p.values.startersPerTeam &&
              rules.pointsToWinSet === p.values.pointsToWinSet &&
              rules.setsToWinMatch === p.values.setsToWinMatch
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p.values)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-sm font-bold text-foreground">{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.desc}</span>
                {isActive && (
                  <span className="text-xs font-bold text-primary mt-1">● Selecionado</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Configuração detalhada</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <NumberField
          label="Titulares por equipe"
          hint="Jogadores em quadra ao mesmo tempo"
          value={rules.startersPerTeam}
          min={1}
          max={12}
          onChange={v => setRules({ startersPerTeam: v })}
          icon={Users}
        />
        <NumberField
          label="Sets para vencer a partida"
          hint={matchDesc}
          value={rules.setsToWinMatch}
          min={1}
          max={5}
          onChange={v => setRules({ setsToWinMatch: v })}
          icon={Target}
        />
        <NumberField
          label="Pontos por set"
          hint="Exceto o set decisivo"
          value={rules.pointsToWinSet}
          min={10}
          max={50}
          onChange={v => setRules({ pointsToWinSet: v })}
        />
        <NumberField
          label="Pontos no set decisivo"
          hint={`${rules.setsToWinMatch * 2 - 1}º set (tie-break)`}
          value={rules.pointsToWinLastSet}
          min={10}
          max={50}
          onChange={v => setRules({ pointsToWinLastSet: v })}
        />
      </div>

      {/* Tie-break toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Vencer por 2 pontos de diferença</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Obrigatório empatar primeiro antes de ganhar (ex: 26-24, 16-14…)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRules({ tieBreakEnabled: !rules.tieBreakEnabled })}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors shrink-0",
            rules.tieBreakEnabled ? "bg-primary" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              rules.tieBreakEnabled ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm space-y-1">
        <p className="font-semibold text-foreground mb-2">Resumo das regras</p>
        <p className="text-muted-foreground">⚽ <strong className="text-foreground">{rules.startersPerTeam}</strong> titulares por equipe</p>
        <p className="text-muted-foreground">🏆 {matchDesc}</p>
        <p className="text-muted-foreground">📊 Sets regulares: <strong className="text-foreground">{rules.pointsToWinSet} pontos</strong></p>
        <p className="text-muted-foreground">⚡ Set decisivo: <strong className="text-foreground">{rules.pointsToWinLastSet} pontos</strong></p>
        <p className="text-muted-foreground">🔁 Vencer por 2: <strong className="text-foreground">{rules.tieBreakEnabled ? "Sim" : "Não"}</strong></p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2 h-11">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button onClick={onNext} className="gap-2 h-11 px-8 font-semibold">
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}