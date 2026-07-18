import {
    PerfilUsuario,
    StatusTorneio,
    StatusPartida,
    VisibilidadeTorneio,
    LadoPonto,
    TipoPonto,
    TipoCartao,
    TipoErro,
    FormatoTorneio,
    FormatoFase,
    ModoFormacaoTimes,
    CriterioSorteio,
    ModoGeracaoPartidas
} from './types';

export interface AuthUser {
    id: string;
    nome: string;
    email: string;
    perfil: PerfilUsuario;
}

export interface Torneio {
    id: string;
    nome: string;
    descricao?: string;
    local?: string;
    dataInicio?: string;
    dataFim?: string;
    status?: StatusTorneio;
    visibilidade?: VisibilidadeTorneio;
    bannerUrl?: string;
    logoUrl?: string;
    tokenConvite?: string;
    organizadores?: { usuarioId: string }[];
    podeGerenciar?: boolean;
}

export interface Time {
    id: string;
    torneioId: string;
    faseId?: string | null;
    nome: string;
    logoUrl?: string;
    tokenConvite?: string;
    quantidadeJogadores?: number;
    corPrimaria?: string;
    corSecundaria?: string;
    email?: string;
    telefone?: string;
    instagram?: string;
    whatsapp?: string;
    facebook?: string;
    site?: string;
}

export interface Jogador {
    id: string;
    timeId?: string | null;
    usuarioId?: string;
    nome: string;
    numeroCamisa?: number;
    posicao?: string;
    fotoUrl?: string;
    entrouPorLink?: boolean;
    titular?: boolean;
    indicePosicao?: number | null;
    notaHabilidade?: number | null;
    criadoEm?: string;
}

export interface JogadorPartida {
    id: string;
    partidaId: string;
    jogadorId: string;
    timeId: string;
    nomeJogador: string;
    numeroCamisa?: number;
    posicao?: string;
    titular: boolean;
    indicePosicao?: number | null;
}

export interface EventoPartida {
    id: string;
    partidaId: string;
    indiceSet: number;
    lado: LadoPonto;
    tipo: TipoPonto;
    tipoErro?: TipoErro;
    tipoCartao?: TipoCartao;
    jogadorId?: string;
    jogadorNome?: string;
    placarCasa: number;
    placarVisitante: number;
    horario: string;
    anulado?: boolean;
    quadraCasaAntes?: string[];
    quadraVisitanteAntes?: string[];
    quadraCasaDepois?: string[];
    quadraVisitanteDepois?: string[];
    sacadorAntes?: LadoPonto;
    sacadorDepois?: LadoPonto;
}

export interface EscalacaoTimeApi {
    id: string;
    partidaId: string;
    indiceSet: number;
    timeId: string;
    titulares: { jogadorId: string; indicePosicao: number }[];
    banco: string[];
    indicePosicaoSaque: number;
    sacaPrimeiro: boolean;
}

export interface SubstituicaoApi {
    id: string;
    partidaId: string;
    indiceSet: number;
    timeId: string;
    idJogadorSaindo: string;
    nomeJogadorSaindo: string;
    numeroJogadorSaindo?: number;
    idJogadorEntrando: string;
    nomeJogadorEntrando: string;
    numeroJogadorEntrando?: number;
    indicePosicao: number;
    placarCasa: number;
    placarVisitante: number;
    criadoEm: string;
}

export interface Partida {
    id: string;
    torneioId: string;
    timeCasaId: string;
    timeVisitanteId: string;
    nomeTimeCasa: string;
    nomeTimeVisitante: string;
    status: StatusPartida;
    agendadoPara?: string;
    local?: string;
    setsCasa: number;
    setsVisitante: number;
    setAtualCasa: number;
    setAtualVisitante: number;
    sets: { casa: number; visitante: number }[];
    pontosParaVencerSet: number;
    pontosParaVencerUltimoSet: number;
    setsParaVencerPartida: number;
    titularesPorTime: number;
}

export interface RegrasTorneio {
    id?: string | null;
    torneioId: string;
    setsParaVencer: number;
    pontosPorSet: number;
    pontosTieBreak: number;
    vantagemDoisPontos: boolean;
    limiteJogadoresPorTime: number;
}

export interface OrganizadorTorneio {
    id: string;
    usuarioId: string;
    nome: string;
    email: string;
}

export interface ConfiguracaoRacha {
    id: string;
    faseId: string;
    modoFormacaoTimes: ModoFormacaoTimes;
    criterioSorteio: CriterioSorteio;
    modoGeracaoPartidas: ModoGeracaoPartidas;
    jogadoresPorTime: number;
    vitoriasSeguidasParaSair: number;
}

export interface FaseTorneio {
    id: string;
    torneioId: string;
    tipo: FormatoTorneio | FormatoFase;
    ordem: number;
    nome?: string | null;
    configuracaoRacha?: ConfiguracaoRacha | null;
}

export interface PoolJogadorRacha {
    id: string;
    faseId: string;
    jogadorId: string;
    alocado: boolean;
    jogador: Jogador;
}

export interface FilaRachaEstado {
    id: string;
    faseId: string;
    timeDefensorId?: string | null;
    vitoriasSeguidas: number;
    timesAguardando: string[];
    partidaAtualId?: string | null;
}

export interface TorneioCtx {
    torneio: Torneio;
    setTorneio: (t: Torneio) => void;
    torneioId: string;
    liveCount: number;
    canManage: boolean;
    faseRacha?: FaseTorneio | null;
}