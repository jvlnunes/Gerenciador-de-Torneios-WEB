import type { AuthUser } from "@/services/api/interfaces";
import { useEffect, useState } from "react";
import api from "@/services/api";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(api.auth.getUser());

    const handler = () => setUser(api.auth.getUser());
    window.addEventListener("auth-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("auth-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { user, isAuthenticated: !!user, logout: api.auth.clear };
}
