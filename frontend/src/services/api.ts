const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
const TOKEN_KEY = "vb_token";
const USER_KEY = "vb_user";

export type PerfilUsuario = "ADMIN" | "GERENTE" | "USUARIO";

export type StatusTorneio = "RASCUNHO" | "ABERTO" | "EM_ANDAMENTO" | "FINALIZADO";
export type StatusPartida = "AGENDADA" | "AQUECIMENTO" | "AO_VIVO" | "FINALIZADA";
export type VisibilidadeTorneio = "PUBLICO" | "SOMENTE_PARTICIPANTES" | "PRIVADO";

export type LadoPonto = "CASA" | "VISITANTE";
export type TipoPonto = 
    | "SAQUE"
    | "ATAQUE"
    | "BLOQUEIO"
    | "ERRO_ADVERSARIO"
    | "CARTAO_ADVERSARIO";
export type TipoCartao = "AMARELO" | "VERMELHO";
export type TipoErro =
    | "ERRO_SAQUE"
    // | "ERRO_ATAQUE"
    | "TOQUE_REDE"
    | "DOIS_TOQUES"
    | "QUATRO_TOQUES"
    | "INVASAO"
    | "BOLA_FORA"
    | "CONDUCAO"
    | "ERRO_ROTACAO";

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
    indicePosicao?: number;
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

/* ── SSR-safe storage ─────────────────────────────────────── */
const isBrowser = typeof window !== "undefined";

const ls = {
    get: (k: string) => {
        try {
            return isBrowser ? localStorage.getItem(k) : null;
        } catch {
            return null;
        }
    },
    set: (k: string, v: string) => {
        try {
            if (isBrowser) localStorage.setItem(k, v);
        } catch { }
    },
    del: (k: string) => {
        try {
            if (isBrowser) localStorage.removeItem(k);
        } catch { }
    },
};

export const auth = {
    getToken: () => ls.get(TOKEN_KEY),

    getUser: (): AuthUser | null => {
        try {
            return JSON.parse(ls.get(USER_KEY) ?? "null");
        } catch {
            return null;
        }
    },

    setSession: (token: string, user: AuthUser) => {
        ls.set(TOKEN_KEY, token);
        ls.set(USER_KEY, JSON.stringify(user));
        if (isBrowser) window.dispatchEvent(new Event("auth-change"));
    },

    clear: () => {
        ls.del(TOKEN_KEY);
        ls.del(USER_KEY);
        if (isBrowser) window.dispatchEvent(new Event("auth-change"));
    },
};

/* ── HTTP helper ──────────────────────────────────────────── */
async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const token = auth.getToken();

    const res = await fetch(`${API_URL}${path}`, {
        ...opts,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(opts.headers ?? {}),
        },
    });

    if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || `HTTP ${res.status}`);
        } catch {
            throw new Error(errorText || `HTTP ${res.status}`);
        }
    }

    if (res.status === 204) return undefined as T;

    return res.json();
}

/* ── API EXPORTADA ────────────────────────────────────────── */
export const api = {
    /* ── Autenticação ───────────────────────────────────────── */

    login: async (email: string, senha: string) => {
        const data = await request<{ token: string; user: AuthUser }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password: senha }),
        });
        auth.setSession(data.token, data.user);
        return data;
    },

    register: async (nome: string, email: string, senha: string) => {
        return request<AuthUser>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ nome, email, password: senha }),
        });
    },

    logout: () => {
        auth.clear();
    },

    /* ── Torneios ───────────────────────────────────────────── */

    listarTorneios: async (): Promise<Torneio[]> => {
        return request<Torneio[]>("/torneios");
    },

    buscarTorneio: async (id: string): Promise<Torneio> => {
        return request<Torneio>(`/torneios/${id}`);
    },

    criarTorneio: async (data: Omit<Torneio, "id">): Promise<Torneio> => {
        return request<Torneio>("/torneios", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    atualizarTorneio: async (
        id: string,
        data: Partial<Torneio>,
    ): Promise<Torneio> => {
        return request<Torneio>(`/torneios/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    removerTorneio: async (id: string): Promise<void> => {
        return request<void>(`/torneios/${id}`, {
            method: "DELETE",
        });
    },

    /* ── Times ──────────────────────────────────────────────── */

    listarTimes: async (torneioId: string): Promise<Time[]> => {
        return request<Time[]>(`/times?torneioId=${torneioId}`);
    },

    buscarTime: async (id: string): Promise<Time> => {
        return request<Time>(`/times/${id}`);
    },

    criarTime: async (data: Omit<Time, "id">): Promise<Time> => {
        return request<Time>("/times", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    atualizarTime: async (id: string, data: Partial<Time>): Promise<Time> => {
        return request<Time>(`/times/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    removerTime: async (id: string): Promise<void> => {
        return request<void>(`/times/${id}`, {
            method: "DELETE",
        });
    },

    /* ── Jogadores ──────────────────────────────────────────── */

    listarJogadores: async (timeId: string): Promise<Jogador[]> => {
        return request<Jogador[]>(`/times/${timeId}/jogadores`);
    },

    criarJogador: async (data: Omit<Jogador, "id">): Promise<Jogador> => {
        return request<Jogador>(`/times/${data.timeId}/jogadores`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    atualizarJogador: async (
        timeId: string,
        jogadorId: string,
        data: Partial<Jogador>,
    ): Promise<Jogador> => {
        return request<Jogador>(`/times/${timeId}/jogadores/${jogadorId}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    deletarJogador: async (
        timeId: string,
        jogadorId: string,
    ): Promise<void> => {
        return request<void>(`/times/${timeId}/jogadores/${jogadorId}`, {
            method: "DELETE",
        });
    },

    definirTitular: async (
        timeId: string,
        jogadorId: string,
        titular: boolean,
    ): Promise<Jogador> => {
        return request<Jogador>(`/times/${timeId}/jogadores/${jogadorId}/titular`, {
            method: "PUT",
            body: JSON.stringify({ titular }),
        });
    },

    /* ── Convite de time (join) ───────────────────────────────── */

    getTeamByInvite: async (
        token: string,
    ): Promise<Time & { tournamentName: string }> => {
        return request(`/times/convite/${token}`);
    },

    joinTeamByInvite: async (
        token: string,
        data: { name: string; jerseyNumber?: number; position?: string },
    ): Promise<Jogador> => {
        return request<Jogador>(`/times/convite/${token}/entrar`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    /* ── Partidas ───────────────────────────────────────────── */

    listarPartidas: async (torneioId: string): Promise<Partida[]> => {
        return request<Partida[]>(`/partidas?torneioId=${torneioId}`);
    },

    buscarPartida: async (id: string): Promise<Partida> => {
        return request<Partida>(`/partidas/${id}`);
    },

    criarPartida: async (data: Omit<Partida, "id">): Promise<Partida> => {
        return request<Partida>("/partidas", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    comecaPartida: async (partidaId: string): Promise<Partida> => {
        return request<Partida>(`/partidas/${partidaId}`, {
            method: "PUT",
            body: JSON.stringify({ status: "AO_VIVO" }),
        });
    },

    atualizarPartida: async (
        id: string,
        data: Partial<Partida>,
    ): Promise<Partida> => {
        return request<Partida>(`/partidas/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    removerPartida: async (id: string): Promise<void> => {
        return request<void>(`/partidas/${id}`, {
            method: "DELETE",
        });
    },

    finalizarPartida: async (partidaId: string): Promise<Partida> => {
        return request<Partida>(`/partidas/${partidaId}`, {
            method: "PUT",
            body: JSON.stringify({ status: "FINALIZADA" }),
        });
    },

    /* ── Elenco da Partida ─────────────────────────────────── */

    listarJogadoresPartida: async (
        partidaId: string,
    ): Promise<JogadorPartida[]> => {
        return request<JogadorPartida[]>(`/partidas/${partidaId}/jogadores`);
    },

    /* ── Eventos / Placar Ao Vivo ──────────────────────────── */

    listarEventosPartida: async (
        partidaId: string,
    ): Promise<EventoPartida[]> => {
        return request<EventoPartida[]>(`/partidas/${partidaId}/eventos`);
    },

    registrarEvento: async (
        partidaId: string,
        data: Omit<EventoPartida, "id" | "partidaId" | "horario">,
    ): Promise<{ evento: EventoPartida; partida: Partida }> => {
        return request(`/partidas/${partidaId}/eventos`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    anularUltimoEvento: async (
        partidaId: string,
    ): Promise<{ partida: Partida }> => {
        return request(`/partidas/${partidaId}/eventos/anular-ultimo`, {
            method: "POST",
        });
    },

    /* ── Regras de Partida do Torneio ─────────────────────────── */

    buscarRegras: async (torneioId: string): Promise<RegrasTorneio> => {
        return request<RegrasTorneio>(`/torneios/${torneioId}/regras`);
    },

    atualizarRegras: async (
        torneioId: string,
        data: Partial<Omit<RegrasTorneio, "id" | "torneioId">>,
    ): Promise<RegrasTorneio> => {
        return request<RegrasTorneio>(`/torneios/${torneioId}/regras`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },


    /** Escalação por Set */
    salvarEscalacao: async (
        partidaId: string,
        data: {
            indiceSet: number;
            casa: { titulares: { jogadorId: string; indicePosicao: number }[]; banco: string[]; indicePosicaoSaque?: number };
            visitante: { titulares: { jogadorId: string; indicePosicao: number }[]; banco: string[]; indicePosicaoSaque?: number };
        },
    ): Promise<EscalacaoTimeApi[]> => {
        return request<EscalacaoTimeApi[]>(`/partidas/${partidaId}/escalacao`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    listarEscalacao: async (
        partidaId: string,
        indiceSet: number,
    ): Promise<EscalacaoTimeApi[]> => {
        return request<EscalacaoTimeApi[]>(`/partidas/${partidaId}/escalacao?indiceSet=${indiceSet}`);
    },

    /* ── Substituições ─────────────────────────────────────── */

    registrarSubstituicao: async (
        partidaId: string,
        data: {
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
        },
    ): Promise<SubstituicaoApi> => {
        return request<SubstituicaoApi>(`/partidas/${partidaId}/substituicoes`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    listarSubstituicoes: async (
        partidaId: string,
        indiceSet?: number,
    ): Promise<SubstituicaoApi[]> => {
        const qs = indiceSet !== undefined ? `?indiceSet=${indiceSet}` : "";
        return request<SubstituicaoApi[]>(`/partidas/${partidaId}/substituicoes${qs}`);
    },

};