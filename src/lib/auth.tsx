import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role =
  | "administrator"
  | "teacher"
  | "student"
  | "admission"
  | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  meta?: Record<string, string>;
}

export const ROLE_LABELS: Record<Role, string> = {
  administrator: "Administrator",
  teacher: "Teacher",
  student: "Student",
  admission: "Admission Support",
  staff: "Other Staff",
};

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";
const ACCESS_TOKEN_KEY = "campus_hub_access_token";
const CSRF_TOKEN_KEY = "campus_hub_csrf_token";

function getCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

function persistAuthTokens(accessToken?: string, csrfToken?: string) {
  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (csrfToken) {
    window.localStorage.setItem(CSRF_TOKEN_KEY, csrfToken);
  }
}

function clearAuthTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(CSRF_TOKEN_KEY);
}

function isJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json");
}

async function parseResponse<T>(response: Response) {
  if (isJsonResponse(response)) {
    return response.json() as Promise<T>;
  }
  const text = await response.text();
  throw new Error(text || response.statusText || "Unexpected API response");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const csrfToken = getCookie("csrf_token");

      if (!csrfToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await parseResponse<{ user: User }>(response);
          setUser(data.user);
          return;
        }

        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (refreshResponse.ok) {
          const refreshed = await parseResponse<{ user: User; accessToken?: string; csrfToken?: string }>(refreshResponse);
          persistAuthTokens(refreshed.accessToken, refreshed.csrfToken);
          setUser(refreshed.user);
          return;
        }

        clearAuthTokens();
      } catch {
        clearAuthTokens();
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await parseResponse<{ user: User; accessToken?: string; csrfToken?: string }>(response);
    if (!response.ok) {
      throw new Error((data as any)?.message || "Login failed");
    }

    persistAuthTokens(data.accessToken, data.csrfToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await parseResponse<{ user: User; accessToken?: string; csrfToken?: string }>(response);
    if (!response.ok) {
      throw new Error((data as any)?.message || "Registration failed");
    }

    persistAuthTokens(data.accessToken, data.csrfToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    clearAuthTokens();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const context = useContext(Ctx);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
