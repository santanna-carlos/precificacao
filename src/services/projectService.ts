import { supabase } from '../supabase';
import { Project, ExpenseItem } from '../types';

// Função para converter o formato do projeto do frontend para o banco de dados
const projectToDbFormat = (project: Project) => {
  return {
    name: project.name,
    date: project.date,
    client_id: project.clientId,
    client_name: project.clientName,
    contact_phone: project.contactPhone,
    profitMargin: project.profitMargin,
    totalCost: project.totalCost,
    salePrice: project.salePrice,
    comments: project.comments,
    stages: project.stages, // Armazenado como JSONB
    fixedExpenseDays: project.fixedExpenseDays,
    useWorkshopForFixedExpenses: project.useWorkshopForFixedExpenses,
    frozenDailyCost: project.frozenDailyCost,
    price_type: project.priceType,
    lastModified: project.lastModified,
    estimated_completion_date: project.estimatedCompletionDate
  };
};

// Função para converter o formato do projeto do banco de dados para o frontend
const dbToProjectFormat = (dbProject: any, expenses: ExpenseItem[]): Project => {
  // Log para depuração
  console.log('Dados brutos do banco de dados:', dbProject);
  console.log('Data prevista no banco:', dbProject.estimated_completion_date);
  
  // Tratamento da data prevista
  let estimatedDate = null;
  if (dbProject.estimated_completion_date) {
    try {
      // Converter a data ISO para o formato esperado pelo input date (YYYY-MM-DD)
      const date = new Date(dbProject.estimated_completion_date);
      estimatedDate = date.toISOString().split('T')[0];
      console.log('Data prevista convertida:', estimatedDate);
    } catch (error) {
      console.error('Erro ao converter data prevista:', error);
      // Se houver erro na conversão, tentar usar a string diretamente
      // Isso é útil caso a data já esteja no formato YYYY-MM-DD
      if (typeof dbProject.estimated_completion_date === 'string') {
        estimatedDate = dbProject.estimated_completion_date;
        console.log('Usando data prevista como string:', estimatedDate);
      } else {
        estimatedDate = null;
      }
    }
  } else {
    console.log('Nenhuma data prevista encontrada no objeto do banco');
  }
  
  const project = {
    id: dbProject.id,
    name: dbProject.name,
    date: dbProject.date,
    clientId: dbProject.client_id,
    clientName: dbProject.client_name,
    contactPhone: dbProject.contact_phone,
    fixedExpenses: expenses.filter(e => e.type === 'fixed'),
    variableExpenses: expenses.filter(e => e.type === 'variable'),
    materials: expenses.filter(e => e.type === 'material'),
    profitMargin: dbProject.profitMargin,
    totalCost: dbProject.totalCost,
    salePrice: dbProject.salePrice,
    comments: dbProject.comments,
    stages: dbProject.stages || {
      orcamento: { completed: false, date: null },
      projetoTecnico: { completed: false, date: null },
      corte: { completed: false, date: null },
      fitamento: { completed: false, date: null },
      furacaoUsinagem: { completed: false, date: null },
      preMontagem: { completed: false, date: null },
      acabamento: { completed: false, date: null },
      entrega: { completed: false, date: null },
      instalacao: { completed: false, date: null },
      projetoCancelado: { completed: false, date: null },
    },
    lastModified: dbProject.lastModified,
    fixedExpenseDays: dbProject.fixedExpenseDays,
    useWorkshopForFixedExpenses: dbProject.useWorkshopForFixedExpenses,
    frozenDailyCost: dbProject.frozenDailyCost,
    priceType: dbProject.price_type || 'normal',
    estimatedCompletionDate: estimatedDate,
  };
  
  // Log para verificar o objeto final
  console.log('Projeto convertido para o frontend:', project);
  console.log('Data prevista após conversão:', project.estimatedCompletionDate);
  
  return project;
};

// Função para salvar as despesas do projeto
const saveProjectExpenses = async (projectId: string, expenses: ExpenseItem[], expenseType: 'fixed' | 'variable' | 'material') => {
  try {
    // Primeiro, excluir as despesas existentes deste tipo
    await supabase
      .from('project_expenses')
      .delete()
      .eq('project_id', projectId)
      .eq('type', expenseType);

    // Inserir as despesas uma por uma
    for (const expense of expenses) {
      const expenseEntry = {
        project_id: projectId,
        type: expenseType,
        quantity: expense.quantity,
        unitValue: expense.unitValue,
        customType: expense.customType,
      };
      
      const { error } = await supabase
        .from('project_expenses')
        .insert(expenseEntry);
        
      if (error) {
        console.error('Erro ao salvar despesa do projeto:', error);
        // Continua tentando inserir as outras despesas mesmo se uma falhar
      }
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Erro ao salvar despesas do projeto:', error);
    return { data: null, error };
  }
};

// Função para obter as despesas do projeto
const getProjectExpenses = async (projectId: string): Promise<ExpenseItem[]> => {
  const { data, error } = await supabase
    .from('project_expenses')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    console.error('Erro ao obter despesas do projeto:', error);
    return [];
  }

  // Log para debug
  console.log('Dados recebidos do banco:', data);

  // Converter os dados do banco para o formato esperado pelo frontend
  return data.map((expense: any) => {
    // Log para debug de cada item
    console.log('Processando despesa:', expense);
    
    return {
      id: expense.id,
      type: expense.type,
      quantity: expense.quantity,
      unitValue: expense.unitValue,
      total: expense.total,
      customType: expense.customType,
    };
  });
};

// Função para criar um novo projeto
export const createProject = async (project: Project): Promise<{ data: Project | null, error: any }> => {
  try {
    // Inserir o projeto no banco (user_id é definido automaticamente pelo trigger)
    const { data, error } = await supabase
      .from('projects')
      .insert(projectToDbFormat(project))
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar projeto:', error);
      return { data: null, error };
    }

    // Salvar as despesas do projeto
    await saveProjectExpenses(data.id, project.fixedExpenses, 'fixed');
    await saveProjectExpenses(data.id, project.variableExpenses, 'variable');
    await saveProjectExpenses(data.id, project.materials, 'material');

    // Obter as despesas para montar o objeto Project
    const expenses = await getProjectExpenses(data.id);

    return { data: dbToProjectFormat(data, expenses), error: null };
  } catch (error) {
    console.error('Erro inesperado ao criar projeto:', error);
    return { data: null, error };
  }
};

// Função para atualizar um projeto existente
export const updateProject = async (project: Project): Promise<{ data: Project | null, error: any }> => {
  try {
    // Adicionar log para debug
    console.log('Atualizando projeto no Supabase:', project);
    console.log('Data prevista sendo enviada:', project.estimatedCompletionDate);
    
    // Preparar os dados para atualização, garantindo que a data prevista seja tratada corretamente
    const updateData = {
      ...projectToDbFormat(project),
      lastModified: new Date().toISOString(),
    };
    
    // Verificar e formatar a data prevista explicitamente
    if (project.estimatedCompletionDate) {
      // Garantir que a data esteja em formato ISO (YYYY-MM-DD)
      updateData.estimated_completion_date = project.estimatedCompletionDate;
      console.log('Data prevista formatada para envio:', updateData.estimated_completion_date);
    } else {
      console.log('Nenhuma data prevista encontrada no objeto do projeto');
      // Definir explicitamente como null para garantir que o campo seja atualizado no banco
      updateData.estimated_completion_date = null;
    }
    
    console.log('Dados completos sendo enviados para atualização:', updateData);
    
    // Atualizar o projeto no banco
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', project.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar projeto:', error);
      return { data: null, error };
    }

    console.log('Resposta do Supabase após atualização:', data);
    console.log('Data prevista na resposta do Supabase:', data.estimated_completion_date);
    
    // Atualizar as despesas do projeto
    await saveProjectExpenses(project.id, project.fixedExpenses, 'fixed');
    await saveProjectExpenses(project.id, project.variableExpenses, 'variable');
    await saveProjectExpenses(project.id, project.materials, 'material');

    // Obter as despesas para montar o objeto Project
    const expenses = await getProjectExpenses(project.id);
    
    // Criar o objeto de retorno com os dados atualizados
    const updatedProject = dbToProjectFormat(data, expenses);
    console.log('Projeto final após atualização:', updatedProject);
    console.log('Data prevista no projeto final:', updatedProject.estimatedCompletionDate);

    return { data: updatedProject, error: null };
  } catch (error) {
    console.error('Erro inesperado ao atualizar projeto:', error);
    return { data: null, error };
  }
};

// Função para obter todos os projetos do usuário
export const getProjects = async (): Promise<{ data: Project[] | null, error: any }> => {
  try {
    // Obter os projetos do usuário (RLS já filtra por user_id)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('lastModified', { ascending: false });

    if (error) {
      console.error('Erro ao obter projetos:', error);
      return { data: null, error };
    }

    // Para cada projeto, obter suas despesas
    const projects: Project[] = [];

    for (const dbProject of data) {
      const expenses = await getProjectExpenses(dbProject.id);
      projects.push(dbToProjectFormat(dbProject, expenses));
    }

    return { data: projects, error: null };
  } catch (error) {
    console.error('Erro inesperado ao obter projetos:', error);
    return { data: null, error };
  }
};

// Função para obter um projeto específico
export const getProject = async (projectId: string): Promise<{ data: Project | null, error: any }> => {
  try {
    // Obter o projeto (RLS já filtra por user_id)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Erro ao obter projeto:', error);
      return { data: null, error };
    }

    // Obter as despesas do projeto
    const expenses = await getProjectExpenses(data.id);

    return { 
      data: dbToProjectFormat(data, expenses), 
      error: null 
    };
  } catch (error) {
    console.error('Erro inesperado ao obter projeto:', error);
    return { data: null, error };
  }
};

// Função para excluir um projeto
export const deleteProject = async (projectId: string): Promise<{ success: boolean, error: any }> => {
  try {
    // Excluir o projeto (RLS já filtra por user_id)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Erro ao excluir projeto:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Erro inesperado ao excluir projeto:', error);
    return { success: false, error };
  }
};