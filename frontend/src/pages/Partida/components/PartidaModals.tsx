import { AlertTriangle } from "lucide-react";
import type { LadoPonto, TipoCartao, TipoErro } from "@/services/api/types";
import type { Partida, JogadorPartida } from "@/services/api/interfaces";
import { ActionDef } from "../utils/LogicaPartida";
import type { EscalacaoSet } from "./Escalacao";

import { ModalAcao } from "../modals/ModalAcao";
import { ModalConfiguracao } from "../modals/ModalConfiguracao";
import { ModalCartao } from "../modals/ModalCartao";
import { ModalEscalacao } from "../modals/ModalEscalacao";
import { ModalSubstituicao } from "../modals/ModalSubstituicao";

interface ConfigModalProps {
  aberto: boolean;
  configTimer: boolean;
  setConfigTimer: (v: boolean) => void;
  configAutoSaque: boolean;
  setConfigAutoSaque: (v: boolean) => void;
  onClose: () => void;
}

interface CartaoModalProps {
  lado: LadoPonto | null;
  partida: Partida;
  jogadoresDoLado: (lado: LadoPonto) => JogadorPartida[];
  timeJaTemAmarelo: (lado: LadoPonto) => boolean;
  onRegistrar: (jogadorId: string, tipoCartao: TipoCartao, lado: LadoPonto) => void;
  onClose: () => void;
}

interface AlertaModalProps {
  alerta: { msg: string; onOk: () => void } | null;
  onCancelar: () => void;
}

interface AcaoModalProps {
  modal: { lado: LadoPonto; acao: ActionDef } | null;
  partida: Partida;
  jogadores: JogadorPartida[];
  sacadorAtual: LadoPonto;
  idSacador?: string;
  onRegistrar: (acao: ActionDef, lado: LadoPonto, jogadorId?: string, tipoErro?: TipoErro) => void;
  onClose: () => void;
}

interface EscalacaoModalProps {
  aberto: boolean;
  indiceSet: number;
  partida: Partida;
  jogadores: JogadorPartida[];
  escalacaoAnterior?: EscalacaoSet;
  aoConfirmar: (escalacao: EscalacaoSet) => void;
  aoFechar: () => void;
}

interface SubstituicaoModalProps {
  aberto: boolean;
  timeSubId: string | null;
  indiceSet: number;
  partida: Partida;
  titularesCasaList: JogadorPartida[];
  titularesVisList: JogadorPartida[];
  reservasCasaAtivos: JogadorPartida[];
  reservasVisAtivos: JogadorPartida[];
  obterSubstituicoesDoSet: (timeId: string, indiceSet: number) => any[];
  aoConfirmar: (sub: any) => void;
  aoFechar: () => void;
  rotCasa: number;
  rotVisit: number;
}

export type AlertaConfirmacao = {
  msg: string;
  onOk?: () => void | Promise<void>;
};

export interface PartidaModalsProps {
  config: ConfigModalProps;
  cartao: CartaoModalProps;
  alerta: AlertaModalProps;
  acao: AcaoModalProps;
  escalacao: EscalacaoModalProps;
  substituicao: SubstituicaoModalProps;
}

export function PartidaModals({ config, cartao, alerta, acao, escalacao, substituicao }: PartidaModalsProps) {
  return (
    <>
      {config.aberto && (
        <ModalConfiguracao
          configTimer={config.configTimer}
          setConfigTimer={config.setConfigTimer}
          configAutoSaque={config.configAutoSaque}
          setConfigAutoSaque={config.setConfigAutoSaque}
          onClose={config.onClose}
        />
      )}

      {cartao.lado && (
        <ModalCartao
          lado={cartao.lado}
          nomeTime={cartao.lado === "CASA" ? cartao.partida.nomeTimeCasa : cartao.partida.nomeTimeVisitante}
          jogadores={cartao.jogadoresDoLado(cartao.lado)}
          timeJaTemAmarelo={cartao.timeJaTemAmarelo(cartao.lado)}
          onRegistrar={(id, tipoCartao) => cartao.onRegistrar(id, tipoCartao, cartao.lado!)}
          onClose={cartao.onClose}
        />
      )}

      {alerta.alerta && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95">
            <AlertTriangle className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="font-display font-black text-xl text-gray-900 leading-snug">{alerta.alerta.msg}</p>
            <div className="flex gap-3">
              <button
                onClick={alerta.onCancelar}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={alerta.alerta.onOk}
                className="flex-1 py-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {acao.modal && (
        <ModalAcao
          acao={acao.modal.acao}
          lado={acao.modal.lado}
          jogadores={acao.jogadores}
          partida={acao.partida}
          onRegistrar={(id, err) => acao.onRegistrar(acao.modal!.acao, acao.modal!.lado, id, err)}
          onClose={acao.onClose}
          ladoSaque={acao.sacadorAtual}
          idSacador={acao.idSacador}
        />
      )}

      {escalacao.aberto && (
        <ModalEscalacao
          aberto={escalacao.aberto}
          indiceSet={escalacao.indiceSet}
          timeCasaId={escalacao.partida.timeCasaId}
          timeVisitanteId={escalacao.partida.timeVisitanteId}
          nomeTimeCasa={escalacao.partida.nomeTimeCasa}
          nomeTimeVisitante={escalacao.partida.nomeTimeVisitante}
          jogadores={escalacao.jogadores}
          escalacaoAnterior={escalacao.escalacaoAnterior}
          aoConfirmar={escalacao.aoConfirmar}
          aoFechar={escalacao.aoFechar}
        />
      )}

      {substituicao.aberto && substituicao.timeSubId && (
        <ModalSubstituicao
          aberto={substituicao.aberto}
          indiceSet={substituicao.indiceSet}
          timeAtualId={substituicao.timeSubId}
          lado={substituicao.timeSubId === substituicao.partida.timeCasaId ? "CASA" : "VISITANTE"}
          nomeTimeAtual={
            substituicao.timeSubId === substituicao.partida.timeCasaId
              ? substituicao.partida.nomeTimeCasa
              : substituicao.partida.nomeTimeVisitante
          }
          titulares={
            substituicao.timeSubId === substituicao.partida.timeCasaId
              ? substituicao.titularesCasaList
              : substituicao.titularesVisList
          }
          banco={
            substituicao.timeSubId === substituicao.partida.timeCasaId
              ? substituicao.reservasCasaAtivos
              : substituicao.reservasVisAtivos
          }
          placarCasa={substituicao.partida.setAtualCasa}
          placarVisitante={substituicao.partida.setAtualVisitante}
          substituicoesNesteSet={substituicao.obterSubstituicoesDoSet(substituicao.timeSubId, substituicao.indiceSet)}
          aoConfirmar={substituicao.aoConfirmar}
          aoFechar={substituicao.aoFechar}
          // rotCasa={substituicao.rotCasa}
          // rotVisit={substituicao.rotVisit}
        />
      )}
    </>
  );
}