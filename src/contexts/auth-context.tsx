import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getUserId, getProfile } from "@/lib/local-store";

interface LocalUser {
  id: string;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = getUserId();
    getProfile();
    setUser({ id });
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
