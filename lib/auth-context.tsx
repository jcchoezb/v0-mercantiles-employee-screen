"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Employee } from "./types";
import { authApi } from "./api-service";

interface AuthContextType {
  employee: Employee | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sesion existente al cargar
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authApi.perfil();
        if (profile && profile.id) {
          setEmployee({
            id: String(profile.id),
            name: profile.nombre,
            email: profile.email,
            role: mapRole(profile.rol),
            avatar: profile.avatarUrl,
            empresaId: profile.empresaId,
            empresaNombre: profile.empresaNombre,
          });
        }
      } catch (error) {
        console.error("Error verificando sesion:", error);
        localStorage.removeItem("auth_token");
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);
      if (response.token) {
        localStorage.setItem("auth_token", response.token);
        // Fetch full profile to get empresaId and empresaNombre
        const profile = await authApi.perfil();
        setEmployee({
          id: String(response.empleadoId),
          name: response.nombre,
          email: response.email,
          role: mapRole(response.rol),
          avatar: response.avatarUrl,
          empresaId: profile?.empresaId,
          empresaNombre: profile?.empresaNombre,
        });
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: "No se recibio token de autenticacion" };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error de conexion con el servidor";
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    setEmployee(null);
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider value={{ employee, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Mapea los roles del backend a los del frontend
function mapRole(rol: string): "admin" | "agent" | "supervisor" {
  const r = rol?.toLowerCase();
  if (r === "administrador" || r === "admin") return "admin";
  if (r === "supervisor") return "supervisor";
  return "agent";
}
