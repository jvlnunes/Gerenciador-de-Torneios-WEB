import { useEffect, useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import type { Torneio, Partida, Time } from "@/services/api/interfaces";
import { Loader2, Shield, Swords, Users, ChevronLeft, ChevronRight, Trophy, Zap, Award } from "lucide-react";
import { cn } from "@/services/utils";

interface TorneioCtx {
  torneio: Torneio;
  torneioId: string;
  liveCount: number;
}

interface PlayerStats {
  id: string;
  nome: string;
  time: string;
  pontos: number;
  saques: number;
  bloqueios: number;
}

export default function TorneioOverview() {
  const { torneio, torneioId } = useOutletContext<TorneioCtx>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [times, setTimes] = useState<Time[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [estatisticasAtletas, setEstatisticasAtletas] = useState<PlayerStats[]>([]);
  
  // Controle de estado do Slider de Categorias (0: Pontos, 1: Saques, 2: Bloqueios)
  const [categoriaAtiva, setCategoriaAtiva] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [ts, ps] = await Promise.all([
          api.listarTimes(torneioId),
          api.listarPartidas(torneioId),
        ]);
        setTimes(ts);
        setPartidas(ps);

        const timeNomeMap = new Map(ts.map((t) => [t.id, t.nome]));
        const partidasValidas = ps.filter((p) => p.status === "FINALIZADA" || p.status === "AO_VIVO");
        
        const playerMap = new Map<string, PlayerStats>();

        // Busca todos os eventos em paralelo
        const eventosByPartida = await Promise.all(
          partidasValidas.map((p) =>
            api.listarEventosPartida(p.id).then((evs) => ({ partida: p, evs }))
          )
        );

        // Agregação das ações individuais
        eventosByPartida.forEach(({ partida, evs }) => {
          evs.filter((e) => !e.anulado).forEach((ev) => {
            if (!ev.jogadorId || !ev.jogadorNome) return;

            if (!playerMap.has(ev.jogadorId)) {
              const timeId = ev.lado === "CASA" ? partida.timeCasaId : partida.timeVisitanteId;
              playerMap.set(ev.jogadorId, {
                id: ev.jogadorId,
                nome: ev.jogadorNome,
                time: timeNomeMap.get(timeId) ?? "Desconhecido",
                pontos: 0,
                saques: 0,
                bloqueios: 0,
              });
            }

            const pData = playerMap.get(ev.jogadorId)!;
            
            if (ev.tipo === "SAQUE") {
              pData.pontos++;
              pData.saques++;
            } else if (ev.tipo === "ATAQUE") {
              pData.pontos++;
            } else if (ev.tipo === "BLOQUEIO") {
              pData.pontos++;
              pData.bloqueios++;
            }
          });
        });

        setEstatisticasAtletas(Array.from(playerMap.values()));

      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [torneioId]);

  // Cálculo de totalização de atletas inscritos
  const totalJogadores = useMemo(() => {
    return times.reduce((acc, t) => acc + (t.quantidadeJogadores || 0), 0);
  }, [times]);

  // Cálculo da tabela simplificada (Time, J, PTS)
  const miniStandings = useMemo(() => {
    const map = new Map<string, { jogos: number; pts: number }>();
    times.forEach((t) => map.set(t.id, { jogos: 0, pts: 0 }));

    partidas
      .filter((p) => p.status === "FINALIZADA")
      .forEach((p) => {
        const casa = map.get(p.timeCasaId);
        const visit = map.get(p.timeVisitanteId);
        if (!casa || !visit) return;

        casa.jogos++;
        visit.jogos++;

        if (p.setsCasa > p.setsVisitante) {
          if (p.setsVisitante === 2) {
            casa.pts += 2;
            visit.pts += 1;
          } else {
            casa.pts += 3;
          }
        } else {
          if (p.setsCasa === 2) {
            visit.pts += 2;
            casa.pts += 1;
          } else {
            visit.pts += 3;
          }
        }
      });

    return times
      .map((t) => ({
        id: t.id,
        nome: t.nome,
        jogos: map.get(t.id)?.jogos ?? 0,
        pts: map.get(t.id)?.pts ?? 0,
      }))
      .sort((a, b) => b.pts - a.pts);
  }, [times, partidas]);

  // Cálculo dos pódios isolados
  const { topPontuadores, topSaques, topBloqueios } = useMemo(() => {
    const base = [...estatisticasAtletas];
    return {
      topPontuadores: [...base].sort((a, b) => b.pontos - a.pontos).slice(0, 3),
      topSaques: [...base].sort((a, b) => b.saques - a.saques).slice(0, 3),
      topBloqueios: [...base].sort((a, b) => b.bloqueios - a.bloqueios).slice(0, 3),
    };
  }, [estatisticasAtletas]);

  const slides = [
    {
      titulo: "Maiores Pontuadores",
      icone: <Trophy className="h-4 w-4 text-yellow-500" />,
      chaveValor: "pontos",
      sufixo: "pts",
      dados: topPontuadores
    },
    {
      titulo: "Reis dos Aces",
      icone: <Zap className="h-4 w-4 text-blue-500" />,
      chaveValor: "saques",
      sufixo: "aces",
      dados: topSaques
    },
    {
      titulo: "Muralhas do Bloqueio",
      icone: <Shield className="h-4 w-4 text-purple-500" />,
      chaveValor: "bloqueios",
      sufixo: "blocks",
      dados: topBloqueios
    }
  ];

  const slideAtual = slides[categoriaAtiva];

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* 1. SEÇÃO HERO: Mantendo logo, capa e identidade original do Torneio */}
      <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden shadow-md border border-border group">
        {torneio.capaUrl ? (
          <img src={torneio.capaUrl} alt="Capa do Torneio" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/80 to-primary/40" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4">
          <div className="h-20 w-20 md:h-24 md:w-24 rounded-full border-4 border-background bg-background overflow-hidden shrink-0 shadow-xl">
            {torneio.logoUrl ? (
              <img src={torneio.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-3xl font-black text-muted-foreground">
                {torneio.nome.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 pb-1">
            <h1 className="text-2xl md:text-4xl font-display font-black text-white drop-shadow-md">
              {torneio.nome}
            </h1>
            <p className="text-white/80 text-sm md:text-base font-medium mt-1 line-clamp-1">
              {torneio.descricao || "Acompanhe as estatísticas e partidas em tempo real."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. GRID DE CONTADORES: Times, Jogadores e Partidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Times</p>
            <p className="text-3xl font-black text-foreground mt-0.5">{times.length}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Jogadores</p>
            <p className="text-3xl font-black text-foreground mt-0.5">{totalJogadores}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-orange-50/50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center">
            <Swords className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Partidas</p>
            <p className="text-3xl font-black text-foreground mt-0.5">{partidas.length}</p>
          </div>
        </div>
      </div>

      {/* 3. GRID SECUNDÁRIO: Classificação Simplificada vs Listas do Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* COLUNA ESQUERDA: CLASSIFICAÇÃO SIMPLIFICADA (Time, J, PTS) */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-foreground">Classificação Geral</h3>
            <button onClick={() => navigate("classificacao")} className="text-xs font-bold text-primary hover:underline">Tabela Completa →</button>
          </div>
          
          {miniStandings.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 italic">Nenhum dado de classificação computado.</p>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden text-sm">
              <div className="grid grid-cols-[2.5rem_1fr_3.5rem_3.5rem] bg-muted/40 px-3 py-2 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                <span>#</span>
                <span>Equipe</span>
                <span className="text-center">J</span>
                <span className="text-center">PTS</span>
              </div>
              <div className="divide-y divide-border">
                {miniStandings.slice(0, 5).map((row, index) => (
                  <div key={row.id} className="grid grid-cols-[2.5rem_1fr_3.5rem_3.5rem] items-center px-3 py-2.5 hover:bg-muted/5 transition-colors">
                    <span className="font-black text-xs text-muted-foreground">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                    </span>
                    <span className="font-semibold text-foreground truncate">{row.nome}</span>
                    <span className="text-center text-muted-foreground text-xs">{row.jogos}</span>
                    <span className="text-center font-bold text-foreground">{row.pts}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: SLIDER DE LISTAS (TOP 3 COMPLETO POR ABA) */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          
          {/* Cabeçalho do Slider com as setas operacionais */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-muted/60">{slideAtual.icone}</div>
              <h3 className="font-display text-base font-bold text-foreground">{slideAtual.titulo}</h3>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCategoriaAtiva((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setCategoriaAtiva((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
                className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Renderização da Lista de Atletas do Slide Atual */}
          {slideAtual.dados.length === 0 || slideAtual.dados[0][slideAtual.chaveValor as keyof PlayerStats] === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground italic border border-dashed border-border rounded-xl bg-muted/10 flex-1 flex flex-col items-center justify-center">
              <Award className="h-8 w-8 text-muted-foreground/20 mb-2" />
              Nenhum evento registrado nesta categoria.
            </div>
          ) : (
            <div className="flex-1 space-y-2 animate-in fade-in duration-200">
              {slideAtual.dados.map((atleta, index) => {
                const valor = atleta[slideAtual.chaveValor as keyof PlayerStats] as number;
                if (valor === 0) return null; // Não renderiza linhas vazias de quem tem zero ações

                return (
                  <div key={`${categoriaAtiva}-${atleta.id}`} className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-black w-6 text-center">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </span>
                      <div className="truncate">
                        <p className="text-sm font-bold text-foreground truncate">{atleta.nome}</p>
                        <p className="text-[10px] font-medium text-muted-foreground truncate">{atleta.time}</p>
                      </div>
                    </div>
                    <span className="font-black text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg shrink-0">
                      {valor} {slideAtual.sufixo}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dots Indicadores de Paginação na parte inferior */}
          <div className="flex justify-center gap-1.5 mt-4">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCategoriaAtiva(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  categoriaAtiva === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                )}
              />
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}