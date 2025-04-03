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
    // Usar .select('*').limit(1) em vez de .single() para evitar erro 406
    const { data: existingSettingsArray, error: fetchError } = await supabase
      .from('workshop_settings')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('Erro ao verificar configurações existentes:', fetchError);
      return { data: null, error: fetchError };
    }

    // Obter o primeiro item do array, se existir
    const existingSettings = existingSettingsArray && existingSettingsArray.length > 0 
      ? existingSettingsArray[0] 
      : null;

    let workshopSettingsId;

    if (existingSettings) {
      console.log('Atualizando configurações existentes ID:', existingSettings.id);
      // Atualizar as configurações existentes
      // Usar .select('*') em vez de .single() para evitar erro 406
      const { data: updatedSettingsArray, error } = await supabase
        .from('workshop_settings')
        .update({
          ...workshopToDbFormat(safeSettings),
          lastUpdated: new Date().toISOString(),
        })
        .eq('id', existingSettings.id)
        .select('*');

      if (error) {
        console.error('Erro ao atualizar configurações da marcenaria:', error);
        return { data: null, error };
      }

      // Obter o primeiro item do array, se existir
      const updatedSettings = updatedSettingsArray && updatedSettingsArray.length > 0 
        ? updatedSettingsArray[0] 
        : null;

      if (!updatedSettings) {
        console.error('Nenhum dado retornado após atualização');
        return { data: null, error: new Error('Nenhum dado retornado após atualização') };
      }

      workshopSettingsId = updatedSettings.id;
    } else {
      console.log('Criando novas configurações da marcenaria');
      // Criar novas configurações
      // Usar .select('*') em vez de .single() para evitar erro 406
      const { data: newSettingsArray, error } = await supabase
        .from('workshop_settings')
        .insert(workshopToDbFormat(safeSettings))
        .select('*');

      if (error) {
        console.error('Erro ao criar configurações da marcenaria:', error);
        return { data: null, error };
      }

      // Obter o primeiro item do array, se existir
      const newSettings = newSettingsArray && newSettingsArray.length > 0 
        ? newSettingsArray[0] 
        : null;

      if (!newSettings) {
        console.error('Nenhum dado retornado após inserção');
        return { data: null, error: new Error('Nenhum dado retornado após inserção') };
      }

      workshopSettingsId = newSettings.id;
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
      expenses, 
      lastUpdated: new Date().toISOString() 
    };
    
    console.log('Configurações salvas com sucesso:', finalSettings);
    
    // Atualizar o localStorage para garantir que os dados estejam disponíveis mesmo offline
    localStorage.setItem('workshopSettings', JSON.stringify(finalSettings));
    
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

    console.log('Resposta do Supabase:', { data: workshopData, error });

    // Se houver erro ou não houver dados, criar configurações padrão
    if (error || !workshopData || workshopData.length === 0) {
      console.log('Erro ou configurações não encontradas:', error);
      console.log('Criando configurações padrão...');
      
      const defaultSettings: WorkshopSettings = {
        workingDaysPerMonth: 22,
        workshopName: '', // String vazia em vez de null
        logoImage: null,
        expenses: [],
        lastUpdated: new Date().toISOString(),
      };

      // Verificar se temos dados no localStorage
      const localStorageSettings = localStorage.getItem('workshopSettings');
      if (localStorageSettings) {
        try {
          const parsedSettings = JSON.parse(localStorageSettings);
          console.log('Usando configurações do localStorage:', parsedSettings);
          return { data: parsedSettings, error: null };
        } catch (parseError) {
          console.error('Erro ao analisar configurações do localStorage:', parseError);
        }
      }

      try {
        // Tentar inserir configurações padrão
        const { data: newSettingsArray, error: insertError } = await supabase
          .from('workshop_settings')
          .insert(workshopToDbFormat(defaultSettings))
          .select('*');

        console.log('Resposta após inserção de configurações padrão:', { data: newSettingsArray, error: insertError });

        if (insertError || !newSettingsArray || newSettingsArray.length === 0) {
          console.error('Erro ao criar configurações padrão:', insertError);
          
          // Salvar as configurações padrão no localStorage para uso futuro
          localStorage.setItem('workshopSettings', JSON.stringify(defaultSettings));
          
          return { 
            data: defaultSettings, 
            error: null 
          };
        }

        const newSettings = newSettingsArray[0];
        console.log('Configurações padrão criadas com sucesso:', newSettings);
        
        // Obter as despesas (que serão vazias para um novo registro)
        const expenses: WorkshopExpense[] = [];
        
        const finalSettings = { 
          ...defaultSettings, 
          expenses 
        };
        
        // Salvar as configurações no localStorage para uso futuro
        localStorage.setItem('workshopSettings', JSON.stringify(finalSettings));
        
        return {
          data: finalSettings,
          error: null,
        };
      } catch (insertError) {
        console.error('Exceção ao criar configurações padrão:', insertError);
        
        // Salvar as configurações padrão no localStorage para uso futuro
        localStorage.setItem('workshopSettings', JSON.stringify(defaultSettings));
        
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
      
      // Salvar as configurações no localStorage para uso futuro
      localStorage.setItem('workshopSettings', JSON.stringify(workshopFormattedData));
      
      return { 
        data: workshopFormattedData, 
        error: null 
      };
    } catch (expensesError) {
      console.error('Erro ao obter despesas:', expensesError);
      // Continuar mesmo com erro nas despesas, retornando array vazio
      const workshopFormattedData = dbToWorkshopFormat(workshopSettings, []);
      
      // Salvar as configurações no localStorage para uso futuro
      localStorage.setItem('workshopSettings', JSON.stringify(workshopFormattedData));
      
      return { 
        data: workshopFormattedData, 
        error: null 
      };
    }
  } catch (error) {
    console.error('Erro inesperado ao obter configurações da marcenaria:', error);
    
    // Verificar se temos dados no localStorage
    const localStorageSettings = localStorage.getItem('workshopSettings');
    if (localStorageSettings) {
      try {
        const parsedSettings = JSON.parse(localStorageSettings);
        console.log('Usando configurações do localStorage após erro:', parsedSettings);
        return { data: parsedSettings, error: null };
      } catch (parseError) {
        console.error('Erro ao analisar configurações do localStorage:', parseError);
      }
    }
    
    // Retornar configurações padrão mesmo com erro
    const defaultSettings = {
      workingDaysPerMonth: 22,
      workshopName: '',
      logoImage: null,
      expenses: [],
      lastUpdated: new Date().toISOString(),
    };
    
    // Salvar as configurações padrão no localStorage para uso futuro
    localStorage.setItem('workshopSettings', JSON.stringify(defaultSettings));
    
    return { 
      data: defaultSettings, 
      error: null 
    };
  }
};