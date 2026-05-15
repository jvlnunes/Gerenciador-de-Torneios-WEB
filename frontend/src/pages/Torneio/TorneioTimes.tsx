// TorneioTimes.tsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api, type Torneio, type Time, type Jogador } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Users, X } from "lucide-react";

interface TorneioCtx { torneio: Torneio; torneioId: string; liveCount: number; }

export function TorneioTimes() {
  const { torneio, torneioId } = useOutletContext<TorneioCtx>();
  const [times, setTimes] = useState<Time[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jogadores, setJogadores] = useState<Record<string, Jogador[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const user = (() => { try { return JSON.parse(localStorage.getItem("vb_user") ?? "null"); } catch { return null; } })();
  const canManage = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";

  useEffect(() => {
    api.listarTimes(torneioId).then(setTimes).finally(() => setLoading(false));
  }, [torneioId]);

  const toggleTime = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!jogadores[id]) {
      const jgs = await api.listarJogadores(id);
      setJogadores(prev => ({ ...prev, [id]: jgs }));
    }
  };

  const criarTime = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const t = await api.criarTime({ torneioId, nome: newName.trim() });
      setTimes(prev => [...prev, t]);
      setNewName("");
      setShowCreate(false);
    } finally { setSaving(false); }
  };

  const removerTime = async (id: string) => {
    if (!confirm("Excluir este time?")) return;
    await api.removerTime(id);
    setTimes(prev => prev.filter(t => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-black text-foreground">Times</h1>
          <p className="text-muted-foreground mt-1 text-sm">{torneio.nome} · {times.length} times</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo time
          </Button>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Novo time</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && criarTime()}
              placeholder="Nome do time..."
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 h-11">Cancelar</Button>
              <Button onClick={criarTime} disabled={saving} className="flex-1 h-11 gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar
              </Button>
            </div>
          </div>
        </div>
      )}

      {times.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-3 font-display text-lg font-bold text-foreground">Nenhum time ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">Adicione os times participantes.</p>
          {canManage && (
            <Button className="mt-4 gap-2" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Criar time
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {times.map(t => (
            <div key={t.id} className={`rounded-2xl border-2 bg-card shadow-sm overflow-hidden transition-all ${expandedId === t.id ? "border-primary/50" : "border-border"}`}>
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleTime(t.id)}
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                  <span className="font-black text-sm text-primary">{t.nome[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">{t.quantidadeJogadores ?? 0} jogadores</p>
                </div>
                <span className="text-xs text-muted-foreground">{expandedId === t.id ? "▲" : "▼"}</span>
              </div>

              {expandedId === t.id && (
                <div className="border-t border-border px-5 py-4">
                  {jogadores[t.id] ? (
                    jogadores[t.id].length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-3">Nenhum jogador cadastrado.</p>
                    ) : (
                      <div className="space-y-1">
                        {jogadores[t.id].map(j => (
                          <div key={j.id} className="flex items-center gap-3 py-1.5 px-1">
                            <span className="h-7 w-7 rounded-md bg-primary/10 grid place-items-center text-xs font-bold text-primary shrink-0">
                              {j.numeroCamisa ?? "—"}
                            </span>
                            <span className="text-sm text-foreground flex-1">{j.nome}</span>
                            {j.posicao && <span className="text-xs text-muted-foreground">{j.posicao}</span>}
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                  )}
                  {canManage && (
                    <div className="mt-3 pt-3 border-t border-border flex justify-end">
                      <Button size="sm" variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                        onClick={() => removerTime(t.id)}>
                        Excluir time
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TorneioTimes;