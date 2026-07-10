import { cn } from "@/services/utils";
import { JogadorPartida } from "@/services/api/interfaces";
import type { LadoPonto } from "@/services/api/types";

interface QuadraProps {
  jCasa: JogadorPartida[];
  jVisit: JogadorPartida[];
  sacador: LadoPonto;
  rotCasa?: number;
  rotVisit?: number;
  podeClicar?: boolean;
  jogadorSelecionadoId?: string;
  onJogadorClick?: (jogador: JogadorPartida, lado: LadoPonto) => void;
}

export function Quadra({
  jCasa,
  jVisit,
  sacador,
  podeClicar = false,
  jogadorSelecionadoId,
  onJogadorClick,
}: QuadraProps) {
  const getJogador = (j: JogadorPartida[], vSlot: number) => {
    return j[vSlot - 1] ?? null;
  };

  const Slot = ({ lado, vSlot, cor }: { lado: LadoPonto; vSlot: number; cor: string }) => {
    const j = getJogador(lado === "CASA" ? jCasa : jVisit, vSlot);
    const bgCor = cor === "primary" ? "bg-emerald-600 text-white" : "bg-orange-500 text-white";

    const isSacando = sacador === lado && vSlot === 1;
    const isSelecionado = j && j.jogadorId === jogadorSelecionadoId;
    const isClicavel = podeClicar && !!j;

    return (
      <div
        onClick={() => isClicavel && j && onJogadorClick?.(j, lado)}
        className={cn(
          "relative flex flex-col items-center justify-center min-h-[65px] z-10 transition-all duration-300 group",
          isClicavel && "cursor-pointer hover:scale-110 hover:-translate-y-1",
          !isClicavel && "cursor-default",
          isSelecionado && "scale-110 -translate-y-1"
        )}
      >
        <span className="absolute top-1 left-1.5 text-[9px] font-black text-white/50">{vSlot}</span>
        {j && (
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-md border-2 border-white z-10 transition-all",
              bgCor,
              isClicavel && "group-hover:shadow-lg",
              isSacando && "ring-3 ring-green-300 shadow-xl scale-110",
              isSelecionado && "ring-4 ring-yellow-300 shadow-xl"
            )}
          >
            {j.numeroCamisa ?? "?"}
          </div>
        )}
        {j && (
          <span
            className={cn(
              "text-[10px] text-gray-800 font-bold mt-1.5 truncate max-w-[90%] px-1.5 text-center backdrop-blur-sm rounded-md py-0.5 shadow-sm transition-colors",
              isSelecionado ? "bg-yellow-200/90" : "bg-white/80"
            )}
          >
            {j.nomeJogador.split(" ")[0]}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#E89D78] rounded-xl border-4 border-white relative flex overflow-hidden aspect-[1.8/1] shadow-sm max-w-lg mx-auto">
      {/* Antenas / Rede */}
      <div className="absolute top-0 bottom-0 left-1/2 w-1.5 bg-white -translate-x-1/2 z-20 flex flex-col justify-between items-center py-1">
        <div className="w-3.5 h-3.5 bg-red-500 rounded-full absolute -top-1.5 border border-white" />
        <div className="w-3.5 h-3.5 bg-red-500 rounded-full absolute -bottom-1.5 border border-white" />
      </div>

      {/* Time da CASA */}
      <div className="flex-1 grid grid-cols-[2fr_1fr] grid-rows-3 relative">
        <div className="absolute top-0 bottom-0 right-[33.33%] w-[2px] bg-white/60 z-0" />
        <Slot lado="CASA" vSlot={5} cor="primary" /> <Slot lado="CASA" vSlot={4} cor="primary" />
        <Slot lado="CASA" vSlot={6} cor="primary" /> <Slot lado="CASA" vSlot={3} cor="primary" />
        <Slot lado="CASA" vSlot={1} cor="primary" /> <Slot lado="CASA" vSlot={2} cor="primary" />
      </div>

      {/* Time VISITANTE */}
      <div className="flex-1 grid grid-cols-[1fr_2fr] grid-rows-3 relative">
        <div className="absolute top-0 bottom-0 left-[33.33%] w-[2px] bg-white/60 z-0" />
        <Slot lado="VISITANTE" vSlot={2} cor="amber" /> <Slot lado="VISITANTE" vSlot={1} cor="amber" />
        <Slot lado="VISITANTE" vSlot={3} cor="amber" /> <Slot lado="VISITANTE" vSlot={6} cor="amber" />
        <Slot lado="VISITANTE" vSlot={4} cor="amber" /> <Slot lado="VISITANTE" vSlot={5} cor="amber" />
      </div>
    </div>
  );
}