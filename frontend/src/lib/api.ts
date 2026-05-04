// Cliente HTTP simples para a API Node.js do backend.
// Configure VITE_API_URL no ambiente para apontar para sua API (ex: http://localhost:3000).
const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
const TOKEN_KEY = "vb_token";
const USER_KEY = "vb_user";

export type UserRole = "ADMIN" | "MANAGER" | "USER";
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: "DRAFT" | "OPEN" | "ONGOING" | "FINISHED";
  maxTeams?: number;
}

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: (): AuthUser | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setSession: (token: string, user: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("auth-change"));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event("auth-change"));
  },
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = auth.getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ----- MOCK fallback (caso a API não esteja online) -----
const MOCK_KEY = "vb_mock_tournaments";
const useMock = () => !import.meta.env.VITE_API_URL;
const mockList = (): Tournament[] => JSON.parse(localStorage.getItem(MOCK_KEY) || "[]");
const mockSave = (list: Tournament[]) => localStorage.setItem(MOCK_KEY, JSON.stringify(list));

export const api = {
  login: async (email: string, password: string) => {
    if (useMock()) {
      const user: AuthUser = {
        id: "demo",
        name: email.split("@")[0] || "Demo",
        email,
        role: email.includes("admin") ? "ADMIN" : email.includes("manager") ? "MANAGER" : "USER",
      };
      auth.setSession("mock-token", user);
      return { token: "mock-token", user };
    }
    const data = await request<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    auth.setSession(data.token, data.user);
    return data;
  },

  register: async (name: string, email: string, password: string) => {
    if (useMock()) return api.login(email, password);
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  listTournaments: async (): Promise<Tournament[]> => {
    if (useMock()) return mockList();
    return request<Tournament[]>("/tournaments");
  },

  getTournament: async (id: string): Promise<Tournament> => {
    if (useMock()) {
      const t = mockList().find((x) => x.id === id);
      if (!t) throw new Error("Torneio não encontrado");
      return t;
    }
    return request<Tournament>(`/tournaments/${id}`);
  },

  createTournament: async (data: Omit<Tournament, "id">): Promise<Tournament> => {
    if (useMock()) {
      const list = mockList();
      const t: Tournament = { ...data, id: crypto.randomUUID(), status: data.status || "DRAFT" };
      mockSave([t, ...list]);
      return t;
    }
    return request<Tournament>("/tournaments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTournament: async (id: string, data: Partial<Tournament>): Promise<Tournament> => {
    if (useMock()) {
      const list = mockList();
      const idx = list.findIndex((x) => x.id === id);
      if (idx === -1) throw new Error("Torneio não encontrado");
      list[idx] = { ...list[idx], ...data };
      mockSave(list);
      return list[idx];
    }
    return request<Tournament>(`/tournaments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteTournament: async (id: string): Promise<void> => {
    if (useMock()) {
      mockSave(mockList().filter((x) => x.id !== id));
      return;
    }
    return request<void>(`/tournaments/${id}`, { method: "DELETE" });
  },
};
