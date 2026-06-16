"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/services/utils";
import type { JogadorPartida } from "@/services/api";
import { CheckCircle2, GripVertical, Info, RotateCcw, Trophy, Users, X } from "lucide-react";

import type {
  ModalEscalacaoProps, EscalacaoSet, IndicePosicao, TitularEmQuadra, EscalacaoTime,
} from "../components/Escalacao"; // Ajuste o caminho se necessário
import { LABEL_POSICAO } from "../components/Escalacao";

// ─── Lógica de Posições (Grid 2 colunas x 3 linhas) ──────────────────────────
// Col 1 = Fundo, Col 2 = Frente (Para Casa) | Col 1 = Frente, Col 2 = Fundo (Para Visitante)
// Índices: 0=P5, 1=P1, 2=P6, 3=P4, 4=P3, 5=P2

const ORDEM_CASA: IndicePosicao[] = [0, 3, 2, 4, 1, 5]; 
// Visual Casa (Rede na Direita):
// [P5 (Fundo-Esq), P4 (Frente-Dir)]
// [P6 (Fundo-Esq), P3 (Frente-Dir)]
// [P1 (Fundo-Esq), P2 (Frente-Dir)] <- P1 no Canto Inferior Esquerdo

const ORDEM_VISITANTE: IndicePosicao[] = [5, 1, 4, 2, 3, 0];
// Visual Visitante (Rede na Esquerda):
// [P2 (Frente-Esq), P1 (Fundo-Dir)] <- P1 no Canto Superior Direito
// [P3 (Frente-Esq), P6 (Fundo-Dir)]
// [P4 (Frente-Esq), P5 (Fundo-Dir)]

function montarEscalacaoPadrao(timeId: string, jogadores: JogadorPartida[]): EscalacaoTime {
  const titulares: TitularEmQuadra[] = jogadores.slice(0, 6).map((j, i) => ({
    jogadorId: j.jogadorId, indicePosicao: i as IndicePosicao,
  }));
  const banco = jogadores.slice(6).map((j) => j.jogadorId);
  return { timeId, titulares, banco, indicePosicaoSaque: 1 }; // Saque default na Pos 1
}

// ─── Componentes Visuais ──────────────────────────────────────────────────────

function FichaJogador({ jogador, isCasa, isSacador, arrastavel, onIniciarArrasto }: any) {
  return (
    <div className="flex flex-col items-center gap-1 select-none z-20">
      <div
        draggable={arrastavel}
        onDragStart={() => arrastavel && onIniciarArrasto(jogador.jogadorId)}
        className={cn(
          "relative h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white/90 text-white shadow-md transition-transform",
          isCasa ? "bg-[#1a7a4a]" : "bg-[#b85e15]",
          arrastavel && "cursor-grab active:cursor-grabbing active:scale-110",
        )}
      >
        {jogador.numeroCamisa ?? "?"}
        {isSacador && <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-yellow-400 border-2 border-white shadow-sm" />}
      </div>
      <span className="text-[9px] text-white font-bold text-center leading-tight max-w-[52px] truncate drop-shadow-md bg-black/30 px-1 rounded">
        {jogador.nomeJogador.split(" ")[0]}
      </span>
    </div>
  );
}

function SlotQuadra({ indicePosicao, jogador, isCasa, isSacador, lado, onIniciarArrasto, onSoltar }: any) {
  const [isSobre, setIsSobre] = useState(false);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center min-h-[60px] rounded transition-colors z-10",
        isSobre && "bg-white/30 ring-2 ring-white",
        !jogador && "border-2 border-dashed border-white/30 m-1",
      )}
      onDragOver={(e) => { e.preventDefault(); setIsSobre(true); }}
      onDragLeave={() => setIsSobre(false)}
      onDrop={(e) => { e.preventDefault(); setIsSobre(false); onSoltar(indicePosicao, lado); }}
    >
      <span className="absolute top-1 left-1.5 text-[9px] text-white/50 font-black select-none">
        {LABEL_POSICAO[indicePosicao]}
      </span>
      {jogador ? (
        <FichaJogador jogador={jogador} isCasa={isCasa} isSacador={isSacador} arrastavel={true} onIniciarArrasto={(id: string) => onIniciarArrasto(id, lado)} />
      ) : (
        <span className="text-[10px] text-white/40 font-semibold">Vazio</span>
      )}
    </div>
  );
}

function ListaBanco({ jogadores, isCasa, lado, onIniciarArrasto, onSoltarBanco }: any) {
  const [isSobre, setIsSobre] = useState(false);
  return (
    <div
      className={cn("min-h-[90px] rounded-xl border transition-colors p-2 space-y-1.5", isSobre ? "border-primary/60 bg-primary/5" : "border-border bg-muted/30")}
      onDragOver={(e) => { e.preventDefault(); setIsSobre(true); }}
      onDragLeave={() => setIsSobre(false)}
      onDrop={(e) => { e.preventDefault(); setIsSobre(false); onSoltarBanco(lado); }}
    >
      {jogadores.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 italic">Sem reservas</p>}
      {jogadores.map((j: JogadorPartida) => (
        <div key={j.jogadorId} draggable onDragStart={() => onIniciarArrasto(j.jogadorId, lado)} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-border bg-card text-sm cursor-grab active:cursor-grabbing hover:border-primary/40 select-none">
          <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0", isCasa ? "bg-[#1a7a4a]" : "bg-[#b85e15]")}>
            {j.numeroCamisa ?? "?"}
          </div>
          <div className="flex-1 min-w-0"><p className="font-medium text-foreground truncate">{j.nomeJogador}</p></div>
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── Modal Principal ──────────────────────────────────────────────────────────

export function ModalEscalacao({ aberto, indiceSet, timeCasaId, timeVisitanteId, nomeTimeCasa, nomeTimeVisitante, jogadores, escalacaoAnterior, aoConfirmar, aoFechar }: ModalEscalacaoProps) {
  
  const [escCasa, setEscCasa] = useState<EscalacaoTime>(() => escalacaoAnterior?.casa ?? montarEscalacaoPadrao(timeCasaId, jogadores.filter((j) => j.timeId === timeCasaId)));
  const [escVis, setEscVis] = useState<EscalacaoTime>(() => escalacaoAnterior?.visitante ?? montarEscalacaoPadrao(timeVisitanteId, jogadores.filter((j) => j.timeId === timeVisitanteId)));

  const refArrastoId = useRef<string | null>(null);
  const refLadoOrigem = useRef<"CASA" | "VISITANTE" | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setEscCasa(escalacaoAnterior?.casa ?? montarEscalacaoPadrao(timeCasaId, jogadores.filter((j) => j.timeId === timeCasaId)));
    setEscVis(escalacaoAnterior?.visitante ?? montarEscalacaoPadrao(timeVisitanteId, jogadores.filter((j) => j.timeId === timeVisitanteId)));
  }, [aberto]);

  if (!aberto) return null;

  const getTitulares = (esc: EscalacaoTime) => esc.titulares.map(s => jogadores.find(j => j.jogadorId === s.jogadorId)).filter(Boolean) as JogadorPartida[];
  const getReservas = (esc: EscalacaoTime) => esc.banco.map(id => jogadores.find(j => j.jogadorId === id)).filter(Boolean) as JogadorPartida[];

  const handleIniciarArrasto = (jogadorId: string, lado: "CASA" | "VISITANTE") => {
    refArrastoId.current = jogadorId;
    refLadoOrigem.current = lado;
  };

  const handleSoltarNaPosicao = (paraIndice: IndicePosicao, ladoDestino: "CASA" | "VISITANTE") => {
    if (refLadoOrigem.current !== ladoDestino || !refArrastoId.current) return;
    
    const isCasa = ladoDestino === "CASA";
    const escAtual = isCasa ? escCasa : escVis;
    const setEscAtual = isCasa ? setEscCasa : setEscVis;
    const id = refArrastoId.current;

    const novosT = [...escAtual.titulares];
    const novoB = [...escAtual.banco];

    const titularOrigem = novosT.find(s => s.jogadorId === id);
    const titularDestino = novosT.find(s => s.indicePosicao === paraIndice);

    if (titularOrigem) { // Movendo entre posições na quadra
      if (titularDestino && titularOrigem !== titularDestino) {
        const tmp = titularOrigem.indicePosicao;
        titularOrigem.indicePosicao = titularDestino.indicePosicao;
        titularDestino.indicePosicao = tmp;
      } else if (!titularDestino) {
        titularOrigem.indicePosicao = paraIndice;
      }
    } else { // Vindo do banco
      const idxBanco = novoB.indexOf(id);
      if (titularDestino) { // Substitui quem tá na quadra
        novoB.splice(idxBanco, 1);
        novoB.push(titularDestino.jogadorId);
        titularDestino.jogadorId = id;
      } else { // Entra no slot vazio
        novoB.splice(idxBanco, 1);
        novosT.push({ jogadorId: id, indicePosicao: paraIndice });
      }
    }

    setEscAtual({ ...escAtual, titulares: novosT, banco: novoB });
    refArrastoId.current = null;
  };

  const handleSoltarNoBanco = (ladoDestino: "CASA" | "VISITANTE") => {
    if (refLadoOrigem.current !== ladoDestino || !refArrastoId.current) return;
    
    const isCasa = ladoDestino === "CASA";
    const escAtual = isCasa ? escCasa : escVis;
    
    // Só move pro banco se estiver vindo da quadra
    if (escAtual.banco.includes(refArrastoId.current)) return; 

    const novosT = escAtual.titulares.filter(s => s.jogadorId !== refArrastoId.current);
    const novoB = [...escAtual.banco, refArrastoId.current];

    const setEscAtual = isCasa ? setEscCasa : setEscVis;
    setEscAtual({ ...escAtual, titulares: novosT, banco: novoB });
    refArrastoId.current = null;
  };

  const isValido = escCasa.titulares.length === 6 && escVis.titulares.length === 6;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="w-full max-w-5xl bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl"><Trophy className="h-5 w-5 text-primary" /></div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Escalação Global — Set {indiceSet + 1}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Arraste os jogadores para definir as 6 posições de cada lado da quadra.</p>
            </div>
          </div>
          <button onClick={aoFechar} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Times Headers */}
          <div className="flex justify-between items-center px-4">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-[#1a7a4a]" />
              <h3 className="font-bold text-lg">{nomeTimeCasa}</h3>
              <Badge variant="secondary" className={escCasa.titulares.length === 6 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}>{escCasa.titulares.length}/6</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={escVis.titulares.length === 6 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}>{escVis.titulares.length}/6</Badge>
              <h3 className="font-bold text-lg">{nomeTimeVisitante}</h3>
              <span className="h-4 w-4 rounded-full bg-[#b85e15]" />
            </div>
          </div>

          {/* QUADRA UNIFICADA */}
          <div className="w-full bg-[#c8794a] rounded-xl border-4 border-white overflow-hidden shadow-inner flex relative" style={{ aspectRatio: '2.2 / 1' }}>
            
            {/* LADO CASA (Rede à direita) */}
            <div className="flex-1 relative border-r-[1.5px] border-white/60">
              <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white/40 -translate-x-1/2" /> {/* Linha 3m Casa */}
              <div className="h-full grid grid-cols-2 grid-rows-3 relative z-10 p-1">
                {ORDEM_CASA.map((indice) => (
                  <SlotQuadra key={`casa-${indice}`} indicePosicao={indice} lado="CASA" jogador={getTitulares(escCasa).find(j => escCasa.titulares.find(t => t.jogadorId === j.jogadorId)?.indicePosicao === indice)} isCasa={true} isSacador={escCasa.indicePosicaoSaque === indice} onIniciarArrasto={handleIniciarArrasto} onSoltar={handleSoltarNaPosicao} />
                ))}
              </div>
            </div>

            {/* REDE */}
            <div className="w-[4px] bg-white z-20 flex flex-col justify-between items-center py-2 absolute left-1/2 top-0 bottom-0 -translate-x-1/2 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              <div className="h-3 w-3 rounded-full bg-red-600 border-2 border-white absolute -top-1" />
              <div className="h-3 w-3 rounded-full bg-red-600 border-2 border-white absolute -bottom-1" />
            </div>

            {/* LADO VISITANTE (Rede à esquerda) */}
            <div className="flex-1 relative border-l-[1.5px] border-white/60">
              <div className="absolute top-0 bottom-0 right-1/2 w-[2px] bg-white/40 translate-x-1/2" /> {/* Linha 3m Visitante */}
              <div className="h-full grid grid-cols-2 grid-rows-3 relative z-10 p-1">
                {ORDEM_VISITANTE.map((indice) => (
                  <SlotQuadra key={`vis-${indice}`} indicePosicao={indice} lado="VISITANTE" jogador={getTitulares(escVis).find(j => escVis.titulares.find(t => t.jogadorId === j.jogadorId)?.indicePosicao === indice)} isCasa={false} isSacador={escVis.indicePosicaoSaque === indice} onIniciarArrasto={handleIniciarArrasto} onSoltar={handleSoltarNaPosicao} />
                ))}
              </div>
            </div>
          </div>

          {/* Configuração de Saque e Bancos */}
          <div className="grid grid-cols-2 gap-8 pt-2">
            
            {/* LADO CASA */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Quem inicia sacando?</p>
                <div className="flex flex-wrap gap-1.5">
                  {escCasa.titulares.map(s => {
                    const j = getTitulares(escCasa).find(jj => jj.jogadorId === s.jogadorId);
                    return j && (
                      <button key={s.jogadorId} onClick={() => setEscCasa({ ...escCasa, indicePosicaoSaque: s.indicePosicao })} className={cn("px-2 py-1 rounded border text-[10px] font-bold", escCasa.indicePosicaoSaque === s.indicePosicao ? "border-yellow-400 bg-yellow-400/20 text-yellow-700" : "bg-muted text-muted-foreground")}>
                        {LABEL_POSICAO[s.indicePosicao]}: {j.nomeJogador.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1"><Users className="h-3 w-3" /> Reservas Casa</p>
                <ListaBanco jogadores={getReservas(escCasa)} isCasa={true} lado="CASA" onIniciarArrasto={handleIniciarArrasto} onSoltarBanco={handleSoltarNoBanco} />
              </div>
            </div>

            {/* LADO VISITANTE */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Quem inicia sacando?</p>
                <div className="flex flex-wrap gap-1.5">
                  {escVis.titulares.map(s => {
                    const j = getTitulares(escVis).find(jj => jj.jogadorId === s.jogadorId);
                    return j && (
                      <button key={s.jogadorId} onClick={() => setEscVis({ ...escVis, indicePosicaoSaque: s.indicePosicao })} className={cn("px-2 py-1 rounded border text-[10px] font-bold", escVis.indicePosicaoSaque === s.indicePosicao ? "border-yellow-400 bg-yellow-400/20 text-yellow-700" : "bg-muted text-muted-foreground")}>
                         {LABEL_POSICAO[s.indicePosicao]}: {j.nomeJogador.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1"><Users className="h-3 w-3" /> Reservas Visitante</p>
                <ListaBanco jogadores={getReservas(escVis)} isCasa={false} lado="VISITANTE" onIniciarArrasto={handleIniciarArrasto} onSoltarBanco={handleSoltarNoBanco} />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {!isValido && <><Info className="h-3.5 w-3.5 text-amber-500" /> Os dois times precisam ter 6 titulares na quadra.</>}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={aoFechar} className="h-10">Cancelar</Button>
            <Button onClick={() => aoConfirmar({ indiceSet, casa: escCasa, visitante: escVis })} disabled={!isValido} className="gap-2 h-10 px-8 font-bold">
              <CheckCircle2 className="h-4 w-4" /> Confirmar Escalações
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}