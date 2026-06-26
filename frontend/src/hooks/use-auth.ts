import { useEffect, useState } from "react";
import { auth, type AuthUser } from "@/services/api";

export function useAuth() {
  // Inicializa como null no servidor; no cliente hidrata com localStorage
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Só roda no browser após hidratação
    setUser(auth.getUser());

    const handler = () => setUser(auth.getUser());
    window.addEventListener("auth-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("auth-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { user, isAuthenticated: !!user, logout: auth.clear };
}
