import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, UserSession } from '@/services/AuthService';

interface AuthContextType {
  currentUser: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const session = await AuthService.getCurrentSession();
      setCurrentUser(session);
      console.log('🔐 Auth initialized:', session ? session.email : 'No session');
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await AuthService.login(email, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
    }
    return { success: result.success, error: result.error };
  };

  const signup = async (email: string, password: string, name: string) => {
    const result = await AuthService.signup(email, password, name);
    if (result.success && result.user) {
      setCurrentUser(result.user);
    }
    return { success: result.success, error: result.error };
  };

  const logout = async () => {
    await AuthService.logout();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: currentUser !== null,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
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

