import { request, auth } from "./cliente";
import { AuthUser } from "./interfaces";

export const authApi = {
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
};