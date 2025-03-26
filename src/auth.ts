import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export async function registrar(email: string, senha: string, nome: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { name: nome },
    },
  });

  if (error) {
    console.error('Erro no registro:', error.message);
    return { error };
  }
  return { data };
}

export async function login(email: string, senha: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    console.error('Erro no login:', error.message);
    return { error };
  }
  return { data };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Erro ao fazer logout:', error.message);
    return { error };
  }
  return { success: true };
}

export async function getCurrentUser(): Promise<{ user: User | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return { user, error: null };
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return { user: null, error: error as Error };
  }
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    console.error('Erro ao solicitar redefinição de senha:', error.message);
    return { error };
  }
  return { success: true };
}

// Função para ouvir mudanças na sessão do usuário
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}