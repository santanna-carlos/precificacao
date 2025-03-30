import { supabase } from '../supabase';
import { WorkshopSettings, WorkshopExpense } from '../types';

// Função para converter o formato das configurações da marcenaria do frontend para o banco de dados
const workshopToDbFormat = (workshop: WorkshopSettings) => {
  return {
    workingDaysPerMonth: workshop.workingDaysPerMonth,
    workshopName: workshop.workshopName,
    logoImage: workshop.logoImage,
    lastUpdated: workshop.lastUpdated,
  };
};

// Função para converter o formato das configurações da marcenaria do banco de dados para o frontend
const dbToWorkshopFormat = (dbWorkshop: any, expenses: WorkshopExpense[]): WorkshopSettings => {
  return {
    workingDaysPerMonth: dbWorkshop.workingDaysPerMonth,
    workshopName: dbWorkshop.workshopName,
    logoImage: dbWorkshop.logoImage,
    lastUpdated: dbWorkshop.lastUpdated,
    expenses: expenses,
  };
};

// Função para salvar as despesas da marcenaria
const saveWorkshopExpenses = async (workshopSettingsId: string, expenses: WorkshopExpense[]) => {
  try {
    // Primeiro, excluir as despesas existentes
    await supabase
      .from('workshop_expenses')
      .delete()
      .eq('workshop_settings_id', workshopSettingsId);

    // Inserir as despesas uma por uma
    for (const expense of expenses) {
      const expenseEntry = {
        workshop_settings_id: workshopSettingsId,
        type: expense.type,
        description: expense.description,
        quantity: expense.quantity,
        unitValue: expense.unitValue,
        note: expense.note,
      };
      
      const { error } = await supabase
        .from('workshop_expenses')
        .insert(expenseEntry);
        
      if (error) {
        console.error('Erro ao salvar despesa da marcenaria:', error);
        // Continua tentando inserir as outras despesas mesmo se uma falhar
      }
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Erro ao salvar despesas da marcenaria:', error);
    return { data: null, error };
  }
};

// Função para obter as despesas da marcenaria
const getWorkshopExpenses = async (workshopSettingsId: string): Promise<WorkshopExpense[]> => {
  const { data, error } = await supabase
    .from('workshop_expenses')
    .select('*')
    .eq('workshop_settings_id', workshopSettingsId);

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
    unitValue: expense.unitValue,
    note: expense.note,
  }));
};

// Função para salvar as configurações da marcenaria
export const saveWorkshopSettings = async (settings: WorkshopSettings): Promise<{ data: WorkshopSettings | null, error: any }> => {
  try {
    // Verificar se já existe uma configuração para este usuário
    const { data: existingSettings } = await supabase
      .from('workshop_settings')
      .select('id')
      .single();

    let workshopSettingsId;

    if (existingSettings) {
      // Atualizar as configurações existentes
      const { data, error } = await supabase
        .from('workshop_settings')
        .update({
          ...workshopToDbFormat(settings),
          lastUpdated: new Date().toISOString(),
        })
        .eq('id', existingSettings.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar configurações da marcenaria:', error);
        return { data: null, error };
      }

      workshopSettingsId = data.id;
    } else {
      // Criar novas configurações
      const { data, error } = await supabase
        .from('workshop_settings')
        .insert(workshopToDbFormat(settings))
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar configurações da marcenaria:', error);
        return { data: null, error };
      }

      workshopSettingsId = data.id;
    }

    // Salvar as despesas da marcenaria
    await saveWorkshopExpenses(workshopSettingsId, settings.expenses);

    // Obter as despesas para montar o objeto WorkshopSettings
    const expenses = await getWorkshopExpenses(workshopSettingsId);

    return { 
      data: { ...settings, id: workshopSettingsId, expenses, lastUpdated: new Date().toISOString() }, 
      error: null 
    };
  } catch (error) {
    console.error('Erro inesperado ao salvar configurações da marcenaria:', error);
    return { data: null, error };
  }
};

// Função para obter as configurações da marcenaria
export const getWorkshopSettings = async (): Promise<{ data: WorkshopSettings | null, error: any }> => {
  try {
    // Obter as configurações da marcenaria (RLS já filtra por user_id)
    const { data, error } = await supabase
      .from('workshop_settings')
      .select('*')
      .single();

    if (error) {
      // Se não encontrar, criar configurações padrão
      if (error.code === 'PGRST116') {
        const defaultSettings: WorkshopSettings = {
          id: '', // Será preenchido após a inserção
          workingDaysPerMonth: 22,
          workshopName: null,
          logoImage: null,
          expenses: [],
          lastUpdated: new Date().toISOString(),
        };

        const { data: newSettings, error: insertError } = await supabase
          .from('workshop_settings')
          .insert(workshopToDbFormat(defaultSettings))
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao criar configurações padrão:', insertError);
          return { data: null, error: insertError };
        }

        return {
          data: { ...defaultSettings, id: newSettings.id, lastUpdated: newSettings.lastUpdated },
          error: null,
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