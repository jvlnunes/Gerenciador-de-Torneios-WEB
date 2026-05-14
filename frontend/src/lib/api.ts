const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
const TOKEN_KEY = "vb_token";
const USER_KEY = "vb_user";

export type PerfilUsuario = "ADMIN" | "GERENTE" | "USUARIO";

export type StatusTorneio = "RASCUNHO" | "ABERTO" | "EM_ANDAMENTO" | "FINALIZADO";
export type StatusPartida = "AGENDADA" | "AQUECIMENTO" | "AO_VIVO" | "FINALIZADA";
export type VisibilidadeTorneio = "PUBLICO" | "SOMENTE_PARTICIPANTES" | "PRIVADO";

export type LadoPonto = "CASA" | "VISITANTE";
export type TipoPonto = "SAQUE" | "ATAQUE" | "BLOQUEIO" | "ERRO_ADVERSARIO" | "CARTAO_ADVERSARIO";
export type TipoCartao = "AMARELO" | "VERMELHO";
export type TipoErro =
    | "ERRO_SAQUE" | "ERRO_ATAQUE" | "TOQUE_REDE" | "DOIS_TOQUES" | "QUATRO_TOQUES"
    | "INVASAO" | "BOLA_FORA" | "CONDUCAO" | "ERRO_ROTACAO";

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
    // maxTimes?: number;
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

// Funções para calculos 

/* ── SSR-safe storage ─────────────────────────────────────── */
const isBrowser = typeof window !== "undefined";
const ls = {
    get: (k: string) => { try { return isBrowser ? localStorage.getItem(k) : null; } catch { return null; } },
    set: (k: string, v: string) => { try { if (isBrowser) localStorage.setItem(k, v); } catch { } },
    del: (k: string) => { try { if (isBrowser) localStorage.removeItem(k); } catch { } },
};

export const auth = {
    getToken: () => ls.get(TOKEN_KEY),
    getUser: (): AuthUser | null => { try { return JSON.parse(ls.get(USER_KEY) ?? "null"); } catch { return null; } },
    setSession: (token: string, user: AuthUser) => {
        ls.set(TOKEN_KEY, token); ls.set(USER_KEY, JSON.stringify(user));
        if (isBrowser) window.dispatchEvent(new Event("auth-change"));
    },
    clear: () => {
        ls.del(TOKEN_KEY); ls.del(USER_KEY);
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
    if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
    if (res.status === 204) return undefined as T;
    return res.json();
}

/* ── Mock helpers ─────────────────────────────────────────── */
const useMock = () => !import.meta.env.VITE_API_URL;
const mockGet = <T>(k: string): T[] => { try { return JSON.parse(ls.get(k) ?? "[]"); } catch { return []; } };
const mockSet = <T>(k: string, v: T[]) => ls.set(k, JSON.stringify(v));
const mockGetOne = <T extends { id: string }>(k: string, id: string): T | undefined =>
    mockGet<T>(k).find(x => x.id === id);

/* ── Mock: recalcular placar a partir de eventos ─────────────── */
function recalcularPartida(partida: Partida, eventos: EventoPartida[]): Partida {
    const ativos = eventos.filter(e => e.partidaId === partida.id && !e.anulado);
    let setsCasa = 0, setsVisitante = 0;
    const sets: { casa: number; visitante: number }[] = [];

    const porSet: Map<number, EventoPartida[]> = new Map();
    for (const e of ativos) {
        if (!porSet.has(e.indiceSet)) porSet.set(e.indiceSet, []);
        porSet.get(e.indiceSet)!.push(e);
    }

    const totalSetsJogados = porSet.size;
    for (let i = 0; i < totalSetsJogados - 1; i++) {
        const evs = porSet.get(i) ?? [];
        const ultimo = evs[evs.length - 1];
        if (ultimo) {
            sets.push({ casa: ultimo.placarCasa, visitante: ultimo.placarVisitante });
            if (ultimo.placarCasa > ultimo.placarVisitante) setsCasa++; else setsVisitante++;
        }
    }

    const evsSetAtual = porSet.get(totalSetsJogados - 1) ?? [];
    const ultimoAtual = evsSetAtual[evsSetAtual.length - 1];

    return {
        ...partida,
        setsCasa,
        setsVisitante,
        sets,
        setAtualCasa: ultimoAtual?.placarCasa ?? 0,
        setAtualVisitante: ultimoAtual?.placarVisitante ?? 0,
    };
}

// ─── API EXPORTADA ─────────────────────────────────────────────────
export const api = {
    /* ── Autenticação ─────────────────────────────────────────────── */
    login: async (email: string, senha: string) => {
        if (useMock()) {
            const user: AuthUser = {
                id: "demo", nome: email.split("@")[0] || "Demo", email,
                perfil: email.includes("admin") ? "ADMIN" : email.includes("gerente") ? "GERENTE" : "USUARIO",
            };
            auth.setSession("mock-token", user);
            return { token: "mock-token", user };
        }
        const data = await request<{ token: string; user: AuthUser }>("/auth/login", {
            method: "POST", body: JSON.stringify({ email, password: senha }),
        });
        auth.setSession(data.token, data.user);
        return data;
    },
    register: async (nome: string, email: string, senha: string) => {
        if (useMock()) return api.login(email, senha);
        return request("/auth/register", { method: "POST", body: JSON.stringify({ nome, email, password: senha }) });
    },

    /* ── Torneios ─────────────────────────────────────────────────── */
    listarTorneios: async (): Promise<Torneio[]> => {
        return request<Torneio[]>("/torneios");
    },
    buscarTorneio: async (id: string): Promise<Torneio> => {
        return request<Torneio>(`/torneios/${id}`);
    },
    criarTorneio: async (data: Omit<Torneio, "id">): Promise<Torneio> => {
        return request<Torneio>("/torneios", { method: "POST", body: JSON.stringify(data) });
    },
    atualizarTorneio: async (id: string, data: Partial<Torneio>): Promise<Torneio> => {
        return request<Torneio>(`/torneios/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    removerTorneio: async (id: string): Promise<void> => {
        return request<void>(`/torneios/${id}`, { method: "DELETE" });
    },

    /* ── Times ────────────────────────────────────────────────────── */
    listarTimes: async (torneioId: string): Promise<Time[]> => {
        return request<Time[]>(`/times?torneioId=${torneioId}`);
    },
    buscarTime: async (id: string): Promise<Time> => {
        return request<Time>(`/times/${id}`);
    },
    criarTime: async (data: Omit<Time, "id">): Promise<Time> => {
        return request<Time>("/times", { method: "POST", body: JSON.stringify(data) });
    },
    atualizarTime: async (id: string, data: Partial<Time>): Promise<Time> => {
        return request<Time>(`/times/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    removerTime: async (id: string): Promise<void> => {
        return request<void>(`/times/${id}`, { method: "DELETE" });
    },

    /* ── Jogadores ────────────────────────────────────────────────── */
    listarJogadores: async (timeId: string): Promise<Jogador[]> => {
        return request<Jogador[]>(`/jogadores?teamId=${timeId}`);
    },
    criarJogador: async (data: Omit<Jogador, "id">): Promise<Jogador> => {
        return request<Jogador>("/jogadores", { method: "POST", body: JSON.stringify(data) });
    },
    atualizarJogador: async (timeId: string, jogadorId: string, data: Partial<Jogador>): Promise<Jogador> => {
        return request<Jogador>(`/times/${timeId}/jogadores/${jogadorId}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deletarJogador: async (timeId: string, jogadorId: string): Promise<void> => {
        return request<void>(`/times/${timeId}/jogadores/${jogadorId}`, { method: "DELETE" });
    },


    /* ── Partidas ─────────────────────────────────────────────────── */
    listarPartidas: async (torneioId: string): Promise<Partida[]> => {
        return request<Partida[]>(`/partidas?torneioId=${torneioId}`);
    },
    buscarPartida: async (id: string): Promise<Partida> => {
        return request<Partida>(`/partidas/${id}`);
    },
    criarPartida: async (data: Omit<Partida, "id">): Promise<Partida> => {
        return request<Partida>("/partidas", { 
            method: "POST", 
            body: JSON.stringify(data) 
        });
    },
    comecaPartida: async (partidaId: string): Promise<Partida> => {
        return request<Partida>(`/partidas/${partidaId}`, {
            method: "PUT",
            body: JSON.stringify({ status: "AO_VIVO" })
        });
    },
    atualizarPartida: async (id: string, data: Partial<Partida>): Promise<Partida> => {
        return request<Partida>(`/partidas/${id}`, { 
            method: "PUT", 
            body: JSON.stringify(data) 
        });
    },
    removerPartida: async (id: string): Promise<void> => {
        return request<void>(`/partidas/${id}`, { 
            method: "DELETE" 
        });
    },
    finalizarPartida: async (partidaId: string): Promise<Partida> => {
        return request<Partida>(`/partidas/${partidaId}`, {
            method: "PUT",
            body: JSON.stringify({ status: "FINALIZADA" })
        });
    },

    /* ── Elenco da Partida───────────────────── */
    listarJogadoresPartida: async (partidaId: string): Promise<JogadorPartida[]> => {
        return request<JogadorPartida[]>(`/partidas/${partidaId}/jogadores`);
    },

    /* ── Eventos / Placar Ao Vivo ─────────────────────────────────── */
    listarEventosPartida: async (partidaId: string): Promise<EventoPartida[]> => {
        return request<EventoPartida[]>(`/partidas/${partidaId}/eventos`);
    },
    registrarEvento: async (partidaId: string, data: Omit<EventoPartida, "id" | "partidaId" | "horario">): Promise<{ evento: EventoPartida; partida: Partida }> => {
        return request(`/partidas/${partidaId}/eventos`, { 
            method: "POST", 
            body: JSON.stringify(data) 
        });
    },
    anularUltimoEvento: async (partidaId: string): Promise<{ partida: Partida }> => {
        return request(`/partidas/${partidaId}/eventos/anular-ultimo`, { 
            method: "POST" 
        });
    }
};