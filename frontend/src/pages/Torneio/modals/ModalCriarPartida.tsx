import { useState } from "react";
import { Time, Partida } from "@/services/api/interfaces";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Plus, Loader2, X, Calendar, MapPin
} from "lucide-react";

/* ── Create Match Modal ──────────────────────────────────── */
export function ModalCriarPartida({
  tournamentId,
  teams,
  onCreated,
  onClose,
}: {
  tournamentId: string;
  teams: Time[];
  onCreated: (m: Partida) => void;
  onClose: () => void;
}) {
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!homeTeamId || !awayTeamId) { setError("Selecione os dois times"); return; }
    if (homeTeamId === awayTeamId) { setError("Os times precisam ser diferentes"); return; }
    setSaving(true); setError(null);
    try {
      const m = await api.criarPartida({
        torneioId: tournamentId,
        timeCasaId: homeTeamId,
        timeVisitanteId: awayTeamId,
        agendadoPara: scheduledAt || undefined,
        local: location || undefined,
      } as unknown as Omit<Partida, "id">);
      onCreated(m);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const selectClass =
    "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Nova partida</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Time da casa *</label>
            <select value={homeTeamId} onChange={(e) => setHomeTeamId(e.target.value)} className={selectClass}>
              <option value="">— Selecionar time —</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">vs</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Time visitante *</label>
            <select value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)} className={selectClass}>
              <option value="">— Selecionar time —</option>
              {teams.filter((t) => t.id !== homeTeamId).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Data/hora
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Local
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Quadra principal"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="flex-1 h-11 gap-2 font-semibold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar
          </Button>
        </div>
      </div>
    </div>
  );
}