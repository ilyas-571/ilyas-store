import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ilyas_token");
    }
    return null;
  });

  const { data: userResponse, isLoading: isUserLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: getGetMeQueryKey(),
    }
  });

  // useGetMe returns { data: User, status, headers } — unwrap to get the User
  const user = userResponse?.data ?? null;

  useEffect(() => {
    if (token) {
      localStorage.setItem("ilyas_token", token);
    } else {
      localStorage.removeItem("ilyas_token");
    }
  }, [token]);

  const login = (newToken: string) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
    // Clear cart data tied to the outgoing user session
    localStorage.removeItem("ilyas_cart");
    localStorage.removeItem("ilyas_cart_user");
  };

  const refetchUser = () => {
    if (token) refetch();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: isUserLoading, login, logout, refetchUser }}>
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
