import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Users, BarChart3, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VolleyHub — Gerenciador de Torneios de Vôlei" },
      { name: "description", content: "Crie, organize e acompanhe torneios de vôlei em tempo real. Estatísticas ao vivo, times e jogadores." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 -z-10 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <div className="container mx-auto grid gap-10 px-4 py-24 lg:grid-cols-2 lg:py-32">
          <div className="text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
              <Zap className="h-3 w-3" /> Estatísticas em tempo real
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
              Domine a quadra.<br />
              <span style={{ background: "linear-gradient(90deg, oklch(0.85 0.18 75), oklch(0.75 0.21 40))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Conquiste o torneio.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/85">
              Plataforma completa para organizar torneios de vôlei: gerencie times, jogadores, partidas e registre cada ponto ao vivo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="shadow-lg" style={{ boxShadow: "var(--shadow-glow)" }}>
                <Link to="/tournaments/new">
                  Criar torneio <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link to="/tournaments">Explorar torneios</Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute right-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-primary/30 blur-3xl" />
            <div className="relative grid grid-cols-2 gap-4">
              {[
                { label: "Torneios ativos", value: "24", icon: Trophy },
                { label: "Times cadastrados", value: "186", icon: Users },
                { label: "Partidas ao vivo", value: "7", icon: Zap },
                { label: "Pontos registrados", value: "12.4k", icon: BarChart3 },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
                  <s.icon className="h-6 w-6 text-accent" />
                  <div className="mt-3 font-display text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-sm text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">Tudo que você precisa para o torneio perfeito</h2>
          <p className="mt-4 text-muted-foreground">Da inscrição à final — controle total em uma única plataforma.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Trophy, title: "Crie torneios", desc: "Defina chaves, datas e regulamento. Aberto, fechado ou por convite." },
            { icon: Users, title: "Times & jogadores", desc: "Cadastre elencos, capitães e gerencie inscrições com facilidade." },
            { icon: BarChart3, title: "Stats ao vivo", desc: "Registre cada ponto, ace e bloqueio — gere relatórios automáticos." },
          ].map((f, i) => (
            <div key={i} className="group rounded-2xl border bg-card p-8 transition-all hover:-translate-y-1" style={{ boxShadow: "var(--shadow-elevated)" }}>
              <div className="grid h-12 w-12 place-items-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} VolleyHub — Sistema de gerenciamento de torneios de vôlei
      </footer>
    </div>
  );
}
