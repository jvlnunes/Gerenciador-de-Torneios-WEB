import { Input } from "@/components/ui/input";
import { useState } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Time } from "@/services/api/interfaces";
import { Loader2, X, Plus } from "lucide-react";

export function ModalCriarTime({
  torneioId,
  onCreated,
  onClose,
}: {
  torneioId: string;
  onCreated: (t: Time) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [cor, setCor] = useState("#00843D");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) { setError("Informe o nome do time"); return; }
    setSaving(true); setError(null);
    try {
      const t = await api.times.criar({ torneioId, nome: name.trim(), corPrimaria: cor } as any);
      onCreated(t);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Novo time</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Nome do time *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Ex: Tigres FC"
              className="h-11"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Cor principal</label>
            <div className="flex items-center gap-3 h-11 rounded-xl border border-input px-3 bg-background">
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="h-7 w-7 rounded cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="text-sm font-mono text-foreground">{cor}</span>
              <div
                className="ml-auto h-8 w-8 rounded-lg text-sm font-black text-white grid place-items-center shrink-0"
                style={{ background: cor }}
              >
                {name?.[0]?.toUpperCase() || "?"}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Pode ser alterada depois na página do time</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="flex-1 h-11 gap-2 font-semibold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar time
          </Button>
        </div>
      </div>
    </div>
  );
}