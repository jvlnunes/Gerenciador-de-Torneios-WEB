import { useState } from "react";
import { JogadorPartida, LadoPonto, TipoErro } from "@/services/api";
import { cn } from "@/services/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export interface ModalCartaoProps {
  lado: LadoPonto;
  nomeTime: string;
  jogadores: JogadorPartida[];
  timeJaTemAmarelo: boolean;
  onRegistrar: (jogadorId: string, tipoCartao: TipoErro) => void;
  onClose: () => void;
}

export function ModalCartao({
  lado, nomeTime, jogadores, timeJaTemAmarelo, onRegistrar, onClose
}: ModalCartaoProps) {
  const [jogadorId, setJogadorId] = useState<string>("");
  const [cartao, setCartao] = useState<TipoErro | null>(null);

  const cartoesDef = [
    { 
      id: "CARTAO_AMARELO" as TipoErro, 
      nome: "Amarelo (Advertência)", 
      desc: "Sem perda de ponto. Limite de 1 por equipe.", 
      cor: "bg-yellow-400",
      disabled: timeJaTemAmarelo 
    },
    { 
      id: "CARTAO_VERMELHO" as TipoErro, 
      nome: "Vermelho (Penalidade)", 
      desc: "Ponto e saque para o adversário.", 
      cor: "bg-red-500" 
    },
    { 
      id: "EXPULSAO" as TipoErro, 
      nome: "Amarelo + Vermelho Juntos", 
      desc: "Expulsão do Set atual. Substituição obrigatória.", 
      cor: "bg-gradient-to-r from-yellow-400 to-red-500" 
    },
    { 
      id: "DESQUALIFICACAO" as TipoErro, 
      nome: "Amarelo + Vermelho Separados", 
      desc: "Desqualificação da Partida. Substituição obrigatória.", 
      cor: "bg-gray-800" 
    }
  ];

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <AlertTriangle className="h-5 w-5 text-gray-700" />
          <div className="flex-1">
            <h2 className="font-display font-black text-lg text-gray-900">Aplicar Sanção</h2>
            <p className={cn("text-xs font-bold uppercase tracking-wider", lado === "CASA" ? "text-emerald-600" : "text-orange-500")}>
              {nomeTime}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center text-lg">×</button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* Escolha do Jogador */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">1. Selecione o Infrator</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {jogadores.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setJogadorId(j.jogadorId)}
                  className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all", jogadorId === j.jogadorId ? "border-gray-800 bg-gray-50 shadow-sm" : "border-gray-200 hover:bg-gray-50")}
                >
                  <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-display text-sm font-black transition-colors", jogadorId === j.jogadorId ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600")}>
                    {j.numeroCamisa ?? "–"}
                  </span>
                  <span className="text-sm font-bold text-gray-700 flex-1">{j.nomeJogador}</span>
                  {jogadorId === j.jogadorId && <CheckCircle2 className="h-4 w-4 text-gray-800 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Escolha do Cartão */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">2. Selecione a Sanção</p>
            <div className="grid gap-2">
              {cartoesDef.map((c) => (
                <button
                  key={c.id}
                  disabled={c.disabled}
                  onClick={() => setCartao(c.id)}
                  className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all text-left", c.disabled && "opacity-50 cursor-not-allowed grayscale", cartao === c.id ? "border-gray-800 ring-1 ring-gray-800 bg-gray-50" : "border-gray-200 hover:border-gray-300")}
                >
                  <div className={cn("w-6 h-8 rounded shrink-0 shadow-sm border border-black/10", c.cor)} />
                  <div>
                    <p className="text-sm font-bold text-gray-800">{c.nome}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{c.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button
            disabled={!jogadorId || !cartao}
            onClick={() => jogadorId && cartao && onRegistrar(jogadorId, cartao)}
            className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold transition-all shadow", jogadorId && cartao ? "bg-red-600 text-white hover:bg-red-700 shadow-red-200" : "bg-gray-200 text-gray-400 cursor-not-allowed")}
          >
            Aplicar Sanção
          </button>
        </div>
      </div>
    </div>
  );
}