import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any | null;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('clovet_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData: any) => {
    const defaultAvatar = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=90';
    const newUser = typeof userData === 'string' ? { 
      email: userData, 
      name: userData.split('@')[0],
      avatar: defaultAvatar
    } : {
      ...userData,
      avatar: userData.avatar || defaultAvatar
    };
    
    setUser(newUser);
    localStorage.setItem('clovet_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('clovet_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
