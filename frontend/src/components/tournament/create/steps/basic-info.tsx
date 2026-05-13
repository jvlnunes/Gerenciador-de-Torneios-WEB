import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Calendar, ChevronRight, AlertCircle } from "lucide-react"
import { useState } from "react"

interface BasicInfoData {
  name: string
  description: string
  location: string
  startDate: string
  endDate: string
  // maxTeams: number
  status: "RASCUNHO" | "ABERTO" | "EM_ANDAMENTO" | "FINALIZADO"
}

interface Props {
  data: BasicInfoData
  setData: (data: Partial<BasicInfoData>) => void
  onNext: () => void
}

export function BasicInfoStep({ data, setData, onNext }: Props) {
  const [dateError, setDateError] = useState<string | null>(null)

  const isValid = data.name.trim().length > 0

  const handleStartDate = (val: string) => {
    setData({ startDate: val })
    if (data.endDate && val && new Date(val) > new Date(data.endDate)) {
      setDateError("A data de início não pode ser após o término.")
    } else {
      setDateError(null)
    }
  }

  const handleEndDate = (val: string) => {
    setData({ endDate: val })
    if (data.startDate && val && new Date(val) < new Date(data.startDate)) {
      setDateError("A data de término não pode ser antes do início.")
    } else {
      setDateError(null)
    }
  }

  const canAdvance = isValid && !dateError

  return (
    <div className="space-y-6">
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-semibold text-foreground">
          Nome do torneio <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Ex: Copa Verão 2026"
          value={data.name}
          onChange={(e) => setData({ name: e.target.value })}
          className="h-11 bg-card border-border focus-visible:ring-primary"
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-semibold text-foreground">
          Descrição
        </Label>
        <Textarea
          id="description"
          placeholder="Descreva o torneio, regulamento, premiação..."
          value={data.description}
          onChange={(e) => setData({ description: e.target.value })}
          rows={4}
          className="bg-card border-border focus-visible:ring-primary resize-none"
        />
      </div>

      {/* Local */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" /> Local
        </Label>
        <Input
          id="location"
          placeholder="Ex: Ginásio Municipal"
          value={data.location}
          onChange={(e) => setData({ location: e.target.value })}
          className="h-11 bg-card border-border focus-visible:ring-primary"
        />
      </div>

      {/* Datas */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Início
            </Label>
            <Input
              id="startDate"
              type="date"
              value={data.startDate}
              onChange={(e) => handleStartDate(e.target.value)}
              className="h-11 bg-card border-border focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Término
            </Label>
            <Input
              id="endDate"
              type="date"
              value={data.endDate}
              min={data.startDate || undefined}
              onChange={(e) => handleEndDate(e.target.value)}
              className={`h-11 bg-card border-border focus-visible:ring-primary ${dateError ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
          </div>
        </div>

        {dateError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {dateError}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">Status inicial</Label>
        <Select value={data.status} onValueChange={(v) => setData({ status: v as BasicInfoData["status"] })}>
          <SelectTrigger className="h-11 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RASCUNHO">🗒️ Rascunho</SelectItem>
            <SelectItem value="ABERTO">✅ Inscrições abertas</SelectItem>
            <SelectItem value="EM_ANDAMENTO">🏐 Em andamento</SelectItem>
            {/* <SelectItem value="FINALIZADO">🏆 Finalizado</SelectItem> */}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onNext}
          disabled={!canAdvance}
          className="h-11 px-8 font-semibold gap-2"
        >
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}