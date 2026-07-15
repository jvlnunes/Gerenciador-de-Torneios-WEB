import { cn } from "@/services/utils";
import { X, Flag, AlertTriangle } from "lucide-react";
import type { LadoPonto, TipoErro, TipoCartao } from "@/services/api/types";
import { JogadorPartida } from "@/services/api/interfaces";
import { ACOES_POSITIVAS, TIPOS_ERRO, type ActionDef } from "../utils/LogicaPartida";

export type EscolhaAcao =
  | { kind: "ponto"; acao: ActionDef }
  | { kind: "erro"; tipoErro: TipoErro }
  | { kind: "cartao"; tipoCartao: TipoCartao };

interface PainelAcaoJogadorProps {
  jogador: JogadorPartida | null;
  lado: LadoPonto | null;
  nomeTime?: string;
  timeJaTemAmarelo?: boolean;
  onEscolher: (escolha: EscolhaAcao) => void;
  onLimparSelecao: () => void;
}

export function PainelAcaoJogador({
  jogador,
  lado,
  nomeTime,
  timeJaTemAmarelo,
  onEscolher,
  onLimparSelecao,
}: PainelAcaoJogadorProps) {
  const temSelecao = !!jogador && !!lado;

  const corTime = lado === "CASA" ? "emerald" : "orange";
  const corBg = corTime === "emerald" ? "bg-emerald-50 border-emerald-200" : "bg-orange-50 border-orange-200";
  const corTexto = corTime === "emerald" ? "text-emerald-700" : "text-orange-600";
  const corBtnAtivo =
    corTime === "emerald"
      ? "bg-emerald-50 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100 text-emerald-700"
      : "bg-orange-50 border-orange-100 hover:border-orange-300 hover:bg-orange-100 text-orange-700";

  return (
    <div className="h-full flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Cabeçalho do jogador selecionado (ou placeholder) */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 border-b transition-colors",
          temSelecao ? corBg : "bg-gray-50 border-gray-200"
        )}
      >
        <span
          className={cn(
            "w-9 h-9 rounded-lg font-mono text-sm font-black flex items-center justify-center shrink-0 shadow-sm",
            temSelecao ? "bg-white" : "bg-gray-200 text-gray-400"
          )}
        >
          {temSelecao ? (jogador!.numeroCamisa ?? "–") : "?"}
        </span>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-black truncate", temSelecao ? "text-gray-900" : "text-gray-400")}>
            {temSelecao ? jogador!.nomeJogador : "Nenhum jogador selecionado"}
          </p>
          <p className={cn("text-[10px] font-bold uppercase tracking-widest truncate", temSelecao ? corTexto : "text-gray-400")}>
            {temSelecao ? (nomeTime ?? lado) : "Toque em um atleta na quadra"}
          </p>
        </div>
        {temSelecao && (
          <button
            onClick={onLimparSelecao}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className={cn("flex-1 overflow-y-auto p-4 space-y-4", !temSelecao && "opacity-50 pointer-events-none select-none")}>
        {/* Ações positivas */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Pontos</p>
          <div className="grid grid-cols-3 gap-2">
            {ACOES_POSITIVAS.map((a) => (
              <button
                key={a.type}
                disabled={!temSelecao}
                onClick={() => onEscolher({ kind: "ponto", acao: a })}
                className={cn(
                  "group rounded-xl border transition-all p-3 flex flex-col items-center justify-center gap-1 shadow-sm",
                  temSelecao ? cn("hover:shadow-md", corBtnAtivo) : "border-gray-200 bg-gray-50 text-gray-400"
                )}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{a.emoji}</span>
                <span className="text-[10px] font-black uppercase tracking-wider">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Erros — seção separada, sempre visível */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
            <Flag className="h-3 w-3" /> Erros 
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS_ERRO.map((e) => (
              <button
                key={e.tipoErro}
                disabled={!temSelecao}
                onClick={() => onEscolher({ kind: "erro", tipoErro: e.tipoErro })}
                className={cn(
                  "text-left text-[11px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-xl border transition-all",
                  temSelecao
                    ? "border-gray-200 bg-gray-50 text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                    : "border-gray-200 bg-gray-50 text-gray-400"
                )}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cartão */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" /> Sanção
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={!temSelecao || timeJaTemAmarelo}
              onClick={() => onEscolher({ kind: "cartao", tipoCartao: "AMARELO" })}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left",
                !temSelecao || timeJaTemAmarelo
                  ? "opacity-60 cursor-not-allowed grayscale border-gray-200 bg-gray-50"
                  : "border-gray-200 hover:border-yellow-300 hover:bg-yellow-50"
              )}
            >
              <div className="w-4 h-6 rounded shrink-0 shadow-sm border border-black/10 bg-yellow-400" />
              <span className="text-xs font-bold text-gray-700">Amarelo</span>
            </button>
            <button
              disabled={!temSelecao}
              onClick={() => onEscolher({ kind: "cartao", tipoCartao: "VERMELHO" })}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left",
                temSelecao
                  ? "border-gray-200 hover:border-red-300 hover:bg-red-50"
                  : "border-gray-200 bg-gray-50"
              )}
            >
              <div className="w-4 h-6 rounded shrink-0 shadow-sm border border-black/10 bg-red-500" />
              <span className="text-xs font-bold text-gray-700">Vermelho</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}