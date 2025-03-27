import { supabase } from '../supabase';
import { Project, ExpenseItem, ProjectStages } from '../types';

// Função para converter o formato do projeto do frontend para o banco de dados
const projectToDbFormat = (project: Project, userId: string) => {
  return {
    id: project.id,
    name: project.name,
    date: project.date,
    client_id: project.clientId,
    client_name: project.clientName,
    contact_phone: project.contactPhone,
    profit_margin: project.profitMargin,
    total_cost: project.totalCost,
    sale_price: project.salePrice,
    comments: project.comments,
    fixed_expense_days: project.fixedExpenseDays,
    use_workshop_for_fixed_expenses: project.useWorkshopForFixedExpenses,
    frozen_daily_cost: project.frozenDailyCost,
    price_type: project.priceType,
    markup_percentage: project.markupPercentage,
    estimated_completion_date: project.estimatedCompletionDate,
    user_id: userId
  };
};

// Função para converter o formato do projeto do banco de dados para o frontend
const dbToProjectFormat = (dbProject: any, expenses: ExpenseItem[], stages: ProjectStages): Project => {
  return {
    id: dbProject.id,
    name: dbProject.name,
    date: dbProject.date,
    clientId: dbProject.client_id,
    clientName: dbProject.client_name,
    contactPhone: dbProject.contact_phone,
    fixedExpenses: expenses.filter(e => e.type === 'fixed'),
    variableExpenses: expenses.filter(e => e.type === 'variable'),
    materials: expenses.filter(e => e.type === 'material'),
    profitMargin: dbProject.profit_margin,
    totalCost: dbProject.total_cost,
    salePrice: dbProject.sale_price,
    comments: dbProject.comments,
    stages: stages,
    lastModified: dbProject.last_modified,
    fixedExpenseDays: dbProject.fixed_expense_days,
    useWorkshopForFixedExpenses: dbProject.use_workshop_for_fixed_expenses,
    frozenDailyCost: dbProject.frozen_daily_cost,
    priceType: dbProject.price_type || 'normal',
    markupPercentage: dbProject.markup_percentage || 10,
    estimatedCompletionDate: dbProject.estimated_completion_date
  };
};

// Função para salvar as etapas do projeto
const saveProjectStages = async (projectId: string, stages: ProjectStages) => {
  // Primeiro, excluir as etapas existentes
  await supabase
    .from('project_stages')
    .delete()
    .eq('project_id', projectId);
  
  // Depois, inserir as novas etapas
  const stageEntries = Object.entries(stages).map(([stageName, stageData]) => ({
    project_id: projectId,
    stage_name: stageName,
    completed: stageData.completed,
    date: stageData.date,
    cancellation_reason: stageData.cancellationReason,
    real_cost: stageData.realCost,
    has_completion_notes: stageData.hasCompletionNotes,
    completion_notes: stageData.completionNotes
  }));
  
  return await supabase.from('project_stages').insert(stageEntries);
};

// Função para obter as etapas do projeto
const getProjectStages = async (projectId: string): Promise<ProjectStages> => {
  const { data, error } = await supabase
    .from('project_stages')
    .select('*')
    .eq('project_id', projectId);
  
  if (error) {
    console.error('Erro ao obter etapas do projeto:', error);
    return {
      orcamento: { completed: false, date: null },
      projetoTecnico: { completed: false, date: null },
      corte: { completed: false, date: null },
      fitamento: { completed: false, date: null },
      furacaoUsinagem: { completed: false, date: null },
      preMontagem: { completed: false, date: null },
      acabamento: { completed: false, date: null },
      entrega: { completed: false, date: null },
      instalacao: { completed: false, date: null },
      projetoCancelado: { completed: false, date: null }
    };
  }
  
  // Converter os dados do banco para o formato esperado pelo frontend
  const stages: ProjectStages = {
    orcamento: { completed: false, date: null },
    projetoTecnico: { completed: false, date: null },
    corte: { completed: false, date: null },
    fitamento: { completed: false, date: null },
    furacaoUsinagem: { completed: false, date: null },
    preMontagem: { completed: false, date: null },
    acabamento: { completed: false, date: null },
    entrega: { completed: false, date: null },
    instalacao: { completed: false, date: null },
    projetoCancelado: { completed: false, date: null }
  };
  
  data.forEach((stage: any) => {
    const stageName = stage.stage_name as keyof ProjectStages;
    if (stageName in stages) {
      stages[stageName] = {
        completed: stage.completed,
        date: stage.date,
        cancellationReason: stage.cancellation_reason,
        realCost: stage.real_cost,
        hasCompletionNotes: stage.has_completion_notes,
        completionNotes: stage.completion_notes
      };
    }
  });
  
  return stages;
};

// Função para salvar as despesas do projeto
const saveProjectExpenses = async (projectId: string, expenses: ExpenseItem[], expenseType: string) => {
  // Primeiro, excluir as despesas existentes deste tipo
  await supabase
    .from('expenses')
    .delete()
    .eq('project_id', projectId)
    .eq('expense_type', expenseType);
  
  // Depois, inserir as novas despesas
  const expenseEntries = expenses.map(expense => ({
    project_id: projectId,
    expense_type: expenseType,
    item_type: expense.type,
    quantity: expense.quantity,
    unit_value: expense.unitValue,
    total: expense.total,
    custom_type: expense.customType
  }));
  
  if (expenseEntries.length > 0) {
    return await supabase.from('expenses').insert(expenseEntries);
  }
  
  return { data: null, error: null };
};

// Função para obter as despesas do projeto
const getProjectExpenses = async (projectId: string): Promise<ExpenseItem[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('project_id', projectId);
  
  if (error) {
    console.error('Erro ao obter despesas do projeto:', error);
    return [];
  }
  
  // Converter os dados do banco para o formato esperado pelo frontend
  return data.map((expense: any) => ({
    id: expense.id,
    type: expense.item_type,
    quantity: expense.quantity,
    unitValue: expense.unit_value,
    total: expense.total,
    customType: expense.custom_type
  }));
};

// Função para criar um novo projeto
export const createProject = async (project: Project): Promise<{ data: Project | null, error: any }> => {
  try {
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuário não autenticado' };
    }
    
    // Inserir o projeto no banco
    const { data, error } = await supabase
      .from('projects')
      .insert(projectToDbFormat(project, user.id))
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar projeto:', error);
      return { data: null, error };
    }
    
    // Salvar as etapas do projeto
    await saveProjectStages(data.id, project.stages);
    
    // Salvar as despesas do projeto
    await saveProjectExpenses(data.id, project.fixedExpenses, 'fixed');
    await saveProjectExpenses(data.id, project.variableExpenses, 'variable');
    await saveProjectExpenses(data.id, project.materials, 'material');
    
    return { data: project, error: null };
  } catch (error) {
    console.error('Erro inesperado ao criar projeto:', error);
    return { data: null, error };
  }
};

// Função para atualizar um projeto existente
export const updateProject = async (project: Project): Promise<{ data: Project | null, error: any }> => {
  try {
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuário não autenticado' };
    }
    
    // Atualizar o projeto no banco
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...projectToDbFormat(project, user.id),
        last_modified: new Date().toISOString()
      })
      .eq('id', project.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar projeto:', error);
      return { data: null, error };
    }
    
    // Atualizar as etapas do projeto
    await saveProjectStages(project.id, project.stages);
    
    // Atualizar as despesas do projeto
    await saveProjectExpenses(project.id, project.fixedExpenses, 'fixed');
    await saveProjectExpenses(project.id, project.variableExpenses, 'variable');
    await saveProjectExpenses(project.id, project.materials, 'material');
    
    return { data: project, error: null };
  } catch (error) {
    console.error('Erro inesperado ao atualizar projeto:', error);
    return { data: null, error };
  }
};

// Função para obter todos os projetos do usuário
export const getProjects = async (): Promise<{ data: Project[] | null, error: any }> => {
  try {
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuário não autenticado' };
    }
    
    // Obter os projetos do usuário
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('last_modified', { ascending: false });
    
    if (error) {
      console.error('Erro ao obter projetos:', error);
      return { data: null, error };
    }
    
    // Para cada projeto, obter suas etapas e despesas
    const projects: Project[] = [];
    
    for (const dbProject of data) {
      const stages = await getProjectStages(dbProject.id);
      const expenses = await getProjectExpenses(dbProject.id);
      
      projects.push(dbToProjectFormat(dbProject, expenses, stages));
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
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuário não autenticado' };
    }
    
    // Obter o projeto
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Erro ao obter projeto:', error);
      return { data: null, error };
    }
    
    // Obter as etapas e despesas do projeto
    const stages = await getProjectStages(data.id);
    const expenses = await getProjectExpenses(data.id);
    
    return { 
      data: dbToProjectFormat(data, expenses, stages), 
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
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    // Excluir o projeto
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);
    
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