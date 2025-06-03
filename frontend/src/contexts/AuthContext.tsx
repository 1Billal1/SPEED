import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';

type AuthContextType = {
  userRole: string | null;
  isLoading: boolean; 
  login: (role: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true); 
    try {
      const savedRole = localStorage.getItem('role');
      if (savedRole) {
        setUserRole(savedRole);
      } else {
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (role: string) => {
    localStorage.setItem('role', role);
    setUserRole(role);
  };

  const logout = () => {
    localStorage.removeItem('role');
    setUserRole(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ userRole, isLoading, login, logout }}> 
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}