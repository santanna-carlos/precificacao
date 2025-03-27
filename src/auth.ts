import { supabase } from './supabase';

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
    return null;
  }
  return data;
}

export async function login(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Erro no login:', error.message);
      return { error };
    }

    return { data };
  } catch (error) {
    console.error('Erro inesperado no login:', error);
    return { error };
  }
}

export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error.message);
    }
  } catch (error) {
    console.error('Erro inesperado ao fazer logout:', error);
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao obter sessão:', error.message);
      return { user: null, error };
    }
    
    if (!data.session) {
      return { user: null };
    }
    
    return { user: data.session.user };
  } catch (error) {
    console.error('Erro inesperado ao obter usuário atual:', error);
    return { user: null, error };
  }
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Erro ao solicitar redefinição de senha:', error.message);
      return { error };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro inesperado ao solicitar redefinição de senha:', error);
    return { error };
  }
}