import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getCurrentUser, login, logout, resetPassword } from '../auth';
import { supabase } from '../supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any, data?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: any, success?: boolean }>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para tentar renovar a sessão
  const refreshSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Erro ao renovar sessão:', error);
        setUser(null);
        return false;
      }
      
      if (data.session) {
        setUser(data.session.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro inesperado ao renovar sessão:', error);
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    // Verificar se o usuário já está autenticado
    const checkUser = async () => {
      try {
        setLoading(true);
        const { user, error } = await getCurrentUser();
        
        if (error) {
          // Tentar renovar a sessão em caso de erro
          const refreshed = await refreshSession();
          if (!refreshed) {
            console.log('Sessão não pôde ser renovada, redirecionando para login');
          }
        } else {
          setUser(user);
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        // Tentar renovar a sessão em caso de erro
        await refreshSession();
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Configurar listener para mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    return await login(email, password);
  };

  const signOut = async () => {
    await logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    resetPassword,
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}