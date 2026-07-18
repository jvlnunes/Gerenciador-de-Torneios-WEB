import { AuthUser } from "./interfaces";

export const API_URL = (import.meta.env.VITE_API_URL as string) || "http://192.168.18.5:3000";

const TOKEN_KEY = "vb_token";
const USER_KEY = "vb_user";

/* ── Armazenamento seguro para SSR (Safe Storage) ──────────────── */
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

/* ── Gestão de Sessão e Estado de Autenticação ─────────────────── */
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

/* ── Intercetor HTTP Genérico (Request Helper) ────────────────── */
export async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const token = auth.getToken();

    const res = await fetch(`${API_URL}${path}`, {
        ...opts,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(opts.headers ?? {}),
        },
    });

    // Tratamento unificado de erros HTTP
    if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        let mensagem = errorText || `HTTP ${res.status}`;

        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson?.message) {
                mensagem = Array.isArray(errorJson.message)
                    ? errorJson.message.join(", ")
                    : errorJson.message;
            }
        } catch {
            // O corpo não era JSON — mantém o texto bruto como mensagem
        }

        throw new Error(mensagem);
    }

    if (res.status === 204) return undefined as T;

    return res.json();
}