"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/services/utils";
import type { JogadorPartida } from "@/services/api";
import { CheckCircle2, X, Trophy, GripVertical } from "lucide-react";

import type {
  ModalEscalacaoProps,
  EscalacaoSet,
  IndicePosicao,
  TitularEmQuadra,
  EscalacaoTime,
} from "../components/Escalacao";

// ─── Layout visual da quadra (igual ao componente Quadra.tsx da partida ao vivo)
// Casa: cols [2fr 1fr] — Pos 5,4 / Pos 6,3 / Pos 1,2
// Visitante: cols [1fr 2fr] — Pos 2,1 / Pos 3,6 / Pos 4,5
//
// Mapeamento indicePosicao → slot visual:
// Casa (lado esquerdo da rede):
//   row0: slot0=pos5(idx0?), slot1=pos4(idx3) ...
// Para manter EXATAMENTE o mesmo layout do Quadra.tsx usamos os mesmos arrays:
const ORDEM_CASA: IndicePosicao[] = [0, 3, 2, 4, 1, 5];
//   grid-cols-[2fr_1fr]:
//   [0]=vSlot5 [3]=vSlot4
//   [2]=vSlot6 [4]=vSlot3
//   [1]=vSlot1 [5]=vSlot2

const ORDEM_VISITANTE: IndicePosicao[] = [5, 1, 4, 2, 3, 0];
//   grid-cols-[1fr_2fr]:
//   [5]=vSlot2 [1]=vSlot1
//   [4]=vSlot3 [2]=vSlot6
//   [3]=vSlot4 [0]=vSlot5

// Label de cada slot visual no grid (para exibir "Pos X" nos cantos)
const LABEL_CASA: Record<number, string> = { 0: "5", 1: "1●", 2: "6", 3: "4", 4: "3", 5: "2" };
const LABEL_VIS: Record<number, string>  = { 5: "2", 1: "1●", 4: "3", 2: "6", 3: "4", 0: "5" };

function montarEscalacaoPadrao(timeId: string, jogadores: JogadorPartida[]): EscalacaoTime {
  const titulares: TitularEmQuadra[] = jogadores.slice(0, 6).map((j, i) => ({
    jogadorId: j.jogadorId,
    indicePosicao: i as IndicePosicao,
  }));
  const banco = jogadores.slice(6).map((j) => j.jogadorId);
  return { timeId, titulares, banco, indicePosicaoSaque: 1 };
}

// ─── Slot individual da quadra ────────────────────────────────────────────────
function Slot({
  indicePosicao,
  jogador,
  isCasa,
  label,
  onDragStart,
  onDrop,
}: {
  indicePosicao: IndicePosicao;
  jogador: JogadorPartida | undefined;
  isCasa: boolean;
  label: string;
  onDragStart: () => void;
  onDrop: () => void;
}) {
  const [over, setOver] = useState(false);
  const isSacador = indicePosicao === 1; // Posição 1 = sacador
  const bgCor = isCasa ? "bg-emerald-600" : "bg-orange-500";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center min-h-[60px] z-10 rounded transition-all",
        over && "bg-white/30 ring-2 ring-white scale-105",
        !jogador && "border border-dashed border-white/20 m-0.5"
      )}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onDrop(); }}
    >
      {/* Rótulo da posição no canto */}
      <span className={cn(
        "absolute top-1 left-1.5 text-[8px] font-black select-none",
        isSacador ? "text-yellow-300" : "text-white/40"
      )}>
        {label}
      </span>

      {jogador ? (
        <div
          draggable
          onDragStart={onDragStart}
          className="flex flex-col items-center cursor-grab active:cursor-grabbing active:scale-110 transition-transform duration-150 group"
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-md border-2 border-white/80 text-white z-10",
            bgCor,
            isSacador && "ring-2 ring-yellow-300 ring-offset-1 ring-offset-transparent"
          )}>
            {jogador.numeroCamisa ?? "?"}
          </div>
          <span className="text-[9px] text-white font-bold mt-1 truncate max-w-[52px] px-1 text-center bg-black/30 rounded py-0.5">
            {jogador.nomeJogador.split(" ")[0]}
          </span>
        </div>
      ) : (
        <span className="text-[9px] text-white/25 select-none">vazio</span>
      )}
    </div>
  );
}

// ─── Quadra de uma equipe (meia-quadra) com drag-and-drop ────────────────────
function MeiaQuadra({
  esc,
  jogadores,
  isCasa,
  titulo,
  onChange,
}: {
  esc: EscalacaoTime;
  jogadores: JogadorPartida[];
  isCasa: boolean;
  titulo: string;
  onChange: (next: EscalacaoTime) => void;
}) {
  const drag = useRef<{ from: IndicePosicao | "banco"; jogadorId: string } | null>(null);
  const [overBanco, setOverBanco] = useState(false);
  const corText  = isCasa ? "text-emerald-700" : "text-orange-700";
  const ordem    = isCasa ? ORDEM_CASA : ORDEM_VISITANTE;
  const labelMap = isCasa ? LABEL_CASA : LABEL_VIS;

  const getJogador = (indice: IndicePosicao) => {
    const t = esc.titulares.find(t => t.indicePosicao === indice);
    if (!t) return undefined;
    return jogadores.find(j => j.jogadorId === t.jogadorId);
  };

  const handleDropSlot = (toIndice: IndicePosicao) => {
    if (!drag.current) return;
    const { from, jogadorId } = drag.current;
    drag.current = null;

    const novosTitulares = esc.titulares.map(t => ({ ...t }));
    const novoBanco = [...esc.banco];

    if (from === "banco") {
      const bancIdx = novoBanco.indexOf(jogadorId);
      if (bancIdx === -1) return;
      const titularNoSlot = novosTitulares.find(t => t.indicePosicao === toIndice);
      if (titularNoSlot) {
        // Troca: titular vai pro banco, reserva entra
        novoBanco.splice(bancIdx, 1);
        novoBanco.push(titularNoSlot.jogadorId);
        titularNoSlot.jogadorId = jogadorId;
      } else {
        // Slot vazio: entra direto
        novoBanco.splice(bancIdx, 1);
        novosTitulares.push({ jogadorId, indicePosicao: toIndice });
      }
    } else {
      // Quadra → quadra: troca posições
      const tFrom = novosTitulares.find(t => t.indicePosicao === from);
      const tTo   = novosTitulares.find(t => t.indicePosicao === toIndice);
      if (tFrom && tTo) {
        const tmp = tFrom.jogadorId;
        tFrom.jogadorId = tTo.jogadorId;
        tTo.jogadorId = tmp;
      } else if (tFrom) {
        tFrom.indicePosicao = toIndice;
      }
    }

    onChange({ ...esc, titulares: novosTitulares, banco: novoBanco });
  };

  const handleDropBanco = () => {
    setOverBanco(false);
    if (!drag.current || drag.current.from === "banco") return;
    const { jogadorId } = drag.current;
    drag.current = null;
    const novosTitulares = esc.titulares.filter(t => t.jogadorId !== jogadorId);
    const novoBanco = [...esc.banco, jogadorId];
    onChange({ ...esc, titulares: novosTitulares, banco: novoBanco });
  };

  // Jogadores não alocados em nenhum lugar ainda
  const alocados = new Set([...esc.titulares.map(t => t.jogadorId), ...esc.banco]);
  const naoAlocados = jogadores.filter(j => !alocados.has(j.jogadorId));

  // Grid da quadra — idêntico ao componente Quadra.tsx
  const gridClass = isCasa
    ? "grid-cols-[2fr_1fr]"
    : "grid-cols-[1fr_2fr]";

  return (
    <div className="flex flex-col gap-2">
      <p className={cn("text-[10px] font-bold uppercase tracking-widest text-center", corText)}>
        {titulo}
        <span className={cn(
          "ml-1.5 font-black text-[10px] px-1.5 py-0.5 rounded-full",
          esc.titulares.length === 6
            ? isCasa ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
            : "bg-muted text-muted-foreground"
        )}>
          {esc.titulares.length}/6
        </span>
      </p>

      {/* ── Quadra idêntica ao Quadra.tsx ── */}
      <div
        className="rounded-xl border-4 border-white overflow-hidden shadow-sm relative"
        style={{ background: "#E89D78" }}
      >
        {/* Rede (borda lateral interna — igual ao componente original) */}
        {isCasa ? (
          <div className="absolute top-0 bottom-0 right-0 w-[3px] bg-white z-20 shadow-[0_0_6px_rgba(0,0,0,0.4)]">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-white absolute -top-1 -left-[5px]" />
            <div className="w-3 h-3 rounded-full bg-red-500 border border-white absolute -bottom-1 -left-[5px]" />
          </div>
        ) : (
          <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-white z-20 shadow-[0_0_6px_rgba(0,0,0,0.4)]">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-white absolute -top-1 -right-[5px]" />
            <div className="w-3 h-3 rounded-full bg-red-500 border border-white absolute -bottom-1 -right-[5px]" />
          </div>
        )}

        {/* Linha dos 3 metros */}
        <div className={cn(
          "absolute top-0 bottom-0 w-[2px] bg-white/50 z-0",
          isCasa ? "right-[33.33%]" : "left-[33.33%]"
        )} />

        <div className={cn("grid grid-rows-3 p-1 relative z-10", gridClass)}>
          {ordem.map((indice) => (
            <Slot
              key={indice}
              indicePosicao={indice}
              jogador={getJogador(indice)}
              isCasa={isCasa}
              label={labelMap[indice] ?? ""}
              onDragStart={() => { drag.current = { from: indice, jogadorId: getJogador(indice)?.jogadorId ?? "" }; }}
              onDrop={() => handleDropSlot(indice)}
            />
          ))}
        </div>
      </div>

      {/* ── Banco ── */}
      <div
        className={cn(
          "rounded-xl border-2 border-dashed p-2 min-h-[44px] transition-all",
          overBanco ? "border-primary/60 bg-primary/5" : "border-border bg-muted/20"
        )}
        onDragOver={(e) => { e.preventDefault(); setOverBanco(true); }}
        onDragLeave={() => setOverBanco(false)}
        onDrop={(e) => { e.preventDefault(); handleDropBanco(); }}
      >
        <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Banco ({esc.banco.length}) — arraste aqui para reservar
        </p>
        <div className="flex flex-wrap gap-1">
          {esc.banco.map(id => {
            const j = jogadores.find(jj => jj.jogadorId === id);
            if (!j) return null;
            return (
              <div
                key={id}
                draggable
                onDragStart={() => { drag.current = { from: "banco", jogadorId: id }; }}
                className="flex items-center gap-1 bg-card border border-border rounded px-1.5 py-0.5 cursor-grab active:cursor-grabbing text-[10px] font-semibold text-foreground"
              >
                <GripVertical className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="font-mono font-black text-muted-foreground">#{j.numeroCamisa ?? "–"}</span>
                <span>{j.nomeJogador.split(" ")[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Não alocados ── */}
      {naoAlocados.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-2">
          <p className="text-[8px] font-bold uppercase tracking-widest text-amber-700 mb-1">
            Ainda não posicionados ({naoAlocados.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {naoAlocados.map(j => (
              <div
                key={j.jogadorId}
                draggable
                onDragStart={() => { drag.current = { from: "banco", jogadorId: j.jogadorId }; }}
                className="flex items-center gap-1 bg-white border border-amber-200 rounded px-1.5 py-0.5 cursor-grab active:cursor-grabbing text-[10px] font-semibold text-amber-800"
              >
                <GripVertical className="h-2.5 w-2.5 text-amber-400" />
                <span className="font-mono font-black">#{j.numeroCamisa ?? "–"}</span>
                <span>{j.nomeJogador.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal Principal ──────────────────────────────────────────────────────────
export function ModalEscalacao({
  aberto,
  indiceSet,
  timeCasaId,
  timeVisitanteId,
  nomeTimeCasa,
  nomeTimeVisitante,
  jogadores,
  escalacaoAnterior,
  aoConfirmar,
  aoFechar,
}: ModalEscalacaoProps) {
  const jCasa = jogadores.filter(j => j.timeId === timeCasaId);
  const jVis  = jogadores.filter(j => j.timeId === timeVisitanteId);

  const [escCasa, setEscCasa] = useState<EscalacaoTime>(() =>
    escalacaoAnterior?.casa ?? montarEscalacaoPadrao(timeCasaId, jCasa)
  );
  const [escVis, setEscVis] = useState<EscalacaoTime>(() =>
    escalacaoAnterior?.visitante ?? montarEscalacaoPadrao(timeVisitanteId, jVis)
  );
  const [equipeQueIniciaSaque, setEquipeQueIniciaSaque] = useState<"CASA" | "VISITANTE">("CASA");

  useEffect(() => {
    if (!aberto) return;
    setEscCasa(escalacaoAnterior?.casa ?? montarEscalacaoPadrao(timeCasaId, jCasa));
    setEscVis(escalacaoAnterior?.visitante ?? montarEscalacaoPadrao(timeVisitanteId, jVis));
    setEquipeQueIniciaSaque("CASA");
  }, [aberto, indiceSet]);

  if (!aberto) return null;

  const casaOk = escCasa.titulares.length === 6;
  const visOk  = escVis.titulares.length === 6;
  const canConfirm = casaOk && visOk;

  const handleConfirmar = () => {
    aoConfirmar({
      indiceSet,
      casa:      { ...escCasa,  indicePosicaoSaque: 1 },
      visitante: { ...escVis,   indicePosicaoSaque: 1 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-4 px-3">
      <div className="w-full max-w-3xl bg-background rounded-2xl border border-border shadow-2xl overflow-hidden my-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Escalação — Set {indiceSet + 1}
              </h2>
              <p className="text-xs text-muted-foreground">
                Arraste as fichas para posicionar os jogadores · <span className="text-yellow-600 font-semibold">1●</span> = sacador
              </p>
            </div>
          </div>
          <button onClick={aoFechar} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">

          {/* Quem inicia o saque — apenas entre equipes */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2.5 text-center">
              🏐 Quem começa sacando?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setEquipeQueIniciaSaque("CASA")}
                className={cn(
                  "py-2.5 rounded-xl border-2 font-bold text-sm transition-all",
                  equipeQueIniciaSaque === "CASA"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                {nomeTimeCasa}
                <span className="block text-[10px] font-normal opacity-70">Casa</span>
              </button>
              <button
                onClick={() => setEquipeQueIniciaSaque("VISITANTE")}
                className={cn(
                  "py-2.5 rounded-xl border-2 font-bold text-sm transition-all",
                  equipeQueIniciaSaque === "VISITANTE"
                    ? "bg-orange-500 text-white border-orange-500 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                {nomeTimeVisitante}
                <span className="block text-[10px] font-normal opacity-70">Visitante</span>
              </button>
            </div>
          </div>

          {/* Quadras lado a lado — idênticas ao visual da partida ao vivo */}
          <div className="grid grid-cols-2 gap-4">
            <MeiaQuadra
              esc={escCasa}
              jogadores={jCasa}
              isCasa={true}
              titulo={nomeTimeCasa}
              onChange={setEscCasa}
            />
            <MeiaQuadra
              esc={escVis}
              jogadores={jVis}
              isCasa={false}
              titulo={nomeTimeVisitante}
              onChange={setEscVis}
            />
          </div>

          {/* Aviso de validação */}
          {!canConfirm && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
              {!casaOk && `${nomeTimeCasa}: posicione mais ${6 - escCasa.titulares.length} jogador(es) na quadra. `}
              {!visOk  && `${nomeTimeVisitante}: posicione mais ${6 - escVis.titulares.length} jogador(es) na quadra.`}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/10">
          <Button variant="outline" onClick={aoFechar} className="h-10">Cancelar</Button>
          <Button
            onClick={handleConfirmar}
            disabled={!canConfirm}
            className="gap-2 h-10 px-8 font-bold"
          >
            <CheckCircle2 className="h-4 w-4" /> Iniciar Set {indiceSet + 1}
          </Button>
        </div>
      </div>
    </div>
  );
}