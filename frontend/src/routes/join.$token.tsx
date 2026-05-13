import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { api, type Time } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Users, Trophy, Loader2, CheckCircle2, LogIn } from "lucide-react";

export const Route = createFileRoute("/join/$token")({
  component: JoinTeamPage,
});

const POSITIONS = ["Levantador", "Ponteiro", "Oposto", "Central", "Líbero", "Outro"];

function JoinTeamPage() {
  const { token } = Route.useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam]       = useState<(Time & { tournamentName: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [joined, setJoined]   = useState(false);
  const [submitting, setSub]  = useState(false);

  const [name, setName]           = useState(user?.nome ?? "");
  const [jersey, setJersey]       = useState("");
  const [position, setPosition]   = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    api.getTeamByInvite(token)
      .then(setTeam)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (user?.nome) setName(user.nome);
  }, [user]);

  const handleJoin = async () => {
    if (!name.trim()) { setFormError("Informe seu nome"); return; }
    if (!isAuthenticated) { navigate({ to: "/login", search: { redirect: `/join/${token}` } }); return; }

    setSub(true); setFormError(null);
    try {
      await api.joinTeamByInvite(token, { name: name.trim(), jerseyNumber: jersey ? Number(jersey) : undefined, position: position || undefined });
      setJoined(true);
    } catch (e) { setFormError((e as Error).message); }
    finally { setSub(false); }
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  /* ── Invalid link ── */
  if (error || !team) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 grid place-items-center mx-auto">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Link inválido</h1>
        <p className="text-muted-foreground text-sm">{error ?? "Este link de convite não existe ou expirou."}</p>
        <Button asChild><Link to="/torneios">Ver torneios</Link></Button>
      </div>
    </div>
  );

  /* ── Success ── */
  if (joined) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-success/10 grid place-items-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Você entrou no time!</h1>
        <p className="text-muted-foreground text-sm">
          Bem-vindo ao <strong>{team.nome}</strong> — {team.tournamentName}
        </p>
        <Button asChild><Link to="/torneios">Ver torneios</Link></Button>
      </div>
    </div>
  );

  /* ── Main ── */
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Team card */}
        <div className="rounded-2xl border-2 border-border bg-card p-6 text-center shadow-md space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center gap-1">
              <Trophy className="h-3 w-3" /> {team.tournamentName}
            </p>
            <h1 className="font-display text-3xl font-bold text-foreground mt-1">{team.nome}</h1>
          </div>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <Users className="h-4 w-4" /> {team.quantidadeJogadores ?? 0} jogador{(team.quantidadeJogadores ?? 0) !== 1 ? "es" : ""} no time
          </p>
        </div>

        {/* Join form */}
        <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-md space-y-5">
          <h2 className="font-display text-xl font-bold text-foreground">Entrar no time</h2>

          {!isAuthenticated && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 flex items-start gap-2">
              <LogIn className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Você precisará fazer login para confirmar sua entrada no time.</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">Seu nome *</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Como você quer ser chamado"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground">Nº camisa</Label>
                <Input
                  value={jersey}
                  onChange={e => setJersey(e.target.value)}
                  type="number" min={1} max={99}
                  placeholder="Ex: 10"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground">Posição</Label>
                <select
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">— Opcional —</option>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <Button onClick={handleJoin} disabled={submitting} className="w-full h-11 font-semibold gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isAuthenticated ? "Confirmar entrada" : "Entrar e fazer login"}
          </Button>
        </div>
      </div>
    </div>
  );
}