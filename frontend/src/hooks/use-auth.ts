import type { AuthUser } from "@/services/api/interfaces";
import { useEffect, useState } from "react";
import { auth } from "@/services/api";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
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
