import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getCurrentUser, login, logout, resetPassword } from '../auth';
import { supabase } from '../supabase';
import { signUp as signUpApi } from '../auth';

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
        // Verificar primeiro se já temos o usuário no localStorage (mais persistente que sessionStorage)
        const storedUserSession = localStorage.getItem('userSession');
        
        if (storedUserSession) {
          try {
            const storedUser = JSON.parse(storedUserSession);
            console.log('Usando sessão do usuário armazenada no localStorage');
            setUser(storedUser);
            
            // Manter também no sessionStorage para compatibilidade
            sessionStorage.setItem('userSession', storedUserSession);
            
            // Criar um identificador de sessão persistente
            const sessionToken = localStorage.getItem('supabase_session_token');
            if (!sessionToken) {
              localStorage.setItem('supabase_session_token', storedUser.id + '_' + Date.now());
            }
            
            setLoading(false);
            return;
          } catch (error) {
            console.error('Erro ao processar sessão armazenada no localStorage:', error);
            // Continuar com o sessionStorage em caso de erro
          }
        }
        
        // Tentar o sessionStorage como fallback
        const sessionStoredUserSession = sessionStorage.getItem('userSession');
        if (sessionStoredUserSession) {
          try {
            const storedUser = JSON.parse(sessionStoredUserSession);
            console.log('Usando sessão do usuário armazenada no sessionStorage');
            setUser(storedUser);
            
            // Sincronizar com localStorage para persistência melhorada
            localStorage.setItem('userSession', sessionStoredUserSession);
            
            // Criar um identificador de sessão persistente
            const sessionToken = localStorage.getItem('supabase_session_token');
            if (!sessionToken) {
              localStorage.setItem('supabase_session_token', storedUser.id + '_' + Date.now());
            }
            
            setLoading(false);
            return;
          } catch (error) {
            console.error('Erro ao processar sessão armazenada no sessionStorage:', error);
            // Continuar verificação com Supabase em caso de erro
          }
        }
        
        // Se não encontramos nem no localStorage nem no sessionStorage, verificar com o Supabase
        console.log('Verificando sessão com Supabase...');
        const { user, error } = await getCurrentUser();
        if (error) {
          const refreshed = await refreshSession();
          if (!refreshed) {
            console.log('Sessão não pôde ser renovada, redirecionando para login');
          }
        } else {
          setUser(user);
          // Armazenar o usuário em ambos storages para mais robustez
          if (user) {
            const userJson = JSON.stringify(user);
            localStorage.setItem('userSession', userJson);
            sessionStorage.setItem('userSession', userJson);
            
            // Criar um identificador de sessão persistente
            localStorage.setItem('supabase_session_token', user.id + '_' + Date.now());
          }
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        // Tentar renovar a sessão em caso de erro
        await refreshSession();
      } finally {
        setLoading(false);
      }
    };

    // Só executar checkUser na primeira vez que o componente for montado
    checkUser();
    sessionStorage.setItem('authChecked', 'true');

    // Configurar listener para mudanças na autenticação com forte controle de duplicidade
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN') {
          // Usar nosso token de sessão para verificar se é uma sessão existente
          const sessionToken = localStorage.getItem('supabase_session_token');
          
          // Se já temos um token de sessão para este usuário, ignorar o evento completamente
          if (sessionToken && session?.user?.id && sessionToken.startsWith(session.user.id)) {
            console.log('Evento SIGNED_IN ignorado: sessão existente detectada');
            
            // Mesmo quando ignoramos o evento, asseguramos que o usuário está definido corretamente
            if (!user && session?.user) {
              console.log('Restaurando sessão de usuário após recarregamento da página');
              setUser(session.user);
              
              // Atualizar storages com os dados mais recentes
              const userJson = JSON.stringify(session.user);
              localStorage.setItem('userSession', userJson);
              sessionStorage.setItem('userSession', userJson);
            }
            
            return;
          }
          
          console.log('Novo login detectado (usuário diferente ou primeira sessão)');
          if (session?.user) {
            // Atualizar o usuário
            setUser(session.user);
            
            // Atualizar storages
            const userJson = JSON.stringify(session.user);
            localStorage.setItem('userSession', userJson); 
            sessionStorage.setItem('userSession', userJson);
            
            // Atualizar o token de sessão
            localStorage.setItem('supabase_session_token', session.user.id + '_' + Date.now());
            
            // Limpar dados de projetos e outras configurações do localStorage
            // para garantir que os dados sejam sempre recarregados do Supabase ao fazer login
            console.log('Limpando localStorage para forçar recarga do Supabase');
            localStorage.removeItem('cachedProjects');
            localStorage.removeItem('cachedClients');
            localStorage.removeItem('workshopSettings');

            // Remover qualquer projeto em edição temporária
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('editing_project_')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Forçar a recarga apenas em novos logins reais
            localStorage.setItem('forceDataReload', 'true');
            sessionStorage.setItem('userAuthenticated', 'true');
          }
        }
        else if (event === 'SIGNED_OUT') {
          console.log('Logout detectado');
          setUser(null);
          
          // Limpar todas as flags de sessão
          sessionStorage.removeItem('userSession');
          sessionStorage.removeItem('authChecked');
          localStorage.removeItem('userSession');
          localStorage.removeItem('supabase_session_token');
          localStorage.removeItem('forceDataReload');
        }
        else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Quando o token for atualizado, sincronizar o usuário
          console.log('Token atualizado, atualizando dados do usuário');
          setUser(session.user);
          
          // Atualizar storages
          const userJson = JSON.stringify(session.user);
          localStorage.setItem('userSession', userJson);
          sessionStorage.setItem('userSession', userJson);
        }
        // Outros eventos são simplesmente ignorados
        else {
          console.log('Ignorando evento:', event);
        }
      }
    );
    
    // Cleanup
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    return await login(email, password);
  };

  const signUp = async (email: string, password: string, name: string, additionalData?: any) => {
    // Chame aqui o Supabase ou sua função de cadastro
    return await signUpApi(email, password, name, additionalData);
  };

  const signOut = async () => {
    await logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
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