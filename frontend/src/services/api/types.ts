export type LadoPonto =
    | "CASA"
    | "VISITANTE";

export type TipoPonto =
    | "SAQUE"
    | "ATAQUE"
    | "BLOQUEIO"
    | "ERRO_ADVERSARIO"
    | "CARTAO_ADVERSARIO";

export type TipoCartao =
    | "AMARELO"
    | "VERMELHO";

export type TipoErro =
    | "ERRO_SAQUE"
    | "TOQUE_REDE"
    | "DOIS_TOQUES"
    | "QUATRO_TOQUES"
    | "INVASAO"
    | "BOLA_FORA"
    | "CONDUCAO"
    | "ERRO_ROTACAO";

export type PerfilUsuario =
    | "ADMIN"
    | "GERENTE"
    | "USUARIO";

export type StatusTorneio =
    | "RASCUNHO"
    | "ABERTO"
    | "EM_ANDAMENTO"
    | "FINALIZADO";

export type StatusPartida =
    | "AGENDADA"
    | "AQUECIMENTO"
    | "AO_VIVO"
    | "FINALIZADA";

export type VisibilidadeTorneio =
    | "PUBLICO"
    | "SOMENTE_PARTICIPANTES"
    | "PRIVADO";

export type FormatoTorneio =
    | "RACHA"
    | "MATA_MATA"
    | "PONTOS_CORRIDOS";

export type FormatoFase =
    | "RACHA"
    | "MATA_MATA"
    | "PONTOS_CORRIDOS"; 

export type ModoFormacaoTimes =
    | "MANUAL"
    | "POOL_SORTEIO";

export type CriterioSorteio =
    | "ALEATORIO"
    | "NOTA";
    
export type ModoGeracaoPartidas =
    | "AUTOMATICO"
    | "MANUAL";


