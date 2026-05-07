import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Plus, Trash2, User, Mail, Phone, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Organizer {
  id: string
  name: string
  email: string
  phone: string
  role: "head" | "assistant"
}

interface Props {
  organizers: Organizer[]
  setOrganizers: (organizers: Organizer[]) => void
  onNext: () => void
  onBack: () => void
}

function OrganizerCard({
  organizer,
  index,
  isOnly,
  onRemove,
  onChange,
}: {
  organizer: Organizer
  index: number
  isOnly: boolean
  onRemove: () => void
  onChange: (update: Partial<Organizer>) => void
}) {
  const isHead = organizer.role === "head"

  return (
    <div className={cn(
      "rounded-xl border-2 bg-card overflow-hidden shadow-sm transition-all",
      isHead ? "border-primary/50" : "border-border"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b",
        isHead ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-border"
      )}>
        <div className="flex items-center gap-2">
          {isHead && <Crown className="h-4 w-4 text-primary" />}
          <span className="text-sm font-semibold text-foreground">
            {isHead ? "Organizador principal" : `Assistente ${index}`}
          </span>
        </div>
        {!isOnly && (
          <button
            onClick={onRemove}
            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nome */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <User className="h-3 w-3" /> Nome
          </Label>
          <Input
            value={organizer.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Nome completo"
            className="h-10 bg-background border-border"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Mail className="h-3 w-3" /> E-mail
          </Label>
          <Input
            type="email"
            value={organizer.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="email@exemplo.com"
            className="h-10 bg-background border-border"
          />
        </div>

        {/* Telefone */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Phone className="h-3 w-3" /> Telefone
          </Label>
          <Input
            value={organizer.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="(00) 00000-0000"
            className="h-10 bg-background border-border"
          />
        </div>

        {/* Role toggle */}
        {!isHead && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Função
            </Label>
            <div className="flex gap-2">
              {(["head", "assistant"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => onChange({ role })}
                  className={cn(
                    "flex-1 h-10 rounded-md border text-sm font-medium transition-all",
                    organizer.role === role
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {role === "head" ? "Principal" : "Assistente"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function OrganizersStep({ organizers, setOrganizers, onNext, onBack }: Props) {
  const addOrganizer = () => {
    setOrganizers([
      ...organizers,
      { id: crypto.randomUUID(), name: "", email: "", phone: "", role: "assistant" },
    ])
  }

  const removeOrganizer = (id: string) => {
    setOrganizers(organizers.filter((o) => o.id !== id))
  }

  const updateOrganizer = (id: string, update: Partial<Organizer>) => {
    setOrganizers(organizers.map((o) => (o.id === id ? { ...o, ...update } : o)))
  }

  const isValid = organizers.length > 0 && organizers[0]?.name.trim().length > 0

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {organizers.map((org, i) => (
          <OrganizerCard
            key={org.id}
            organizer={org}
            index={i}
            isOnly={organizers.length === 1}
            onRemove={() => removeOrganizer(org.id)}
            onChange={(u) => updateOrganizer(org.id, u)}
          />
        ))}
      </div>

      <button
        onClick={addOrganizer}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-4 text-sm font-semibold text-primary hover:border-primary hover:bg-primary/5 transition-all"
      >
        <Plus className="h-4 w-4" /> Adicionar organizador
      </button>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2 h-11">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="gap-2 h-11 px-8 font-semibold"
        >
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}