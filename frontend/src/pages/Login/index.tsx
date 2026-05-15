import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  // Usamos useSearchParams do react-router-dom para pegar parâmetros da URL
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); 
    setError(null);
    try {
      if (mode === "register") await api.register(name, email, password);
      await api.login(email, password);
      
      // Navegação estilo react-router-dom (passamos apenas a string do caminho)
      navigate(redirect || "/torneios");
    } catch (e) {
      setError((e as Error).message);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between p-12 text-primary-foreground lg:flex" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex items-center gap-2 font-display text-2xl font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/15 backdrop-blur"><Trophy className="h-5 w-5" /></span>
          VolleyHub
        </div>
        <div>
          <h2 className="font-display text-5xl font-bold leading-tight">Cada ponto.<br />Cada partida.<br />Em tempo real.</h2>
          <p className="mt-4 max-w-md text-white/80">A central completa para organizar torneios de vôlei como um profissional.</p>
        </div>
        <div className="text-sm text-white/60">© {new Date().getFullYear()} VolleyHub</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl font-bold">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Acesse para gerenciar torneios." : "Cadastre-se para participar."}
          </p>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            {mode === "register" && (
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" required value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
            {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
          </button>
          <div className="mt-8 rounded-lg border border-dashed bg-muted/40 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Modo demo</p>
            <p>Sem API conectada (defina <code className="rounded bg-background px-1">VITE_API_URL</code>), use qualquer email. Inclua "admin" ou "manager" no email para ganhar permissões de gestão.</p>
          </div>
        </div>
      </div>
    </div>
  );
}