import { supabase } from '../supabase';
import { Client } from '../types';

// Função para converter o formato do cliente do frontend para o banco de dados
const clientToDbFormat = (client: Client, userId: string) => {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    address: client.address,
    notes: client.notes,
    user_id: userId
  };
};

// Função para converter o formato do cliente do banco de dados para o frontend
const dbToClientFormat = (dbClient: any): Client => {
  return {
    id: dbClient.id,
    name: dbClient.name,
    phone: dbClient.phone,
    email: dbClient.email,
    address: dbClient.address,
    notes: dbClient.notes,
    createdAt: dbClient.created_at,
    lastModified: dbClient.last_modified
  };
};

// Função para criar um novo cliente
export const createClient = async (client: Omit<Client, 'id' | 'createdAt'>): Promise<{ data: Client | null, error: any }> => {
  try {
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuário não autenticado' };
    }
    
    const newClient = {
      ...client,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    // Inserir o cliente no banco
    const { data, error } = await supabase
      .from('clients')
      .insert(clientToDbFormat(newClient, user.id))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar cliente:', error);
      return { data: null, error };
    }
    
    return { data: dbToClientFormat(data), error: null };
  } catch (error) {
    console.error('Erro inesperado ao criar cliente:', error);
    return { data: null, error };
  }
};

// Função para atualizar um cliente existente
export const updateClient = async (client: Client): Promise<{ data: Client | null, error: any }> => {
  try {
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuário não autenticado' };
    }
    
    // Atualizar o cliente no banco
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...clientToDbFormat(client, user.id),
        last_modified: new Date().toISOString()
      })
      .eq('id', client.id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      return { data: null, error };
    }
    
    return { data: dbToClientFormat(data), error: null };
  } catch (error) {
    console.error('Erro inesperado ao atualizar cliente:', error);
    return { data: null, error };
  }
};

// Função para obter todos os clientes do usuário
export const getClients = async (): Promise<{ data: Client[] | null, error: any }> => {
  try {
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuário não autenticado' };
    }
    
    // Obter os clientes do usuário
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) {
      console.error('Erro ao obter clientes:', error);
      return { data: null, error };
    }
    
    return { data: data.map(dbToClientFormat), error: null };
  } catch (error) {
    console.error('Erro inesperado ao obter clientes:', error);
    return { data: null, error };
  }
};

// Função para excluir um cliente
export const deleteClient = async (clientId: string): Promise<{ success: boolean, error: any }> => {
  try {
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    // Excluir o cliente
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Erro ao excluir cliente:', error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Erro inesperado ao excluir cliente:', error);
    return { success: false, error };
  }
};