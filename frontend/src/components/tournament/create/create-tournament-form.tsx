import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { BasicInfoStep } from "./steps/basic-info"
import { FormatStep, type Phase } from "./steps/format"
import { RulesStep, type TournamentRules } from "./steps/rules"
import { OrganizersStep, type Organizer } from "./steps/organizers"
import { MediaStep, type MediaData } from "./steps/media"
import { ReviewStep } from "./steps/review"
import { api, auth } from "@/lib/api"
import { cn } from "@/lib/utils"
import { CheckCircle2, X, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

// ── Step definitions ──────────────────────────────────────────
const STEPS = [
  { id: 0, label: "Informações",   shortLabel: "Info"  },
  { id: 1, label: "Fases",         shortLabel: "Fases" },
  { id: 2, label: "Regras",        shortLabel: "Regras"},
  { id: 3, label: "Organizadores", shortLabel: "Org."  },
  { id: 4, label: "Mídia",         shortLabel: "Mídia" },
  { id: 5, label: "Revisão",       shortLabel: "OK"    },
]

const STEP_DESCRIPTIONS = [
  "Defina as informações principais do seu torneio.",
  "Configure as fases e formatos de disputa.",
  "Defina as regras de partida e pontuação.",
  "Adicione os organizadores responsáveis.",
  "Adicione banner, logo e redes sociais.",
  "Revise tudo antes de criar o torneio.",
]

interface BasicInfo {
  name: string
  description: string
  location: string
  startDate: string
  endDate: string
  maxTeams: number
  status: "RASCUNHO" | "ABERTO" | "EM_ANDAMENTO" | "FINALIZADO"
}

// ── Stepper UI ────────────────────────────────────────────────
function Stepper({
  steps,
  currentStep,
  onClickStep,
}: {
  steps: typeof STEPS
  currentStep: number
  onClickStep?: (id: number) => void
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-border" />
        <div
          className="absolute left-0 top-5 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((s) => {
          const isDone    = currentStep > s.id
          const isCurrent = currentStep === s.id
          return (
            <div
              key={s.id}
              className="flex flex-col items-center gap-2 relative z-10"
            >
              <button
                type="button"
                onClick={() => onClickStep?.(s.id)}
                disabled={!onClickStep}
                className={cn(
                  "h-10 w-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300",
                  isDone
                    ? "bg-primary border-primary text-primary-foreground cursor-pointer hover:brightness-90"
                    : isCurrent
                      ? "bg-card border-primary text-primary shadow-md"
                      : "bg-card border-border text-muted-foreground",
                  onClickStep && isDone ? "cursor-pointer" : "cursor-default"
                )}
              >
                {isDone ? <CheckCircle2 className="h-5 w-5" /> : s.id + 1}
              </button>
              <span className={cn(
                "text-xs font-medium hidden sm:block",
                isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
              )}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Edit Wizard Modal ─────────────────────────────────────────
interface EditWizardProps {
  initialStep?: number
  onClose: () => void
}

export function EditTournamentWizard({ initialStep = 0, onClose }: EditWizardProps) {
  const [step, setStep] = useState(initialStep)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="w-full max-w-2xl bg-background rounded-2xl border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Editar torneio</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Clique em uma etapa concluída para navegar</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <Stepper steps={STEPS} currentStep={step} onClickStep={(id) => id < step && setStep(id)} />

          <div className="mb-6">
            <h3 className="font-display text-2xl font-bold text-foreground">{STEPS[step].label}</h3>
            <p className="text-sm text-muted-foreground mt-1">{STEP_DESCRIPTIONS[step]}</p>
          </div>

          {/* Steps content would go here for edit mode — for now shows a placeholder */}
          <div className="rounded-xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Edição da etapa <strong className="text-foreground">"{STEPS[step].label}"</strong> — conecte ao backend para salvar alterações.
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => step > 0 ? setStep(s => s - 1) : onClose()} className="gap-2 h-10">
              {step === 0 ? "Fechar" : "← Voltar"}
            </Button>
            {step < STEPS.length - 1 && (
              <Button onClick={() => setStep(s => s + 1)} className="gap-2 h-10 px-6 font-semibold">
                Próximo →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Create Tournament Form ────────────────────────────────────
export function CreateTournamentForm() {
  const navigate = useNavigate()
  const [step, setStep]           = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Pre-fill organizer with current user
  const currentUser = auth.getUser()

  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    maxTeams: 8,
    status: "RASCUNHO",
  })

  const [phases, setPhases] = useState<Phase[]>([
    { id: crypto.randomUUID(), name: "Fase de grupos", format: "HIBRIDO", description: "" },
  ])

  const [rules, setRules] = useState<TournamentRules>({
    startersPerTeam: 6,
    pointsToWinSet: 25,
    pointsToWinLastSet: 15,
    setsToWinMatch: 3,
    tieBreakEnabled: true,
  })

  const [organizers, setOrganizers] = useState<Organizer[]>([
    {
      id: crypto.randomUUID(),
      name: currentUser?.nome ?? "",
      email: currentUser?.email ?? "",
      phone: "",
      role: "head",
    },
  ])

  const [media, setMedia] = useState<MediaData>({
    bannerUrl: null,
    logoUrl: null,
    bannerFile: null,
    logoFile: null,
    socialLinks: [],
  })

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      // await api.createTournament({
      await api.criarTorneio({
        nome: basicInfo.name,
        descricao: basicInfo.description,
        local: basicInfo.location,
        dataInicio: basicInfo.startDate || undefined,
        dataFim: basicInfo.endDate || undefined,
        // maxTimes: basicInfo.maxTeams,
        status: basicInfo.status,
      })
      navigate({ to: "/torneios" })
    } catch (e) {
      setError((e as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Stepper steps={STEPS} currentStep={step} />

      {/* Step title */}
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          {STEPS[step].label}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {STEP_DESCRIPTIONS[step]}
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === 0 && (
          <BasicInfoStep
            data={basicInfo}
            setData={(u) => setBasicInfo((prev) => ({ ...prev, ...u }))}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <FormatStep
            phases={phases}
            setPhases={setPhases}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <RulesStep
            rules={rules}
            setRules={(u) => setRules((prev) => ({ ...prev, ...u }))}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <OrganizersStep
            organizers={organizers}
            setOrganizers={setOrganizers}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <MediaStep
            data={media}
            setData={(u) => setMedia((prev) => ({ ...prev, ...u }))}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && (
          <ReviewStep
            basicInfo={basicInfo}
            phases={phases}
            organizers={organizers}
            media={media}
            onBack={() => setStep(4)}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  )
}