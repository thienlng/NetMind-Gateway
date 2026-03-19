import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi, getToken, setToken, clearToken, APP_BASE } from "./api";
import type { User } from "./types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithSSO: (ticket: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      authApi
        .me()
        .then(setUser)
        .catch(() => {
          clearToken();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await authApi.login(username, password);
    setToken(res.access_token);
    setUser(res.user);
  };

  const loginWithSSO = async (ticket: string) => {
    const res = await authApi.ssoLogin(ticket);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = async () => {
    // For SSO users, also redirect to auth.viettel.vn to invalidate the SSO session
    const isSSOUser = user?.auth_provider === "sso";
    clearToken();
    setUser(null);

    if (isSSOUser) {
      try {
        const { logout_url } = await authApi.ssoLogoutUrl();
        window.location.href = logout_url;
      } catch {
        window.location.href = `${APP_BASE}/login`;
      }
    } else {
      window.location.href = `${APP_BASE}/login`;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, loginWithSSO, logout, isAdmin: user?.role === "admin" }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
