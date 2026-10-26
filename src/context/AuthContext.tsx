import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Business, User, UserRole } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  registerOwner: (data: {
    businessName: string;
    fullName: string;
    username: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  updateCurrentBusiness: (updated: Business) => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get<{ user: User; business: Business }>('/auth/me');
      setUser(res.user);
      setBusiness(res.business);
    } catch (err) {
      console.warn('Authentication token expired or invalid:', err);
      api.removeToken();
      setToken(null);
      setUser(null);
      setBusiness(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await api.post<{ token: string; user: User; business: Business }>('/auth/login', {
      username,
      password,
    });
    api.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setBusiness(res.business);
  };

  const registerOwner = async (data: {
    businessName: string;
    fullName: string;
    username: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
  }) => {
    const res = await api.post<{ token: string; user: User; business: Business }>('/auth/register', data);
    api.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setBusiness(res.business);
  };

  const logout = () => {
    api.removeToken();
    setToken(null);
    setUser(null);
    setBusiness(null);
  };

  const refreshUserData = async () => {
    await fetchProfile();
  };

  const updateCurrentBusiness = (updated: Business) => {
    setBusiness(updated);
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerOwner,
        logout,
        refreshUserData,
        updateCurrentBusiness,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
