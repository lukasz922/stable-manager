import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api } from "../api/client";

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(data: Partial<User>): User {
  return {
    id: data.id ?? 0,
    username: data.username ?? "",
    full_name: data.full_name ?? "",
    role: data.role ?? "",
    is_active: data.is_active ?? false,
    permissions: Array.isArray(data.permissions)
      ? data.permissions
      : [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("stable_token")
  );

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  async function loadCurrentUser(currentToken: string) {
    api.defaults.headers.common["Authorization"] =
      `Bearer ${currentToken}`;

    const response = await api.get<User>("/auth/me");
    const currentUser = normalizeUser(response.data);

    localStorage.setItem(
      "stable_user",
      JSON.stringify(currentUser)
    );

    setToken(currentToken);
    setUser(currentUser);
  }

  async function login() {
    const currentToken = localStorage.getItem("stable_token");

    if (!currentToken) return;

    await loadCurrentUser(currentToken);
  }

  function logout() {
    localStorage.removeItem("stable_token");
    localStorage.removeItem("stable_user");

    delete api.defaults.headers.common["Authorization"];

    setToken(null);
    setUser(null);
  }

  function hasPermission(permission: string) {
    return user?.permissions.includes(permission) ?? false;
  }

  useEffect(() => {
    const storedToken = localStorage.getItem("stable_token");
    const storedUser = localStorage.getItem("stable_user");

    if (storedUser) {
      try {
        setUser(normalizeUser(JSON.parse(storedUser)));
      } catch {
        localStorage.removeItem("stable_user");
      }
    }

    if (storedToken) {
      void loadCurrentUser(storedToken).catch(() => {
        logout();
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}