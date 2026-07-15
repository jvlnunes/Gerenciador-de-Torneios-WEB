import { PerfilUsuario, StatusTorneio, StatusPartida, VisibilidadeTorneio, LadoPonto, TipoPonto, TipoCartao, TipoErro } from './types.ts';

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
    timeId: string;
    usuarioId?: string;
    nome: string;
    numeroCamisa?: number;
    posicao?: string;
    fotoUrl?: string;
    entrouPorLink?: boolean;
    titular?: boolean;
    indicePosicao?: number | null;
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
