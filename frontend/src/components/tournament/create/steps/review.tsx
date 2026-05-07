import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Trophy, MapPin, Calendar, Users, CheckCircle2, Loader2 } from "lucide-react"
import type { Phase } from "./format"
import type { Organizer } from "./organizers"
import type { MediaData } from "./media"

const FORMAT_LABELS: Record<string, string> = {
  RACHA: "🤝 Racha",
  MATA_MATA: "⚔️ Mata-Mata",
  PONTOS: "📊 Pontos corridos",
  HIBRIDO: "🔀 Híbrido",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  OPEN: "Inscrições abertas",
  ONGOING: "Em andamento",
  FINISHED: "Finalizado",
}

interface BasicInfo {
  name: string
  description: string
  location: string
  startDate: string
  endDate: string
  maxTeams: number
  status: string
}

interface Props {
  basicInfo: BasicInfo
  phases: Phase[]
  organizers: Organizer[]
  media: MediaData
  onBack: () => void
  onSubmit: () => void
  submitting: boolean
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-muted/50 border-b border-border">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value || <span className="text-muted-foreground italic">Não informado</span>}</span>
    </div>
  )
}

export function ReviewStep({ basicInfo, phases, organizers, media, onBack, onSubmit, submitting }: Props) {
  return (
    <div className="space-y-6">
      {/* Hero preview */}
      <div className="rounded-xl overflow-hidden border-2 border-primary/30 relative">
        {media.bannerUrl ? (
          <img src={media.bannerUrl} alt="Banner" className="w-full h-32 object-cover" />
        ) : (
          <div className="h-32 w-full" style={{ background: "var(--gradient-hero)" }} />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex items-end gap-3">
          {media.logoUrl ? (
            <img src={media.logoUrl} alt="Logo" className="h-14 w-14 rounded-xl object-cover border-2 border-white/30" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-primary/80 border-2 border-white/30 grid place-items-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <h2 className="font-display text-xl font-bold text-white leading-tight">{basicInfo.name}</h2>
            {basicInfo.location && (
              <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {basicInfo.location}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Basic info */}
      <Section title="Informações básicas">
        <Row label="Status" value={<Badge className="text-xs">{STATUS_LABELS[basicInfo.status]}</Badge>} />
        <Row label="Descrição" value={basicInfo.description} />
        <Row label="Local" value={basicInfo.location} />
        <Row
          label="Período"
          value={
            basicInfo.startDate || basicInfo.endDate
              ? `${basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleDateString("pt-BR") : "—"} → ${basicInfo.endDate ? new Date(basicInfo.endDate).toLocaleDateString("pt-BR") : "—"}`
              : null
          }
        />
        <Row label="Máx. times" value={`${basicInfo.maxTeams} times`} />
      </Section>

      {/* Phases */}
      <Section title={`Fases (${phases.length})`}>
        {phases.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhuma fase configurada</p>
        ) : (
          <div className="space-y-2">
            {phases.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="text-xs font-bold text-muted-foreground w-6">{i + 1}.</span>
                <span className="text-sm font-medium text-foreground flex-1">{p.name}</span>
                <Badge variant="secondary" className="text-xs">{FORMAT_LABELS[p.format]}</Badge>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Organizers */}
      <Section title={`Organizadores (${organizers.length})`}>
        {organizers.map((org, i) => (
          <div key={org.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 grid place-items-center shrink-0">
              <span className="text-xs font-bold text-primary">{org.name?.[0]?.toUpperCase() || "?"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{org.name || <span className="text-muted-foreground italic">Sem nome</span>}</p>
              <p className="text-xs text-muted-foreground truncate">{org.email}</p>
            </div>
            {i === 0 && <Badge className="text-xs shrink-0">Principal</Badge>}
          </div>
        ))}
      </Section>

      {/* Social */}
      {media.socialLinks.length > 0 && (
        <Section title="Redes sociais">
          {media.socialLinks.map((s) => (
            <div key={s.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
              <span className="text-sm font-medium text-foreground capitalize">{s.platform}</span>
              <span className="text-xs text-muted-foreground truncate flex-1">{s.url}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={submitting} className="gap-2 h-11">
          <ChevronLeft className="h-4 w-4" /> Voltar
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
  )
}