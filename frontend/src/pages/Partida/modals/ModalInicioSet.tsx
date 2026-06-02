import { useState } from "react";
import { JogadorPartida, LadoPonto } from "@/services/api";
import { cn } from "@/services/utils";
import { CheckCircle2, Play } from "lucide-react";

export interface SetStartModalProps {
  setNum: number;
  jCasa: JogadorPartida[];
  jVis: JogadorPartida[];
  nomeCasa: string;
  nomeVis: string;
  maxTitulares: number;
  onConfirm: (titularesCasa: string[], titularesVis: string[], saqueInicial: LadoPonto) => void;
  onClose: () => void;
}

export function SetStartModal({
  setNum, jCasa, jVis, nomeCasa, nomeVis, maxTitulares, onConfirm, onClose,
}: SetStartModalProps) {
  const [selCasa, setSelCasa] = useState<Set<string>>(new Set(jCasa.map((j) => j.jogadorId).slice(0, maxTitulares)));
  const [selVis, setSelVis] = useState<Set<string>>(new Set(jVis.map((j) => j.jogadorId).slice(0, maxTitulares)));
  const [saqueInicial, setSaqueInicial] = useState<LadoPonto | null>(null);

  const togglePlayer = (id: string, sel: Set<string>, setSel: (s: Set<string>) => void) => {
    const next = new Set(sel);
    if (next.has(id)) next.delete(id);
    else if (next.size < maxTitulares) next.add(id);
    setSel(next);
  };

  const canConfirm = selCasa.size === maxTitulares && selVis.size === maxTitulares && saqueInicial !== null;

  const PlayerList = ({ jogadores, sel, setSel, cor }: { jogadores: JogadorPartida[]; sel: Set<string>; setSel: (s: Set<string>) => void; cor: "emerald" | "orange"; }) => (
    <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
      {jogadores.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Nenhum jogador cadastrado</p>}
      {jogadores.map((j) => {
        const active = sel.has(j.jogadorId);
        return (
          <button
            key={j.id}
            onClick={() => togglePlayer(j.jogadorId, sel, setSel)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all",
              active ? (cor === "emerald" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-orange-300 bg-orange-50 text-orange-900")
                     : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
            )}
          >
            <span className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center font-mono text-sm font-black shrink-0",
              active ? (cor === "emerald" ? "bg-emerald-200 text-emerald-800" : "bg-orange-200 text-orange-800")
                     : "bg-gray-100 text-gray-500"
            )}>
              {j.numeroCamisa ?? "–"}
            </span>
            <span className="text-sm font-semibold flex-1 truncate">{j.nomeJogador}</span>
            {j.posicao && <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0">{j.posicao.slice(0, 3)}</span>}
            {active && <CheckCircle2 className={cn("h-4 w-4 shrink-0", cor === "emerald" ? "text-emerald-600" : "text-orange-600")} />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <div>
            <h2 className="font-display font-black text-xl text-gray-900">Preparação - Set {setNum}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Escale {maxTitulares} titulares e defina o saque inicial</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center text-lg transition-colors">×</button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* SEÇÃO 1: ESCOLHA DO SAQUE INICIAL */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-800 mb-3 text-center">Quem começa sacando?</h3>
            <div className="flex gap-3">
              <button 
                onClick={() => setSaqueInicial("CASA")}
                className={cn("flex-1 py-3 rounded-lg border font-bold transition-all", saqueInicial === "CASA" ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50")}
              >
                {nomeCasa}
              </button>
              <button 
                onClick={() => setSaqueInicial("VISITANTE")}
                className={cn("flex-1 py-3 rounded-lg border font-bold transition-all", saqueInicial === "VISITANTE" ? "bg-orange-500 text-white border-orange-500 shadow-md" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50")}
              >
                {nomeVis}
              </button>
            </div>
          </div>

          {/* SEÇÃO 2: ESCALAÇÃO */}
          <div className="grid grid-cols-2 divide-x divide-gray-100 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-emerald-700 uppercase tracking-wider">{nomeCasa}</h3>
                <span className={cn("text-xs font-black px-2 py-0.5 rounded-full", selCasa.size === maxTitulares ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                  {selCasa.size}/{maxTitulares}
                </span>
              </div>
              <PlayerList jogadores={jCasa} sel={selCasa} setSel={setSelCasa} cor="emerald" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-orange-600 uppercase tracking-wider">{nomeVis}</h3>
                <span className={cn("text-xs font-black px-2 py-0.5 rounded-full", selVis.size === maxTitulares ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500")}>
                  {selVis.size}/{maxTitulares}
                </span>
              </div>
              <PlayerList jogadores={jVis} sel={selVis} setSel={setSelVis} cor="orange" />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">Cancelar</button>
          <button
            onClick={() => onConfirm([...selCasa], [...selVis], saqueInicial!)}
            disabled={!canConfirm}
            className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow", canConfirm ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200" : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none")}
          >
            <Play className="h-4 w-4" /> Iniciar Timer e Set
          </button>
        </div>
      </div>
    </div>
  );
}