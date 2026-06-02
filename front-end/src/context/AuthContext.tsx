import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User & { token: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('clovet_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('clovet_token');
  });

  const login = (userData: User & { token: string }) => {
    const { token: jwtToken, ...userWithoutToken } = userData;
    const defaultAvatar = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=90';
    const newUser: User = {
      ...userWithoutToken,
      avatar: userWithoutToken.avatar || defaultAvatar,
    };
    setUser(newUser);
    setToken(jwtToken);
    // Simpan user tanpa data sensitif dan token terpisah
    localStorage.setItem('clovet_user', JSON.stringify(newUser));
    localStorage.setItem('clovet_token', jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('clovet_user');
    localStorage.removeItem('clovet_token');
    localStorage.removeItem('clovet_cart');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
