import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  api, type Partida, type EventoPartida, type TipoPonto, type TipoErro, type TipoCartao, type LadoPonto, type Jogador,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, RotateCcw, Flag, ChevronDown, ChevronUp,
  Loader2, Trophy, X, AlertTriangle
} from "lucide-react";

export const Route = createFileRoute("/matches/$id")({
  component: LiveMatchPage,
});

/* ── Definições de Ações (Botões) ─────────────────────────── */
type ActionDef = {
  type: TipoPonto;
  label: string;
  emoji: string;
  color?: string;
};

const ACOES_PONTO: ActionDef[] = [
  { type: "SAQUE",    label: "Saque",    emoji: "🏐" },
  { type: "ATAQUE",   label: "Ataque",   emoji: "⚡" },
  { type: "BLOQUEIO", label: "Bloqueio", emoji: "🛡️" },
];

// Agora tratamos Erro e Cartão separadamente
const ACOES_EXTRAS: ActionDef[] = [
  { type: "ERRO_ADVERSARIO",   label: "Erro do Adversário",   emoji: "❌", color: "text-orange-500" },
  { type: "CARTAO_ADVERSARIO", label: "Cartão Adversário",    emoji: "🟨", color: "text-red-500" },
];

function LiveMatchPage() {
  const { id: partidaId } = Route.useParams();
  const { user } = useAuth();
  
  const [partida, setPartida] = useState<Partida | null>(null);
  const [eventos, setEventos] = useState<EventoPartida[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para o Modal de seleção de Jogador/Erro
  const [selecionandoAcao, setSelecionandoAcao] = useState<{ lado: LadoPonto, acao: ActionDef } | null>(null);
  const [erroSelecionado, setErroSelecionado] = useState<TipoErro | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      const [p, evs] = await Promise.all([
        api.buscarPartida(partidaId),
        api.listarEventosPartida(partidaId)
      ]);
      setPartida(p);
      setEventos(evs);
    } catch (err) {
      console.error("Erro ao carregar partida:", err);
    } finally {
      setLoading(false);
    }
  }, [partidaId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const registrarPonto = async (lado: LadoPonto, tipo: TipoPonto, jogadorId?: string, tipoErro?: TipoErro, tipoCartao?: TipoCartao) => {
    if (!partida) return;
    
    try {
      const { partida: partidaAtualizada } = await api.registrarEvento(partidaId, {
        indiceSet: partida.setsCasa + partida.setsVisitante,
        lado,
        tipo,
        tipoErro,
        tipoCartao,
        jogadorId,
        placarCasa: partida.setAtualCasa + (lado === "CASA" ? 1 : 0),
        placarVisitante: partida.setAtualVisitante + (lado === "VISITANTE" ? 1 : 0),
      });
      
      setPartida(partidaAtualizada);
      carregarDados(); // Recarrega para garantir sincronia
      setSelecionandoAcao(null);
    } catch (err) {
      console.error("Erro ao registrar ponto:", err);
    }
  };

  const anularUltimo = async () => {
    if (!confirm("Anular o último ponto registrado?")) return;
    try {
      const { partida: p } = await api.anularUltimoEvento(partidaId);
      setPartida(p);
      carregarDados();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!partida) return <div>Partida não encontrada</div>;

  const isFinalizada = partida.status === "FINALIZADA";
  const podeGerenciar = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Cabeçalho com Placar Grande Horizontal */}
        <div className="mb-8 flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-8 md:gap-16">
            <div className="text-right">
              <h2 className="text-2xl font-bold">{partida.nomeTimeCasa}</h2>
              <span className="text-5xl font-black text-primary">{partida.setAtualCasa}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Sets</span>
              <div className="flex items-center gap-3 text-3xl font-bold">
                <span>{partida.setsCasa}</span>
                <span className="text-muted-foreground/30">—</span>
                <span>{partida.setsVisitante}</span>
              </div>
            </div>

            <div className="text-left">
              <h2 className="text-2xl font-bold">{partida.nomeTimeVisitante}</h2>
              <span className="text-5xl font-black text-primary">{partida.setAtualVisitante}</span>
            </div>
          </div>

          {podeGerenciar && !isFinalizada && (
            <div className="flex gap-4">
              <Button variant="outline" size="sm" onClick={anularUltimo} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Anular Ponto
              </Button>
              <Button variant="destructive" size="sm" className="gap-2">
                <Flag className="h-4 w-4" /> Encerrar Partida
              </Button>
            </div>
          )}
        </div>

        {/* ── Painéis de Comando (Apenas se estiver AO VIVO) ── */}
        {!isFinalizada && podeGerenciar && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LADO CASA */}
            <PainelComando 
              timeNome={partida.nomeTimeCasa} 
              lado="CASA" 
              acoesPonto={ACOES_PONTO}
              acoesExtras={ACOES_EXTRAS}
              onAction={(acao) => setSelecionandoAcao({ lado: "CASA", acao })}
            />

            {/* LADO VISITANTE */}
            <PainelComando 
              timeNome={partida.nomeTimeVisitante} 
              lado="VISITANTE" 
              acoesPonto={ACOES_PONTO}
              acoesExtras={ACOES_EXTRAS}
              onAction={(acao) => setSelecionandoAcao({ lado: "VISITANTE", acao })}
            />
          </div>
        )}

        {/* Listagem de Sets Anteriores */}
        <div className="mt-12">
            <h3 className="text-lg font-semibold mb-4 text-center">Histórico de Sets</h3>
            <div className="flex justify-center gap-4">
                {partida.sets.map((s, i) => (
                    <div key={i} className="bg-muted px-4 py-2 rounded-lg border">
                        <span className="text-xs text-muted-foreground block text-center">Set {i+1}</span>
                        <span className="font-bold">{s.casa} x {s.visitante}</span>
                    </div>
                ))}
            </div>
        </div>
      </main>

      {/* Modal de Seleção de Jogador/Detalhes (Conceitual) */}
      {selecionandoAcao && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-card w-full max-w-md p-6 rounded-2xl shadow-xl border">
                  <h3 className="text-xl font-bold mb-4">
                    {selecionandoAcao.acao.label} - {selecionandoAcao.lado === "CASA" ? partida.nomeTimeCasa : partida.nomeTimeVisitante}
                  </h3>
                  
                  {/* Se for erro do adversário, mostrar lista de erros */}
                  {selecionandoAcao.acao.type === "ERRO_ADVERSARIO" && (
                      <div className="grid grid-cols-2 gap-2 mb-6">
                          {["ERRO_SAQUE", "ERRO_ATAQUE", "TOQUE_REDE", "DOIS_TOQUES", "QUATRO_TOQUES", "BOLA_FORA"].map(err => (
                              <Button key={err} variant="outline" size="sm" onClick={() => registrarPonto(selecionandoAcao.lado, "ERRO_ADVERSARIO", undefined, err as TipoErro)}>
                                  {err.replace("ERRO_", "").replace("_", " ")}
                              </Button>
                          ))}
                      </div>
                  )}

                  {/* Botão de fechar */}
                  <Button variant="ghost" className="w-full" onClick={() => setSelecionandoAcao(null)}>Cancelar</Button>
              </div>
          </div>
      )}
    </div>
  );
}

// Sub-componente para organizar os botões de cada lado
function PainelComando({ timeNome, lado, acoesPonto, acoesExtras, onAction }: any) {
    return (
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="text-center font-bold text-xl mb-6 text-primary">{timeNome}</h3>
            
            <div className="space-y-6">
                <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase mb-3 block">Pontos Proativos</span>
                    <div className="grid grid-cols-3 gap-3">
                        {acoesPonto.map((a: any) => (
                            <Button key={a.type} onClick={() => onAction(a)} className="flex flex-col h-20 gap-1">
                                <span className="text-2xl">{a.emoji}</span>
                                <span className="text-xs">{a.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase mb-3 block">Penalidades / Erros</span>
                    <div className="grid grid-cols-2 gap-3">
                        {acoesExtras.map((a: any) => (
                            <Button key={a.type} variant="outline" onClick={() => onAction(a)} className={cn("flex gap-2 h-12", a.color)}>
                                <span>{a.emoji}</span>
                                <span className="text-xs font-bold">{a.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}