import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { loginApi, registerApi, getMeApi, logoutApi, LoginPayload, RegisterPayload } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('darukaa_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('darukaa_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('darukaa_access_token');
      if (storedToken) {
        try {
          const freshUser = await getMeApi();
          setUser(freshUser);
          localStorage.setItem('darukaa_user', JSON.stringify(freshUser));
        } catch {
          // Token expired or invalid
          setUser(null);
          setToken(null);
          localStorage.removeItem('darukaa_access_token');
          localStorage.removeItem('darukaa_refresh_token');
          localStorage.removeItem('darukaa_user');
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const resp = await loginApi(payload);
      localStorage.setItem('darukaa_access_token', resp.access_token);
      localStorage.setItem('darukaa_refresh_token', resp.refresh_token);
      localStorage.setItem('darukaa_user', JSON.stringify(resp.user));
      setToken(resp.access_token);
      setUser(resp.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      await registerApi(payload);
      // Auto login after registration
      await login({ email: payload.email, password: payload.password });
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('darukaa_access_token');
      localStorage.removeItem('darukaa_refresh_token');
      localStorage.removeItem('darukaa_user');
    }
  }, []);

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
