import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  api, type Partida, type EventoPartida, type TipoPonto, type TipoErro, type TipoCartao, type LadoPonto, type JogadorPartida,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  RotateCcw, Flag, Loader2, User, Users
} from "lucide-react";

export const Route = createFileRoute("/partidas/$id")({
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

const ACOES_EXTRAS: ActionDef[] = [
  { type: "ERRO_ADVERSARIO",   label: "Erro Adversário",   emoji: "❌", color: "text-orange-500" },
  { type: "CARTAO_ADVERSARIO", label: "Cartão",            emoji: "🟨", color: "text-red-500" },
];

function LiveMatchPage() {
  const { id: partidaId } = Route.useParams();
  const { user } = useAuth();
  
  const [partida, setPartida] = useState<Partida | null>(null);
  const [eventos, setEventos] = useState<EventoPartida[]>([]);
  const [jogadores, setJogadores] = useState<JogadorPartida[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do Modal
  const [selecionandoAcao, setSelecionandoAcao] = useState<{ lado: LadoPonto, acao: ActionDef } | null>(null);
  const [erroSelecionado, setErroSelecionado] = useState<TipoErro | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      const [p, evs, jgs] = await Promise.all([
        api.buscarPartida(partidaId),
        api.listarEventosPartida(partidaId),
        api.listarJogadoresPartida(partidaId)
      ]);
      setPartida(p);
      setEventos(evs);
      setJogadores(jgs);
    } catch (err) {
      console.error("Erro ao carregar partida:", err);
    } finally {
      setLoading(false);
    }
  }, [partidaId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const registrarPonto = async (jogadorId?: string) => {
    if (!partida || !selecionandoAcao) return;
    
    try {
      const { partida: partidaAtualizada } = await api.registrarEvento(partidaId, {
        indiceSet: partida.setsCasa + partida.setsVisitante,
        lado: selecionandoAcao.lado,
        tipo: selecionandoAcao.acao.type,
        tipoErro: erroSelecionado || undefined,
        jogadorId: jogadorId,
        placarCasa: partida.setAtualCasa + (selecionandoAcao.lado === "CASA" ? 1 : 0),
        placarVisitante: partida.setAtualVisitante + (selecionandoAcao.lado === "VISITANTE" ? 1 : 0),
      });
      
      setPartida(partidaAtualizada);
      carregarDados();
      
      // Limpa os estados do modal
      setSelecionandoAcao(null);
      setErroSelecionado(null);
    } catch (err) {
      console.error("Erro ao registrar ponto:", err);
    }
  };

  const anularUltimo = async () => {
    if (!confirm("Anular o último evento registrado?")) return;
    try {
      const { partida: p } = await api.anularUltimoEvento(partidaId);
      setPartida(p);
      carregarDados();
    } catch (err) {
      console.error(err);
    }
  };

  const iniciarPartida = async () => {
    if (!confirm("Deseja iniciar a partida agora?")) return;
    try {
      const p = await api.comecaPartida(partidaId);
      setPartida(p);
    } catch (err) {
      console.error("Erro ao iniciar partida:", err);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!partida) return <div>Partida não encontrada</div>;

  const isFinalizada = partida.status === "FINALIZADA";
  const isAoVivo = partida.status === "AO_VIVO";
  const podeGerenciar = user?.perfil === "ADMIN" || user?.perfil === "GERENTE";

  // Separando jogadores por time APENAS com os IDs reais vindos do banco
  const jogadoresCasa = jogadores.filter(j => j.timeId === partida.timeCasaId);
  const jogadoresVisitante = jogadores.filter(j => j.timeId === partida.timeVisitanteId);

  // Lógica do Modal
  const timeIdDaAcao = selecionandoAcao?.lado === "CASA" ? partida.timeCasaId : partida.timeVisitanteId;
  const timeIdAdversario = selecionandoAcao?.lado === "CASA" ? partida.timeVisitanteId : partida.timeCasaId;
  
  const isAcaoAdversaria = selecionandoAcao?.acao.type === "ERRO_ADVERSARIO" || selecionandoAcao?.acao.type === "CARTAO_ADVERSARIO";
  const jogadoresNoModal = isAcaoAdversaria
    ? jogadores.filter(j => j.timeId === timeIdAdversario)
    : jogadores.filter(j => j.timeId === timeIdDaAcao);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      <SiteHeader />
      
      <main className="container mx-auto px-4 py-8">
        
        {/* ── PLACAR GRANDE DE GINÁSIO ── */}
        <div className="mb-10 flex flex-col items-center justify-center space-y-8">
          <div className="flex items-center justify-center w-full max-w-5xl mx-auto gap-4 md:gap-8">
            
            {/* Lado Casa (Nome à esquerda, Placar à direita) */}
            <div className="flex-1 flex flex-col-reverse md:flex-row items-center justify-end gap-3 md:gap-6">
              <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-center md:text-right leading-tight break-words max-w-[200px] lg:max-w-xs">
                {partida.nomeTimeCasa}
              </h2>
              <div className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-8 md:px-10 md:py-10 flex items-center justify-center min-w-[110px] md:min-w-[160px] shadow-sm">
                <span className="text-7xl md:text-9xl font-black text-primary leading-none tracking-tighter">
                  {partida.setAtualCasa}
                </span>
              </div>
            </div>
            
            {/* Centro (Sets) */}
            <div className="flex flex-col items-center justify-center px-2 md:px-4">
              <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 md:mb-3">
                {isAoVivo ? "Sets" : partida.status.replace("_", " ")}
              </span>
              <div className="flex items-center gap-2 md:gap-4 text-3xl md:text-5xl font-black text-muted-foreground/80">
                <span>{partida.setsCasa}</span>
                <span className="text-xl md:text-2xl text-muted-foreground/30 font-bold">X</span>
                <span>{partida.setsVisitante}</span>
              </div>
            </div>

            {/* Lado Visitante (Placar à esquerda, Nome à direita) */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-start gap-3 md:gap-6">
              <div className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-8 md:px-10 md:py-10 flex items-center justify-center min-w-[110px] md:min-w-[160px] shadow-sm">
                <span className="text-7xl md:text-9xl font-black text-primary leading-none tracking-tighter">
                  {partida.setAtualVisitante}
                </span>
              </div>
              <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-center md:text-left leading-tight break-words max-w-[200px] lg:max-w-xs">
                {partida.nomeTimeVisitante}
              </h2>
            </div>

          </div>

          {/* Botões de Ação do Placar */}
          {podeGerenciar && !isFinalizada && (
            <div className="flex gap-4">
              {!isAoVivo ? (
                <Button onClick={iniciarPartida} size="lg" className="gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8">
                  <Flag className="h-5 w-5" /> Começar Partida
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={anularUltimo} className="gap-2">
                    <RotateCcw className="h-4 w-4" /> Anular Ponto
                  </Button>
                  <Button variant="destructive" className="gap-2">
                    <Flag className="h-4 w-4" /> Encerrar Partida
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Renderização Condicional: Painel de Comando vs Lista de Elenco ── */}
        {isAoVivo && podeGerenciar ? (
          // Se for Organizador e estiver Ao Vivo, mostra botões de pontuar
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            <PainelComando 
              timeNome={partida.nomeTimeCasa} 
              lado="CASA" 
              acoesPonto={ACOES_PONTO}
              acoesExtras={ACOES_EXTRAS}
              jogadores={jogadoresCasa}
              onAction={(acao: ActionDef) => setSelecionandoAcao({ lado: "CASA", acao })}
            />

            <PainelComando 
              timeNome={partida.nomeTimeVisitante} 
              lado="VISITANTE" 
              acoesPonto={ACOES_PONTO}
              acoesExtras={ACOES_EXTRAS}
              jogadores={jogadoresVisitante}
              onAction={(acao: ActionDef) => setSelecionandoAcao({ lado: "VISITANTE", acao })}
            />
          </div>
        ) : (
          // Se não começou, se já acabou, ou se é só espectador: Mostra os Elencos
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            <ElencoCard timeNome={partida.nomeTimeCasa} jogadores={jogadoresCasa} />
            <ElencoCard timeNome={partida.nomeTimeVisitante} jogadores={jogadoresVisitante} />
          </div>
        )}

        {/* Histórico de Sets */}
        {partida.sets.length > 0 && (
          <div className="mt-16 border-t pt-8">
              <h3 className="text-lg font-bold mb-6 text-center text-muted-foreground uppercase tracking-widest">Histórico de Sets</h3>
              <div className="flex flex-wrap justify-center gap-4">
                  {partida.sets.map((s, i) => (
                      <div key={i} className="bg-card px-6 py-3 rounded-xl border shadow-sm flex flex-col items-center">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Set {i+1}</span>
                          <span className="font-black text-xl">{s.casa} <span className="text-muted-foreground font-normal mx-1">x</span> {s.visitante}</span>
                      </div>
                  ))}
              </div>
          </div>
        )}
      </main>

      {/* ── MODAL INTELIGENTE (Erros e Jogadores) ── */}
      {selecionandoAcao && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-card w-full max-w-md p-6 rounded-2xl shadow-xl border">
                  <h3 className="text-xl font-bold mb-2">
                    {selecionandoAcao.acao.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {isAcaoAdversaria 
                      ? "Selecione o erro ou quem cometeu a infração (Time Adversário)" 
                      : "Quem pontuou para a equipe?"}
                  </p>
                  
                  {/* Passo 1: Se for Erro, escolhe o tipo primeiro */}
                  {selecionandoAcao.acao.type === "ERRO_ADVERSARIO" && !erroSelecionado && (
                      <div className="grid grid-cols-2 gap-2 mb-6">
                          {(["ERRO_SAQUE", "ERRO_ATAQUE", "TOQUE_REDE", "DOIS_TOQUES", "QUATRO_TOQUES", "BOLA_FORA", "INVASAO"] as TipoErro[]).map(err => (
                              <Button key={err} variant="outline" className="h-auto py-3 justify-start" onClick={() => setErroSelecionado(err)}>
                                  {err.replace("ERRO_", "").replace("_", " ")}
                              </Button>
                          ))}
                      </div>
                  )}

                  {/* Passo 2: Escolhe o Jogador (Ou se já for ponto direto) */}
                  {(selecionandoAcao.acao.type !== "ERRO_ADVERSARIO" || erroSelecionado) && (
                      <div className="space-y-4">
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                          {jogadoresNoModal.length > 0 ? (
                            jogadoresNoModal.map(j => (
                              <Button key={j.id} variant="secondary" className="w-full justify-start h-12" onClick={() => registrarPonto(j.jogadorId)}>
                                <span className="w-8 text-muted-foreground font-mono">{j.numeroCamisa || "-"}</span>
                                <span className="font-bold">{j.nomeJogador}</span>
                              </Button>
                            ))
                          ) : (
                            <p className="text-center text-sm text-muted-foreground py-6 border border-dashed rounded-lg bg-muted/30">
                                Nenhum jogador escalado nesta equipe. <br/>
                                <span className="text-xs">Você pode registrar o ponto apenas para a equipe abaixo.</span>
                            </p>
                          )}
                        </div>
                        
                        {/* Botão para pular caso não saibam/não queiram marcar o jogador */}
                        <Button variant="outline" className="w-full border-dashed border-2 font-semibold" onClick={() => registrarPonto()}>
                           Atribuir ação a Equipe Inteira
                        </Button>
                      </div>
                  )}

                  <Button variant="ghost" className="w-full mt-4" onClick={() => { setSelecionandoAcao(null); setErroSelecionado(null); }}>
                    Cancelar
                  </Button>
              </div>
          </div>
      )}
    </div>
  );
}

// ── COMPONENTES AUXILIARES ──

// Exibe a lista bonita de elenco para quem está assistindo ou antes do jogo
function ElencoCard({ timeNome, jogadores }: { timeNome: string, jogadores: JogadorPartida[] }) {
  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm">
      <h3 className="text-center font-bold text-xl mb-6 flex items-center justify-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        {timeNome}
      </h3>
      <div className="space-y-2">
        {jogadores.length > 0 ? (
          jogadores.map(j => (
            <div key={j.id} className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <span className="font-mono text-primary font-bold w-6 text-right">{j.numeroCamisa || "-"}</span>
                <span className="font-medium text-sm sm:text-base">{j.nomeJogador}</span>
              </div>
              {j.posicao && <Badge variant="secondary" className="text-[10px] uppercase">{j.posicao}</Badge>}
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8 border border-dashed rounded-lg">
            Nenhum jogador escalado. Vá até a gestão do time para adicionar atletas à partida.
          </p>
        )}
      </div>
    </div>
  );
}

// Sub-componente com a Lista de Jogadores Embutida (Durante o jogo ao vivo)
function PainelComando({ timeNome, lado, acoesPonto, acoesExtras, jogadores, onAction }: any) {
    return (
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col h-full">
            <h3 className="text-center font-bold text-2xl mb-6 text-primary">{timeNome}</h3>
            
            {/* Botões */}
            <div className="space-y-6 flex-grow">
                <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase mb-3 block">Pontos Proativos</span>
                    <div className="grid grid-cols-3 gap-3">
                        {acoesPonto.map((a: any) => (
                            <Button key={a.type} onClick={() => onAction(a)} className="flex flex-col h-20 gap-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-transparent transition-all">
                                <span className="text-2xl">{a.emoji}</span>
                                <span className="text-xs font-bold">{a.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase mb-3 block">Adversário</span>
                    <div className="grid grid-cols-2 gap-3">
                        {acoesExtras.map((a: any) => (
                            <Button key={a.type} variant="outline" onClick={() => onAction(a)} className={cn("flex gap-2 h-14 transition-all", a.color)}>
                                <span className="text-xl">{a.emoji}</span>
                                <span className="text-xs font-bold uppercase">{a.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Elenco do Time (Abaixo dos botões) */}
            <div className="mt-8 pt-6 border-t">
              <span className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                <User className="h-4 w-4" /> Jogadores em Quadra
              </span>
              <div className="flex flex-wrap gap-2">
                {jogadores.length > 0 ? (
                  jogadores.map((j: any) => (
                    <div key={j.id} className="bg-muted px-3 py-1.5 rounded-md text-sm border flex items-center gap-2">
                      <span className="font-mono text-muted-foreground font-bold">{j.numeroCamisa || "-"}</span>
                      <span className="font-medium">{j.nomeJogador.split(" ")[0]}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md w-full block text-center border-dashed border">
                    Sem elenco na partida. Atribua as ações à equipe.
                  </span>
                )}
              </div>
            </div>
        </div>
    )
}