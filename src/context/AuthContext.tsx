"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id?: number | string;
  name?: string;
  username?: string;
  role?: string;
  nip?: string;
  nisn?: string;
  teacher_id?: number;
  student_id?: number;
  major?: string;
  class_name?: string;
  company_name?: string;
  photo?: string;
  allowed_modules?: string[];
  [key: string]: any;
}

export type PklRole = "admin" | "teacher" | "student";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  role: PklRole;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isSuperadmin: boolean;
  hasAccess: boolean;
  isLoading: boolean;
  switchRole: (newRole: PklRole) => void;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const DEFAULT_PERSONAS: Record<PklRole, AuthUser> = {
  admin: {
    id: 1,
    name: "Admin PKL & Hubin",
    username: "admin_hubin",
    role: "admin",
    nip: "198005122005011004",
  },
  teacher: {
    id: 1,
    name: "Drs. Leonard Snyder, M.Pd.",
    username: "leonard_snyder",
    role: "teacher",
    nip: "TCH-1001",
    teacher_id: 1,
  },
  student: {
    id: 2,
    name: "Cecilia Bradley",
    username: "cecilia_bradley",
    role: "student",
    nisn: "0078100002",
    student_id: 2,
    major: "Rekayasa Perangkat Lunak (RPL)",
    class_name: "XII RPL 1",
    company_name: "PT Bali Cyber Solusindo",
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      let queryToken: string | null = null;
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get("token");
        if (urlToken) {
          queryToken = urlToken;
          try {
            localStorage.setItem("pkl_token", urlToken);
            localStorage.setItem("siak_jwt_token", urlToken);
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          } catch {}
        }
      }

      const storedToken =
        localStorage.getItem("pkl_token") ||
        localStorage.getItem("siak_jwt_token") ||
        localStorage.getItem("siak_token");

      const cookies =
        typeof document !== "undefined"
          ? document.cookie.split(";").reduce((acc, c) => {
              const [k, v] = c.trim().split("=");
              if (k && v) acc[k] = decodeURIComponent(v);
              return acc;
            }, {} as Record<string, string>)
          : {};
      const cookieToken = cookies["pkl_token"] || cookies["siak_token"];

      const activeToken = queryToken || storedToken || cookieToken;

      const savedRole = (typeof window !== "undefined" ? localStorage.getItem("pkl_active_role") : null) as PklRole | null;

      if (activeToken) {
        const parsed = parseJwt(activeToken);
        if (parsed && (!parsed.exp || Date.now() < parsed.exp * 1000)) {
          setToken(activeToken);
          const mappedRole = (savedRole || parsed.role || "admin").toLowerCase() as PklRole;
          const persona = DEFAULT_PERSONAS[mappedRole] || DEFAULT_PERSONAS.admin;
          setUser({ ...parsed, ...persona, role: mappedRole });
          setIsLoading(false);
          return;
        }
      }

      const activeRole: PklRole = savedRole && DEFAULT_PERSONAS[savedRole] ? savedRole : "admin";
      setUser(DEFAULT_PERSONAS[activeRole]);
      setIsLoading(false);
    } catch {
      setUser(DEFAULT_PERSONAS.admin);
      setIsLoading(false);
    }
  }, []);

  const switchRole = useCallback((newRole: PklRole) => {
    const persona = DEFAULT_PERSONAS[newRole] || DEFAULT_PERSONAS.admin;
    setUser(persona);
    try {
      localStorage.setItem("pkl_active_role", newRole);
    } catch {}
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    try {
      localStorage.setItem("pkl_token", newToken);
      document.cookie = `pkl_token=${newToken}; path=/; max-age=86400; SameSite=Lax`;
    } catch {}
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem("pkl_token");
      localStorage.removeItem("pkl_active_role");
      localStorage.clear();
      document.cookie = "pkl_token=; path=/; max-age=0";
    } catch {}
    if (typeof window !== "undefined") {
      window.location.href = "http://localhost:3000/logout";
    }
  }, []);

  const rawRole = (user?.role || "admin").toLowerCase();
  const role: PklRole = rawRole === "teacher" || rawRole === "guru" ? "teacher" : rawRole === "student" || rawRole === "siswa" ? "student" : "admin";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isStudent = role === "student";
  const isSuperadmin = isAdmin;
  const hasAccess = true;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAdmin,
        isTeacher,
        isStudent,
        isSuperadmin,
        hasAccess,
        isLoading,
        switchRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
