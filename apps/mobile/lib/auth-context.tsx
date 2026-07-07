import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AuthUser } from "@thuvien/shared";
import { apiClient } from "./api-client";
import { mobileTokenStore } from "./token-store";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<AuthUser>("/api/v1/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const result = await apiClient.post<{ accessToken: string; refreshToken?: string; user: AuthUser }>(
      "/api/v1/auth/login",
      { identifier, password },
    );
    await mobileTokenStore.setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/api/v1/auth/logout");
    } finally {
      await mobileTokenStore.clearTokens();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return ctx;
}
