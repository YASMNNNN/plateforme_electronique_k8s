import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getCurrentUser } from '../api/gateway';
import type { UserProfile } from '../api/types';

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isAuthenticated: false,
  hasRole: () => false,
  refreshUser: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await getCurrentUser();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('demo_auth');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (role: string) => user?.role === role,
    [user]
  );

  const isAdmin = user?.role === 'ADMIN';
  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, isAuthenticated, hasRole, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
