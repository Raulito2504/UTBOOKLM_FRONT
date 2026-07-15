"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authService } from "./api/service";
import { clearSession, getAccessToken, getRefreshToken, getStoredUser, saveSession, saveUser } from "./session";
import type { LoginRequest, RegisterRequest, User } from "./types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest, remember: boolean) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restore = useCallback(async () => {
    if (!getAccessToken()) { setUser(null); setIsLoading(false); return; }
    setUser(getStoredUser());
    try {
      const current = await authService.me();
      saveUser(current);
      setUser(current);
    } catch { clearSession(); setUser(null); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void restore(), 0);
    window.addEventListener("auth-session-change", restore);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("auth-session-change", restore);
    };
  }, [restore]);

  const login = async (data: LoginRequest, remember: boolean) => {
    const session = await authService.login(data);
    saveSession(session, remember);
    setUser(session.user);
  };
  const register = async (data: RegisterRequest) => {
    const session = await authService.register(data);
    saveSession(session, true);
    setUser(session.user);
  };
  const logout = async () => {
    const token = getRefreshToken();
    try { if (token) await authService.logout(token); }
    finally { clearSession(); setUser(null); }
  };

  return <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user && getAccessToken()), isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return value;
}
