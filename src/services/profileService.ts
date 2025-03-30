// profileService.ts
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

// Função para obter o perfil do usuário atual
export const getUserProfile = async (): Promise<{ data: UserProfile | null, error: any }> => {
  try {
    // Obter o usuário atual
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Erro ao obter usuário:', userError);
      return { data: null, error: userError };
    }
    
    if (!userData.user) {
      return { data: null, error: 'Usuário não encontrado' };
    }
    
    // Retornar os dados do usuário
    return {
      data: {
        id: userData.user.id,
        email: userData.user.email || '',
        name: userData.user.user_metadata?.name || '',
        avatar_url: userData.user.user_metadata?.avatar_url,
      },
      error: null
    };
  } catch (error) {
    console.error('Erro inesperado ao obter perfil:', error);
    return { data: null, error };
  }
};

// Função para atualizar o nome do usuário
export const updateUserName = async (name: string): Promise<{ data: any, error: any }> => {
  try {
    // Atualizar os metadados do usuário
    const { data: authData, error: authError } = await supabase.auth.updateUser({
      data: { name }
    });
    
    if (authError) {
      console.error('Erro ao atualizar metadados do usuário:', authError);
      return { data: null, error: authError };
    }
    
    return { data: { name }, error: null };
  } catch (error) {
    console.error('Erro inesperado ao atualizar nome:', error);
    return { data: null, error };
  }
};

// Função para atualizar o email do usuário
export const updateUserEmail = async (email: string): Promise<{ data: any, error: any }> => {
  try {
    const { data, error } = await supabase.auth.updateUser({ email });
    
    if (error) {
      console.error('Erro ao atualizar email:', error);
      return { data: null, error };
    }
    
    return { 
      data: { message: 'Email de confirmação enviado' }, 
      error: null 
    };
  } catch (error) {
    console.error('Erro inesperado ao atualizar email:', error);
    return { data: null, error };
  }
};

// Função para atualizar a senha do usuário
export const updateUserPassword = async (password: string): Promise<{ data: any, error: any }> => {
  try {
    const { data, error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      console.error('Erro ao atualizar senha:', error);
      return { data: null, error };
    }
    
    return { data: { message: 'Senha atualizada com sucesso' }, error: null };
  } catch (error) {
    console.error('Erro inesperado ao atualizar senha:', error);
    return { data: null, error };
  }
};