import { supabase } from '../supabase';
import { WorkshopSettings, WorkshopExpense } from '../types';

// Função para converter o formato das configurações da marcenaria do frontend para o banco de dados
const workshopToDbFormat = (workshop: WorkshopSettings, userId: string) => {
  return {
    working_days_per_month: workshop.workingDaysPerMonth,
    workshop_name: workshop.workshopName,
    logo_image: workshop.logoImage,
    user_id: userId
  };
};

// Função para converter o formato das configurações da marcenaria do banco de dados para o frontend
const dbToWorkshopFormat = (dbWorkshop: any, expenses: WorkshopExpense[]): WorkshopSettings => {
  return {
    workingDaysPerMonth: dbWorkshop.working_days_per_month,
    workshopName: dbWorkshop.workshop_name,
    logoImage: dbWorkshop.logo_image,
    lastUpdated: dbWorkshop.last_updated,
    expenses: expenses
  };
};

// Função para salvar as despesas da marcenaria
const saveWorkshopExpenses = async (workshopId: string, expenses: WorkshopExpense[]) => {
  // Primeiro, excluir as despesas existentes
  await supabase
    .from('workshop_expenses')
    .delete()
    .eq('workshop_id', workshopId);
  
  // Depois, inserir as novas despesas
  const expenseEntries = expenses.map(expense => ({
    workshop_id: workshopId,
    type: expense.type,
    description: expense.description,
    quantity: expense.quantity,
    unit_value: expense.unitValue,
    note: expense.note
  }));
  
  if (expenseEntries.length > 0) {
    return await supabase.from('workshop_expenses').insert(expenseEntries);
  }
  
  return { data: null, error: null };
};

// Função para obter as despesas da marcenaria
const getWorkshopExpenses = async (workshopId: string): Promise<WorkshopExpense[]> => {
  const { data, error } = await supabase
    .from('workshop_expenses')
    .select('*')
    .eq('workshop_id', workshopId);
  
  if (error) {
    console.error('Erro ao obter despesas da marcenaria:', error);
    return [];
  }
  
  // Converter os dados do banco para o formato esperado pelo frontend
  return data.map((expense: any) => ({
    id: expense.id,
    type: expense.type,
    description: expense.description,
    quantity: expense.quantity,
    unitValue: expense.unit_value,
    note: expense.note
  }));
};

// Função para salvar as configurações da marcenaria
export const saveWorkshopSettings = async (settings: WorkshopSettings): Promise<{ data: WorkshopSettings | null, error: any }> => {
  try {
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuário não autenticado' };
    }
    
    // Verificar se já existe uma configuração para este usuário
    const { data: existingSettings } = await supabase
      .from('workshop_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    let workshopId;
    
    if (existingSettings) {
      // Atualizar as configurações existentes
      const { data, error } = await supabase
        .from('workshop_settings')
        .update({
          ...workshopToDbFormat(settings, user.id),
          last_updated: new Date().toISOString()
        })
        .eq('id', existingSettings.id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar configurações da marcenaria:', error);
        return { data: null, error };
      }
      
      workshopId = data.id;
    } else {
      // Criar novas configurações
      const { data, error } = await supabase
        .from('workshop_settings')
        .insert(workshopToDbFormat(settings, user.id))
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar configurações da marcenaria:', error);
        return { data: null, error };
      }
      
      workshopId = data.id;
    }
    
    // Salvar as despesas da marcenaria
    await saveWorkshopExpenses(workshopId, settings.expenses);
    
    return { data: settings, error: null };
  } catch (error) {
    console.error('Erro inesperado ao salvar configurações da marcenaria:', error);
    return { data: null, error };
  }
};

// Função para obter as configurações da marcenaria
export const getWorkshopSettings = async (): Promise<{ data: WorkshopSettings | null, error: any }> => {
  try {
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuário não autenticado' };
    }
    
    // Obter as configurações da marcenaria
    const { data, error } = await supabase
      .from('workshop_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      // Se não encontrar, retornar configurações padrão
      if (error.code === 'PGRST116') {
        return {
          data: {
            workingDaysPerMonth: 22,
            expenses: [],
            lastUpdated: new Date().toISOString()
          },
          error: null
        };
      }
      
      console.error('Erro ao obter configurações da marcenaria:', error);
      return { data: null, error };
    }
    
    // Obter as despesas da marcenaria
    const expenses = await getWorkshopExpenses(data.id);
    
    return { 
      data: dbToWorkshopFormat(data, expenses), 
      error: null 
    };
  } catch (error) {
    console.error('Erro inesperado ao obter configurações da marcenaria:', error);
    return { data: null, error };
  }
};