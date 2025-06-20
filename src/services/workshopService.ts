import { supabase } from '../supabase';
import { WorkshopSettings, WorkshopExpense } from '../types';

// Função para converter o formato das configurações da marcenaria do frontend para o banco de dados
const workshopToDbFormat = (workshop: WorkshopSettings, userId?: string) => {
  const dbFormat = {
    workingDaysPerMonth: workshop.workingDaysPerMonth,
    workshopName: workshop.workshopName || '', // Garantir que nunca seja null
    logoImage: workshop.logoImage,
    lastUpdated: workshop.lastUpdated,
    tax_percentage: workshop.taxPercentage // Adicionando o campo de porcentagem de imposto
  };
  
  // Adicionar user_id apenas se fornecido (para não sobrescrever o valor existente em atualizações)
  if (userId) {
    return {
      ...dbFormat,
      user_id: userId
    };
  }
  
  return dbFormat;
};

// Função para converter o formato das configurações da marcenaria do banco de dados para o frontend
const dbToWorkshopFormat = (dbWorkshop: any, expenses: WorkshopExpense[]): WorkshopSettings => {
  return {
    workingDaysPerMonth: dbWorkshop.workingDaysPerMonth || 22,
    workshopName: dbWorkshop.workshopName || '', // Garantir que nunca seja null
    logoImage: dbWorkshop.logoImage,
    lastUpdated: dbWorkshop.lastUpdated || new Date().toISOString(),
    expenses: expenses || [], // Garantir que nunca seja null
    taxPercentage: dbWorkshop.tax_percentage || 0 // Adicionando o campo de porcentagem de imposto
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
    
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Usuário atual:', user);
    
    if (!user) {
      console.error('Nenhum usuário autenticado encontrado');
      return { data: null, error: new Error('Usuário não autenticado') };
    }
    
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
      .eq('user_id', user.id)
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
      console.log('Criando novas configurações da marcenaria para o usuário:', user.id);
      // Criar novas configurações
      // Usar .select('*') em vez de .single() para evitar erro 406
      const dbData = workshopToDbFormat(safeSettings, user.id);
      console.log('Dados formatados para inserção:', dbData);
      
      const { data: newSettingsArray, error } = await supabase
        .from('workshop_settings')
        .insert(dbData)
        .select('*');

      console.log('Resposta após inserção:', { data: newSettingsArray, error });

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
    console.log('[WorkshopSettings] Salvando dados no localStorage:', finalSettings);
    localStorage.setItem('cachedWorkshopSettings', JSON.stringify(finalSettings));
    
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
  let workshopSettings: WorkshopSettings | null = null;
  
  try {
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Obtendo configurações para o usuário:', user?.id);
    
    if (!user) {
      console.error('Nenhum usuário autenticado encontrado');
      return { data: null, error: new Error('Usuário não autenticado') };
    }

    const { data: settingsArray, error } = await supabase
      .from('workshop_settings')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (error) {
      console.error('Erro ao buscar configurações da marcenaria:', error);
      return { data: null, error };
    }

    const settings = settingsArray && settingsArray.length > 0 ? settingsArray[0] : null;
    if (!settings) {
      console.log('Nenhuma configuração encontrada para o usuário:', user.id);
      
      // Verificar se temos dados no localStorage
      const cachedSettings = localStorage.getItem('cachedWorkshopSettings');
      
      if (cachedSettings) {
        try {
          const parsedData = JSON.parse(cachedSettings);
          
          // Verificar se os dados em cache ainda são válidos (opcional)
          const cacheValid = true; // Adicione sua lógica de validação de cache aqui se necessário
          
          if (cacheValid) {
            console.log('Usando dados em cache do localStorage:', parsedData);
            workshopSettings = parsedData;
          } else {
            console.log('Dados em cache expirados, usando valores padrão');
            workshopSettings = {
              workingDaysPerMonth: 22,
              workshopName: '',
              logoImage: undefined,
              expenses: [],
              taxPercentage: 0,
              lastUpdated: new Date().toISOString()
            };
          }
        } catch (parseError) {
          console.error('Erro ao analisar dados em cache:', parseError);
          workshopSettings = {
            workingDaysPerMonth: 22,
            workshopName: '',
            logoImage: undefined,
            expenses: [],
            taxPercentage: 0,
            lastUpdated: new Date().toISOString()
          };
        }
      } else {
        // If no data in localStorage, create default settings
        workshopSettings = {
          workingDaysPerMonth: 22,
          workshopName: '',
          logoImage: undefined,
          expenses: [],
          taxPercentage: 0,
          lastUpdated: new Date().toISOString()
        };
      }
      
      // Salvar as configurações padrão no localStorage para uso futuro
      if (!localStorage.getItem('cachedWorkshopSettings')) {
        console.log('[WorkshopSettings] Salvando defaultSettings no localStorage pois não havia dados prévios.');
        localStorage.setItem('cachedWorkshopSettings', JSON.stringify(workshopSettings));
      } else {
        console.log('[WorkshopSettings] NÃO sobrescreveu localStorage, pois já havia dados salvos.');
      }
      
      return { data: workshopSettings, error: null };
    }

    console.log('Configurações encontradas:', settings);
    
    // Buscar despesas
    const expenses = await getWorkshopExpenses(settings.id);
    return { data: dbToWorkshopFormat(settings, expenses), error: null };
  } catch (error) {
    console.error('Erro ao obter configurações da marcenaria:', error);
    
    // Try to recover from localStorage as last resort
    try {
      const cachedData = localStorage.getItem('cachedWorkshopSettings');
      if (cachedData) {
        console.log('Recuperando de emergência dados do localStorage após erro');
        return { data: JSON.parse(cachedData), error: null };
      }
    } catch (parseError) {
      console.error('Erro ao recuperar dados em cache de emergência:', parseError);
    }
    
    return { 
      data: {
        workingDaysPerMonth: 22,
        workshopName: '',
        logoImage: undefined,
        expenses: [],
        taxPercentage: 0,
        lastUpdated: new Date().toISOString()
      }, 
      error 
    };
  }
};
