import { supabase } from '../supabase';
import { WorkshopSettings, WorkshopExpense } from '../types';

// Função para converter o formato das configurações da marcenaria do frontend para o banco de dados
const workshopToDbFormat = (workshop: WorkshopSettings) => {
  return {
    workingDaysPerMonth: workshop.workingDaysPerMonth,
    workshopName: workshop.workshopName || '', // Garantir que nunca seja null
    logoImage: workshop.logoImage,
    lastUpdated: workshop.lastUpdated,
  };
};

// Função para converter o formato das configurações da marcenaria do banco de dados para o frontend
const dbToWorkshopFormat = (dbWorkshop: any, expenses: WorkshopExpense[]): WorkshopSettings => {
  return {
    id: dbWorkshop.id,
    workingDaysPerMonth: dbWorkshop.workingDaysPerMonth || 22,
    workshopName: dbWorkshop.workshopName || '', // Garantir que nunca seja null
    logoImage: dbWorkshop.logoImage,
    lastUpdated: dbWorkshop.lastUpdated || new Date().toISOString(),
    expenses: expenses || [], // Garantir que nunca seja null
  };
};

// Função para salvar as despesas da marcenaria
const saveWorkshopExpenses = async (workshopSettingsId: string, expenses: WorkshopExpense[]) => {
  try {
    console.log(`Salvando ${expenses.length} despesas para a marcenaria ID: ${workshopSettingsId}`);
    
    // Primeiro, excluir as despesas existentes
    const { error: deleteError } = await supabase
      .from('workshop_expenses')
      .delete()
      .eq('workshop_settings_id', workshopSettingsId);
      
    if (deleteError) {
      console.error('Erro ao excluir despesas existentes:', deleteError);
      return { data: null, error: deleteError };
    }

    // Se não houver despesas para inserir, retornar
    if (!expenses || expenses.length === 0) {
      console.log('Nenhuma despesa para inserir');
      return { data: null, error: null };
    }

    // Preparar todas as despesas para inserção em lote
    const expensesToInsert = expenses.map(expense => ({
      workshop_settings_id: workshopSettingsId,
      type: expense.type || '',
      description: expense.description || '',
      quantity: expense.quantity || 0,
      unitValue: expense.unitValue || 0,
      note: expense.note || '',
    }));
    
    // Inserir todas as despesas de uma vez
    const { error: insertError } = await supabase
      .from('workshop_expenses')
      .insert(expensesToInsert);
      
    if (insertError) {
      console.error('Erro ao inserir despesas:', insertError);
      return { data: null, error: insertError };
    }
    
    console.log(`${expenses.length} despesas salvas com sucesso`);
    return { data: null, error: null };
  } catch (error) {
    console.error('Erro ao salvar despesas da marcenaria:', error);
    return { data: null, error };
  }
};

// Função para obter as despesas da marcenaria
const getWorkshopExpenses = async (workshopSettingsId: string): Promise<WorkshopExpense[]> => {
  try {
    console.log(`Obtendo despesas para a marcenaria ID: ${workshopSettingsId}`);
    
    const { data, error } = await supabase
      .from('workshop_expenses')
      .select('*')
      .eq('workshop_settings_id', workshopSettingsId);

    if (error) {
      console.error('Erro ao obter despesas da marcenaria:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('Nenhuma despesa encontrada');
      return [];
    }

    // Converter os dados do banco para o formato esperado pelo frontend
    const formattedExpenses = data.map((expense: any) => ({
      id: expense.id,
      type: expense.type || '',
      description: expense.description || '',
      quantity: expense.quantity || 0,
      unitValue: expense.unitValue || 0,
      note: expense.note || '',
    }));
    
    console.log(`${formattedExpenses.length} despesas obtidas com sucesso`);
    return formattedExpenses;
  } catch (error) {
    console.error('Erro ao obter despesas da marcenaria:', error);
    return [];
  }
};

// Função para salvar as configurações da marcenaria
export const saveWorkshopSettings = async (settings: WorkshopSettings): Promise<{ data: WorkshopSettings | null, error: any }> => {
  try {
    console.log('Salvando configurações da marcenaria:', settings);
    
    // Garantir que workshopName seja uma string
    const safeSettings = {
      ...settings,
      workshopName: settings.workshopName || '',
      expenses: settings.expenses || []
    };
    
    // Verificar se já existe uma configuração para este usuário
    const { data: existingSettings, error: fetchError } = await supabase
      .from('workshop_settings')
      .select('id')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao verificar configurações existentes:', fetchError);
      return { data: null, error: fetchError };
    }

    let workshopSettingsId;

    if (existingSettings) {
      console.log('Atualizando configurações existentes ID:', existingSettings.id);
      // Atualizar as configurações existentes
      const { data, error } = await supabase
        .from('workshop_settings')
        .update({
          ...workshopToDbFormat(safeSettings),
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
      console.log('Criando novas configurações da marcenaria');
      // Criar novas configurações
      const { data, error } = await supabase
        .from('workshop_settings')
        .insert(workshopToDbFormat(safeSettings))
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar configurações da marcenaria:', error);
        return { data: null, error };
      }

      workshopSettingsId = data.id;
    }

    // Salvar as despesas da marcenaria
    const { error: expensesError } = await saveWorkshopExpenses(workshopSettingsId, safeSettings.expenses);
    
    if (expensesError) {
      console.error('Erro ao salvar despesas:', expensesError);
      // Continuar mesmo com erro nas despesas, para não perder as outras configurações
    }

    // Obter as despesas para montar o objeto WorkshopSettings
    const expenses = await getWorkshopExpenses(workshopSettingsId);

    const finalSettings = { 
      ...safeSettings, 
      id: workshopSettingsId, 
      expenses, 
      lastUpdated: new Date().toISOString() 
    };
    
    console.log('Configurações salvas com sucesso:', finalSettings);
    
    return { 
      data: finalSettings, 
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
    console.log('Obtendo configurações da marcenaria...');
    
    // Abordagem alternativa: usar .select('*').limit(1) em vez de .single()
    // Isso evita o erro 406 em alguns casos
    const { data: workshopData, error } = await supabase
      .from('workshop_settings')
      .select('*')
      .limit(1);

    // Se houver erro ou não houver dados, criar configurações padrão
    if (error || !workshopData || workshopData.length === 0) {
      console.log('Erro ou configurações não encontradas:', error);
      console.log('Criando configurações padrão...');
      
      const defaultSettings: WorkshopSettings = {
        id: '', // Será preenchido após a inserção
        workingDaysPerMonth: 22,
        workshopName: '', // String vazia em vez de null
        logoImage: null,
        expenses: [],
        lastUpdated: new Date().toISOString(),
      };

      try {
        // Tentar inserir configurações padrão
        const { data: newSettings, error: insertError } = await supabase
          .from('workshop_settings')
          .insert(workshopToDbFormat(defaultSettings))
          .select();

        if (insertError || !newSettings || newSettings.length === 0) {
          console.error('Erro ao criar configurações padrão:', insertError);
          return { 
            data: defaultSettings, 
            error: null 
          };
        }

        console.log('Configurações padrão criadas com sucesso:', newSettings[0]);
        
        // Obter as despesas (que serão vazias para um novo registro)
        const expenses: WorkshopExpense[] = [];
        
        return {
          data: { 
            ...defaultSettings, 
            id: newSettings[0].id, 
            lastUpdated: newSettings[0].lastUpdated,
            expenses
          },
          error: null,
        };
      } catch (insertError) {
        console.error('Exceção ao criar configurações padrão:', insertError);
        return { 
          data: defaultSettings, 
          error: null 
        };
      }
    }

    // Usar o primeiro item do array retornado
    const workshopSettings = workshopData[0];
    console.log('Configurações da marcenaria obtidas:', workshopSettings);
    
    // Obter as despesas da marcenaria
    try {
      const expenses = await getWorkshopExpenses(workshopSettings.id);
      console.log(`Obtidas ${expenses.length} despesas para a marcenaria:`, expenses);

      const workshopFormattedData = dbToWorkshopFormat(workshopSettings, expenses);
      console.log('Dados formatados da marcenaria:', workshopFormattedData);
      
      return { 
        data: workshopFormattedData, 
        error: null 
      };
    } catch (expensesError) {
      console.error('Erro ao obter despesas:', expensesError);
      // Continuar mesmo com erro nas despesas, retornando array vazio
      const workshopFormattedData = dbToWorkshopFormat(workshopSettings, []);
      return { 
        data: workshopFormattedData, 
        error: null 
      };
    }
  } catch (error) {
    console.error('Erro inesperado ao obter configurações da marcenaria:', error);
    // Retornar configurações padrão mesmo com erro
    return { 
      data: {
        id: '',
        workingDaysPerMonth: 22,
        workshopName: '',
        logoImage: null,
        expenses: [],
        lastUpdated: new Date().toISOString(),
      }, 
      error: null 
    };
  }
};