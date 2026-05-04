import { useEffect, useState } from "react";
import { auth, type AuthUser } from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => auth.getUser());
  useEffect(() => {
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
