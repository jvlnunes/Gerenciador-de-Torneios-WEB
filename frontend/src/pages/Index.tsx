import { Link } from "react-router-dom";
import { Trophy, Users, BarChart3, ChevronRight, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #0d1a0d 55%, #0a3d1f 100%)" }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Green glow */}
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full blur-[120px] opacity-20"
          style={{ background: "#00843D" }}
        />

        <div className="relative container mx-auto px-4 py-28 lg:py-36 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div
              className="inline-flex items-center gap-2 mb-6 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(0,132,61,0.2)", border: "1px solid rgba(0,132,61,0.4)", color: "#4ade80" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Ao vivo
            </div>

            <h1
              className="font-display font-black leading-none tracking-tight"
              style={{ color: "#ffffff", fontSize: "clamp(2.8rem, 6vw, 5.5rem)" }}
            >
              GERENCIE.<br />
              <span style={{ color: "#00843D" }}>COMPITA.</span><br />
              VENÇA.
            </h1>

            <p className="mt-6 text-base lg:text-lg leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,0.60)" }}>
              Plataforma profissional para organizar torneios de vôlei —
              times, partidas e estatísticas em tempo real.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                size="lg" asChild
                className="h-12 px-7 font-bold text-sm tracking-wide"
                style={{ background: "#00843D", color: "#fff", border: "none" }}
              >
                <Link to="/torneios/novo">
                  Criar torneio <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg" asChild
                className="h-12 px-7 font-bold text-sm"
                style={{ borderColor: "rgba(255,255,255,0.20)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                variant="outline"
              >
                <Link to="/torneios">Ver torneios</Link>
              </Button>
            </div>

            {/* Stats strip */}
            <div
              className="mt-12 flex gap-8 border-t pt-8"
              style={{ borderColor: "rgba(255,255,255,0.10)" }}
            >
              {[
                { n: "24", label: "Torneios ativos" },
                { n: "186", label: "Times" },
                { n: "1.2k", label: "Jogadores" },
                { n: "7", label: "Ao vivo" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl font-black" style={{ color: "#00843D" }}>{s.n}</div>
                  <div className="text-xs mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.40)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — live scoreboard mock */}
          <div className="hidden lg:block">
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ background: "#111", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="flex items-center justify-between px-5 py-3 text-xs font-bold uppercase tracking-widest"
                style={{ background: "#00843D", color: "#fff" }}
              >
                <span>🏆 Copa VolleyHub — Semifinal</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Ao vivo
                </span>
              </div>

              <div className="px-5 py-6 space-y-4">
                {[
                  { team: "Tigres FC", score: 2, sets: [25, 23, 20], leading: true },
                  { team: "Leões SP", score: 1, sets: [22, 25, 18], leading: false },
                ].map((t) => (
                  <div key={t.team} className="flex items-center gap-4">
                    <div
                      className="h-10 w-10 rounded-xl grid place-items-center text-lg font-black shrink-0"
                      style={{ background: t.leading ? "#00843D" : "#222", color: "#fff" }}
                    >
                      {t.team[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: "#fff" }}>{t.team}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Sets: {t.sets.join(" · ")}
                      </p>
                    </div>
                    <span
                      className="font-display text-3xl font-black"
                      style={{ color: t.leading ? "#00843D" : "rgba(255,255,255,0.30)" }}
                    >
                      {t.score}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5 grid grid-cols-3 gap-2">
                {[["25","22"], ["23","25"], ["20","18"]].map(([a, b], i) => (
                  <div
                    key={i}
                    className="rounded-lg p-3 text-center"
                    style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.30)" }}>
                      Set {i + 1}
                    </p>
                    <p className="font-display font-black text-lg" style={{ color: "#fff" }}>
                      {a} – {b}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="px-5 py-3 text-xs flex items-center justify-between"
                style={{ background: "#0d0d0d", color: "rgba(255,255,255,0.28)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> 3º Set • Ponto 20</span>
                <span>Ginásio Municipal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Por que o VolleyHub</p>
          <h2 className="font-display text-4xl md:text-5xl font-black text-foreground">
            Tudo que o torneio perfeito precisa
          </h2>
          <p className="mt-4 text-muted-foreground">
            Da inscrição à final — controle total em uma plataforma feita para quem leva o esporte a sério.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Trophy,
              title: "Criação de torneios",
              desc: "Wizard completo com fases, formatos e regras personalizáveis. Aberto, fechado ou por convite.",
              tag: "Gestão",
            },
            {
              icon: Users,
              title: "Times & jogadores",
              desc: "Cadastre elencos via link de convite, gerencie posições e número de camisa em segundos.",
              tag: "Elenco",
            },
            {
              icon: BarChart3,
              title: "Estatísticas ao vivo",
              desc: "Registre pontos, aces e bloqueios em tempo real. Gere tabelas e rankings automaticamente.",
              tag: "Stats",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border bg-card p-8 hover:-translate-y-1 transition-all hover:border-primary/40 hover:shadow-lg"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className="h-12 w-12 rounded-xl grid place-items-center"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {f.tag}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container mx-auto px-4 pb-24">
        <div
          className="rounded-3xl relative overflow-hidden px-10 py-16 text-center"
          style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #0a3d1f 100%)" }}
        >
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-25"
            style={{ background: "#00843D" }}
          />
          <div className="relative">
            <Shield className="h-12 w-12 mx-auto mb-4" style={{ color: "#00843D" }} />
            <h2 className="font-display text-4xl md:text-5xl font-black" style={{ color: "#fff" }}>
              Pronto para o apito inicial?
            </h2>
            <p className="mt-4 text-lg max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.50)" }}>
              Crie seu torneio e comece a gerenciar em menos de 5 minutos.
            </p>
            <Button
              size="lg" asChild
              className="mt-8 h-12 px-10 font-bold"
              style={{ background: "#00843D", color: "#fff", border: "none" }}
            >
              <Link to="/torneios/novo">
                Criar torneio <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} VolleyHub — Gerenciamento profissional de torneios de vôlei
      </footer>
    </div>
  );
}