import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Calculator, Menu, X, Save, Copy, 
  Plus, AlertCircle, Search, Check, XCircle
} from 'lucide-react';
import { ExpenseSection } from './components/ExpenseSection';
import { Summary } from './components/Summary';
import { Sidebar } from './components/Sidebar';
import { ExpenseItem, Project, ProjectSummary, ProjectStages, WorkshopSettings, Client, PROJECT_STAGES } from './types';
import { ProjectStagesBar } from './components/ProjectStagesBar';
import { ClientsList } from './components/ClientsList';
import { ProjectsKanban } from './components/ProjectsKanban';
import { MyWorkshop } from './components/MyWorkshop';
import { FinancialSummary } from './components/FinancialSummary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';

// IDENTIFICADOR ÚNICO: ATUALIZAÇÃO 14 MARÇO 2025 9:16
console.log('VERSÃO ATUALIZADA DO APP - 14 MARÇO 2025 9:16');

// Componente principal que usa o contexto de autenticação
function AppContent() {
  const { user, loading, signOut } = useAuth();
  console.log('AppContent está sendo renderizado'); // Log de depuração
  
  // Estado para controlar a exibição do kanban de projetos e da lista de clientes
  const [showProjectsKanban, setShowProjectsKanban] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showClientsList, setShowClientsList] = useState(false);
  const [showMyWorkshop, setShowMyWorkshop] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const handleShowProjectsKanban = () => {
    setActiveProjectId(null);
    setShowClientsList(false);
    setShowMyWorkshop(false);
    setShowFinancialSummary(false);
    setShowProjectsKanban(true);
    
    // Fechar a barra lateral automaticamente em dispositivos móveis
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  
  const handleShowMyWorkshop = () => {
    setActiveProjectId(null);
    setShowClientsList(false);
    setShowProjectsKanban(false);
    setShowMyWorkshop(true);
    setShowFinancialSummary(false);
    
    // Fechar a barra lateral automaticamente em dispositivos móveis
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  
  const handleShowFinancialSummary = () => {
    setActiveProjectId(null);
    setShowClientsList(false);
    setShowProjectsKanban(false);
    setShowMyWorkshop(false);
    setShowFinancialSummary(true);
    
    // Fechar a barra lateral automaticamente em dispositivos móveis
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  
  // Estado local para o projeto ativo
  const [fixedExpenses, setFixedExpenses] = useState<ExpenseItem[]>([]);
  const [variableExpenses, setVariableExpenses] = useState<ExpenseItem[]>([]);
  const [materials, setMaterials] = useState<ExpenseItem[]>([]);
  const [profitMargin, setProfitMargin] = useState(20);
  const [priceType, setPriceType] = useState<'normal' | 'markup'>('normal');
  const [markupPercentage, setMarkupPercentage] = useState(10);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [projectDate, setProjectDate] = useState<string>(new Date().toISOString().split('T')[0]); // Formato YYYY-MM-DD
  const [projectComments, setProjectComments] = useState('');
  const [projectStages, setProjectStages] = useState<ProjectStages>({
    orcamento: { completed: false, date: null },
    projetoTecnico: { completed: false, date: null },
    corte: { completed: false, date: null },
    fitamento: { completed: false, date: null },
    furacaoUsinagem: { completed: false, date: null },
    preMontagem: { completed: false, date: null },
    acabamento: { completed: false, date: null },
    entrega: { completed: false, date: null },
    instalacao: { completed: false, date: null },
    projetoCancelado: { completed: false, date: null } // Adicionar o novo estágio
  });
  
  // Estado para controlar a visibilidade da barra lateral em dispositivos móveis
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estado para controlar o número de dias de trabalho
  const [fixedExpenseDays, setFixedExpenseDays] = useState<number | undefined>(undefined);

  // Estado para controlar o uso de configurações da marcenaria para despesas fixas
  const [useWorkshopForFixedExpenses, setUseWorkshopForFixedExpenses] = useState(true);

  // Estado para controlar o custo diário congelado
  const [frozenDailyCost, setFrozenDailyCost] = useState<number | undefined>(undefined);

  // Estados para o autocompletar do nome do cliente
  const [clientSuggestions, setClientSuggestions] = useState<string[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);
  
  // Função para alternar a visibilidade da barra lateral
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Função para atualizar o modo de cálculo para despesas fixas (automático ou manual)
  const handleToggleFixedExpenseMode = (useAutoCalculation: boolean) => {
    setUseWorkshopForFixedExpenses(useAutoCalculation);
    
    // Se mudar para cálculo automático e houver despesas fixas manuais,
    // perguntar ao usuário se deseja removê-las para evitar duplicação
    if (useAutoCalculation && fixedExpenses.length > 0) {
      const confirmClear = window.confirm(
        "Alternar para o modo automático removerá todas as despesas fixas manuais que você adicionou. Deseja continuar?"
      );
      
      if (confirmClear) {
        // Limpar todas as despesas fixas manuais
        setFixedExpenses([]);
      } else {
        // Se o usuário cancelar, reverter para o modo manual
        setUseWorkshopForFixedExpenses(false);
        return false;
      }
    }
    
    return true;
  };

  // Carregar projetos e clientes do localStorage ao iniciar
  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    const savedWorkshopSettings = localStorage.getItem('workshopSettings');
    const savedClients = localStorage.getItem('clients');
    
    // Carregar configurações da marcenaria
    if (savedWorkshopSettings) {
      try {
        const parsedSettings = JSON.parse(savedWorkshopSettings);
        setWorkshopSettings(parsedSettings);
      } catch (error) {
        console.error('Erro ao carregar configurações da marcenaria:', error);
      }
    }
    
    // Carregar clientes
    if (savedClients) {
      try {
        const parsedClients = JSON.parse(savedClients);
        setClients(parsedClients);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        setClients([]);
      }
    }
    
    if (savedProjects) {
      try {
        // Recuperar projetos do localStorage
        const parsedProjects = JSON.parse(savedProjects);
        
        // Verificar e atualizar os projetos existentes para garantir que todos tenham
        // a propriedade projetoCancelado em seus estágios
        const updatedProjects = parsedProjects.map((project: Project) => {
          // Se o projeto tiver estágios, mas não tiver a propriedade projetoCancelado
          if (project.stages && !project.stages.projetoCancelado) {
            return {
              ...project,
              stages: {
                ...project.stages,
                projetoCancelado: { completed: false, date: null }
              }
            };
          }
          
          // Adicionar propriedade fixedExpenseDays se não existir
          if (project.fixedExpenseDays === undefined) {
            project.fixedExpenseDays = 1;
          }
          
          return project;
        });
        
        setProjects(updatedProjects);
        
        // Verificar se há um parâmetro de consulta 'tracking' após carregar os projetos
        const urlParams = new URLSearchParams(window.location.search);
        const trackingParam = urlParams.get('tracking');
        
        if (trackingParam) {
          // Verificar se o projeto existe nos projetos carregados
          const projectExists = updatedProjects.some((p: Project) => p.id === trackingParam);
          
          if (projectExists) {
            setTrackingProjectId(trackingParam);
            setShowClientTracking(true);
            
            // Desativar outras visualizações
            setShowProjectsKanban(false);
            setShowClientsList(false);
            setShowMyWorkshop(false);
            setShowFinancialSummary(false);
            setActiveProjectId(null);
          }
        }
        
        // Se houver projetos e não estiver mostrando o kanban, selecionar o primeiro
        // Caso contrário, manter o kanban de projetos como vista inicial
        if (updatedProjects.length > 0 && !showProjectsKanban) {
          setActiveProjectId(updatedProjects[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        setProjects([]);
      }
    }
  }, []);

  // Carregar o projeto ativo quando o activeProjectId muda
  useEffect(() => {
    if (activeProjectId) {
      const activeProject = projects.find(project => project.id === activeProjectId);
      
      if (activeProject) {
        setProjectName(activeProject.name);
        setClientName(activeProject.clientName);
        setContactPhone(activeProject.contactPhone);
        setProjectDate(activeProject.date);
        setFixedExpenses(activeProject.fixedExpenses);
        setVariableExpenses(activeProject.variableExpenses);
        setMaterials(activeProject.materials);
        setProfitMargin(activeProject.profitMargin);
        setPriceType(activeProject.priceType || 'normal');
        setMarkupPercentage(activeProject.markupPercentage || 10);
        setProjectComments(activeProject.comments);
        
        // Verificar se as etapas estão definidas
        if (activeProject.stages) {
          setProjectStages(activeProject.stages);
        } else {
          // Inicializar etapas se não existirem
          setProjectStages({
            orcamento: { completed: false, date: null },
            projetoTecnico: { completed: false, date: null },
            corte: { completed: false, date: null },
            fitamento: { completed: false, date: null },
            furacaoUsinagem: { completed: false, date: null },
            preMontagem: { completed: false, date: null },
            acabamento: { completed: false, date: null },
            entrega: { completed: false, date: null },
            instalacao: { completed: false, date: null },
            projetoCancelado: { completed: false, date: null } // Adicionar o novo estágio
          });
        }
        
        // Carregar o número de dias de trabalho para despesas fixas
        setFixedExpenseDays(activeProject.fixedExpenseDays !== undefined ? activeProject.fixedExpenseDays : undefined);
        
        // Carregar o modo de cálculo para despesas fixas
        setUseWorkshopForFixedExpenses(activeProject.useWorkshopForFixedExpenses ?? true);
        
        // Carregar o custo diário congelado
        setFrozenDailyCost(activeProject.frozenDailyCost !== undefined ? activeProject.frozenDailyCost : undefined);
      }
    }
  }, [activeProjectId, projects]);

  // Salvar projetos no localStorage quando houver mudanças
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('projects', JSON.stringify(projects));
    }
  }, [projects]);

  const createExpenseItem = (): ExpenseItem => ({
    id: crypto.randomUUID(),
    type: '',
    quantity: 0,
    unitValue: 0,
    total: 0,
    customType: ''
  });

  const handleAddExpense = (setter: React.Dispatch<React.SetStateAction<ExpenseItem[]>>, type: string) => {
    setter(prev => [...prev, { ...createExpenseItem(), type }]);
  };

  const handleRemoveExpense = (
    id: string,
    setter: React.Dispatch<React.SetStateAction<ExpenseItem[]>>
  ) => {
    setter(prev => prev.filter(item => item.id !== id));
  };

  const handleExpenseChange = (
    id: string,
    field: keyof ExpenseItem,
    value: string | number,
    setter: React.Dispatch<React.SetStateAction<ExpenseItem[]>>
  ) => {
    setter(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item };
          
          // Converter valores para número quando necessário
          if (field === 'quantity' || field === 'unitValue' || field === 'total') {
            updatedItem[field] = typeof value === 'string' && value === '' ? 0 : Number(value);
          } else {
            // Para campos do tipo string (type, customType, id)
            updatedItem[field] = value as any;
          }
          
          // Limpar o tipo personalizado quando o tipo selecionado não for 'Outros'
          if (field === 'type' && value !== 'Outros') {
            updatedItem.customType = '';
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Estado para as configurações da marcenaria
  const [workshopSettings, setWorkshopSettings] = useState<WorkshopSettings>({
    expenses: [],
    workingDaysPerMonth: 22, // Valor padrão de dias úteis por mês
  });

  // Função para calcular o custo diário da marcenaria
  // IMPORTANTE: Definida antes de ser usada em calculateSummary
  const calculateDailyCost = useCallback((): number => {
    if (!workshopSettings || workshopSettings.expenses.length === 0 || !workshopSettings.workingDaysPerMonth) {
      return 0;
    }
    
    // Calcula o custo mensal total das despesas da marcenaria
    const totalMonthlyCost = workshopSettings.expenses.reduce((sum, expense) => {
      const unitValue = parseFloat(expense.unitValue?.toString() || '0') || 0;
      return sum + unitValue;
    }, 0);
    
    // Divide pelo número de dias úteis por mês
    return totalMonthlyCost / workshopSettings.workingDaysPerMonth;
  }, [workshopSettings]);

  // Função para calcular o resumo financeiro de um projeto específico (não apenas o projeto ativo)
  const calculateProjectSummary = useCallback((projectToCalculate: Project): ProjectSummary => {
    // Verifica se o projeto está na etapa de Projeto Técnico (congelado)
    const isProjectTechnicalStageCompleted = projectToCalculate?.stages?.projetoTecnico?.completed || false;
    
    // Calcula as despesas fixas com base no estado do projeto
    let fixedExpensesTotal = 0;
    
    if (projectToCalculate.fixedExpenses && projectToCalculate.fixedExpenses.length > 0) {
      // Se tem despesas fixas específicas, usa elas
      fixedExpensesTotal = projectToCalculate.fixedExpenses.reduce((sum: number, expense) => {
        const quantity = typeof expense.quantity === 'string' 
          ? (expense.quantity === '' ? 0 : parseFloat(expense.quantity)) 
          : (expense.quantity || 0);
        const unitValue = typeof expense.unitValue === 'string'
          ? (expense.unitValue === '' ? 0 : parseFloat(expense.unitValue))
          : (expense.unitValue || 0);
        return sum + (quantity * unitValue);
      }, 0);
    } else {
      // Caso contrário, usa o valor calculado com base nos dias de trabalho
      // Usando o valor congelado se o projeto estiver na etapa técnica
      const dailyCost = isProjectTechnicalStageCompleted && projectToCalculate.frozenDailyCost !== undefined
        ? projectToCalculate.frozenDailyCost
        : calculateDailyCost(); // Usa o valor atual apenas se não estiver congelado
        
      fixedExpensesTotal = dailyCost * ((projectToCalculate.fixedExpenseDays !== undefined) ? projectToCalculate.fixedExpenseDays : 0);
    }

    // Calcula despesas variáveis
    const variableExpensesTotal = projectToCalculate.variableExpenses 
      ? projectToCalculate.variableExpenses.reduce((sum: number, expense) => {
          const quantity = typeof expense.quantity === 'string' 
            ? (expense.quantity === '' ? 0 : parseFloat(expense.quantity)) 
            : (expense.quantity || 0);
          const unitValue = typeof expense.unitValue === 'string'
            ? (expense.unitValue === '' ? 0 : parseFloat(expense.unitValue))
            : (expense.unitValue || 0);
          return sum + (quantity * unitValue);
        }, 0)
      : 0;

    // Calcula materiais
    const materialsTotal = projectToCalculate.materials
      ? projectToCalculate.materials.reduce((sum: number, material) => {
          const quantity = typeof material.quantity === 'string' 
            ? (material.quantity === '' ? 0 : parseFloat(material.quantity)) 
            : (material.quantity || 0);
          const unitValue = typeof material.unitValue === 'string'
            ? (material.unitValue === '' ? 0 : parseFloat(material.unitValue))
            : (material.unitValue || 0);
          return sum + (quantity * unitValue);
        }, 0)
      : 0;
    
    const totalCost = fixedExpensesTotal + variableExpensesTotal + materialsTotal;
    const profitMarginToUse = projectToCalculate.profitMargin !== undefined ? projectToCalculate.profitMargin : 20;
    
    // Quando a margem é 0%, o preço de venda deve ser igual ao custo total
    const salePrice = profitMarginToUse === 0 ? totalCost : totalCost / (1 - profitMarginToUse / 100);
    const profitAmount = salePrice - totalCost;
    
    // Markup é a razão entre o preço de venda e o custo de materiais
    const markup = materialsTotal > 0 ? salePrice / materialsTotal : 1;
    
    // Preço de venda usando markup = Custo Total * Markup
    const markupSalePrice = totalCost * markup;
    
    return {
      fixedExpensesTotal,
      variableExpensesTotal,
      materialsTotal,
      totalCost,
      salePrice,
      profitAmount,
      markup,
      markupSalePrice,
    };
  }, [calculateDailyCost]);

  // Função para calcular o resumo do projeto ativo atual
  const calculateSummary = useCallback((): ProjectSummary => {
    // Encontra o projeto ativo
    const activeProject = projects.find(p => p.id === activeProjectId);
    if (!activeProject) {
      // Retorna um resumo vazio se não encontrar o projeto ativo
      return {
        fixedExpensesTotal: 0,
        variableExpensesTotal: 0,
        materialsTotal: 0,
        totalCost: 0,
        salePrice: 0,
        profitAmount: 0,
        markup: 1,
        markupSalePrice: 0,
      };
    }
    
    // Usa o projeto ativo com os valores atuais (não salvos)
    const projectToCalculate: Project = {
      ...activeProject,
      fixedExpenses,
      variableExpenses,
      materials,
      profitMargin,
      fixedExpenseDays,
      stages: projectStages,
      frozenDailyCost,
      useWorkshopForFixedExpenses
    };
    
    return calculateProjectSummary(projectToCalculate);
  }, [activeProjectId, projects, fixedExpenses, variableExpenses, materials, profitMargin, 
      fixedExpenseDays, projectStages, frozenDailyCost, useWorkshopForFixedExpenses, calculateProjectSummary]);

  // Função para gerenciar mudanças nos estágios do projeto
  const handleStageChange = (
    stageId: keyof ProjectStages,
    field: 'completed' | 'date' | 'cancellationReason' | 'realCost' | 'hasCompletionNotes' | 'completionNotes',
    value: boolean | string | number
  ) => {
    console.log(`Alterando etapa ${stageId}, campo ${field}, valor ${value}`);
    
    // Caso específico para quando está marcando o Projeto Técnico
    if (stageId === 'projetoTecnico' && field === 'completed' && value === true) {
      // Verificar se o nome do cliente e nome do projeto estão preenchidos
      const currentProject = projects.find(p => p.id === activeProjectId);
      if (!currentProject?.clientName || !currentProject?.name || currentProject.clientName.trim() === '' || currentProject.name.trim() === '') {
        alert("Não é possível marcar a etapa 'Projeto Técnico' sem preencher o nome do cliente e nome do projeto.");
        return; // Se os campos obrigatórios não estiverem preenchidos, não fazer nada
      }
      
      const confirmCheck = window.confirm(
        "Se essa etapa for selecionada, todas as despesas fixas serão congeladas e não serão mais afetadas por mudanças nas configurações da marcenaria. Deseja continuar?"
      );
      
      if (!confirmCheck) {
        console.log('Operação cancelada pelo usuário');
        return; // Se o usuário cancelar, não fazer nada
      }
      
      console.log('Confirmação aceita pelo usuário. Congelando despesas...');
      
      // Congelar o valor do custo diário atual
      let frozenValue = undefined;
      if (useWorkshopForFixedExpenses) {
        frozenValue = calculateDailyCost();
        console.log(`Valor diário congelado: ${frozenValue}`);
      }
      
      // Atualizar o estado local primeiro
      const updatedStages = {
        ...projectStages,
        [stageId]: {
          ...projectStages[stageId],
          completed: true,
          date: projectStages[stageId].date || new Date().toISOString().split('T')[0]
        }
      };
      
      // Atualizar todos os estados em uma única operação
      setProjectStages(updatedStages);
      setFrozenDailyCost(frozenValue); // Definir o valor congelado
      
      // Salvar o projeto atualizado imediatamente usando o estado atualizado
      const updatedProject = {
        ...projects.find(p => p.id === activeProjectId)!,
        stages: updatedStages,
        frozenDailyCost: frozenValue, // Salvar o valor congelado no projeto
        lastModified: new Date().toISOString()
      };
      
      setProjects(prev => prev.map(project => 
        project.id === activeProjectId ? updatedProject : project
      ));
      
      console.log('Projeto atualizado com sucesso e despesas fixas congeladas');
      return;
    }
    
    // Caso específico para quando está desmarcando o Projeto Técnico
    if (stageId === 'projetoTecnico' && field === 'completed' && value === false) {
      const confirmUncheck = window.confirm(
        "Se você desmarcar a etapa Projeto Técnico, as Despesas Fixas serão atualizadas com os últimos valores inseridos na página Minha Marcenaria. Deseja continuar?"
      );
      
      if (!confirmUncheck) {
        console.log('Operação cancelada pelo usuário');
        return; // Se o usuário cancelar, não fazer nada
      }
      
      console.log('Confirmação de desmarcação aceita. Descongelando despesas...');
      
      // Atualizar o estado local primeiro
      const updatedStages = {
        ...projectStages,
        [stageId]: {
          ...projectStages[stageId],
          completed: false
        }
      };
      
      // Atualizar todos os estados em uma única operação
      setProjectStages(updatedStages);
      setFrozenDailyCost(undefined);
      
      // Salvar o projeto atualizado imediatamente
      const updatedProject = {
        ...projects.find(p => p.id === activeProjectId)!,
        stages: updatedStages,
        frozenDailyCost: undefined,
        lastModified: new Date().toISOString()
      };
      
      setProjects(prev => prev.map(project => 
        project.id === activeProjectId ? updatedProject : project
      ));
      
      console.log('Projeto atualizado com sucesso');
      return;
    }
    
    // Para todos os outros casos, atualizar o estado normalmente
    setProjectStages(prev => ({
      ...prev,
      [stageId]: {
        ...prev[stageId],
        [field]: value,
        // Se estiver marcando como completado e não houver data, adicionar a data atual
        ...(field === 'completed' && value === true && !prev[stageId].date
          ? { date: new Date().toISOString().split('T')[0] }
          : {})
      }
    }));
  };

  // Funções para gerenciar projetos
  const handleCreateProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: '',
      date: new Date().toISOString().split('T')[0],
      clientName: '',
      contactPhone: '',
      fixedExpenses: [],
      variableExpenses: [],
      materials: [],
      profitMargin: 20,
      totalCost: 0,
      salePrice: 0,
      comments: '',
      fixedExpenseDays: undefined, // Alterado para undefined
      stages: {
        orcamento: { completed: false, date: null },
        projetoTecnico: { completed: false, date: null },
        corte: { completed: false, date: null },
        fitamento: { completed: false, date: null },
        furacaoUsinagem: { completed: false, date: null },
        preMontagem: { completed: false, date: null },
        acabamento: { completed: false, date: null },
        entrega: { completed: false, date: null },
        instalacao: { completed: false, date: null },
        projetoCancelado: { completed: false, date: null } // Adicionar o novo estágio
      },
      lastModified: undefined,
      useWorkshopForFixedExpenses: true,
      frozenDailyCost: undefined,
      priceType: 'normal',
      markupPercentage: 10
    };

    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setShowProjectsKanban(false);
    setShowClientsList(false);
    setShowMyWorkshop(false);
    setShowFinancialSummary(false);

    // Resetar o estado do formulário
    setProjectName('');
    setClientName('');
    setContactPhone('');
    setProjectDate(new Date().toISOString().split('T')[0]);
    setFixedExpenses([]);
    setVariableExpenses([]);
    setMaterials([]);
    setProfitMargin(20);
    setProjectComments('');
    setFixedExpenseDays(undefined); // Alterado para undefined
    setProjectStages({
      orcamento: { completed: false, date: null },
      projetoTecnico: { completed: false, date: null },
      corte: { completed: false, date: null },
      fitamento: { completed: false, date: null },
      furacaoUsinagem: { completed: false, date: null },
      preMontagem: { completed: false, date: null },
      acabamento: { completed: false, date: null },
      entrega: { completed: false, date: null },
      instalacao: { completed: false, date: null },
      projetoCancelado: { completed: false, date: null } // Adicionar o novo estágio
    });
    setUseWorkshopForFixedExpenses(true); // Garantir que a entrada automática esteja ativada
    setFrozenDailyCost(undefined);
    setPriceType('normal');
    setMarkupPercentage(10);
  };

  const handleSelectProject = (projectId: string) => {
    // Não salvar mais automaticamente ao trocar de projeto
    setActiveProjectId(projectId);
  };

  const handleDeleteProject = (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;
    
    const projectName = projectToDelete.name || 'Projeto sem nome';
    const clientName = projectToDelete.clientName ? `${projectToDelete.clientName} - ` : '';
    
    // Confirmar exclusão com o usuário
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir permanentemente o projeto "${clientName}${projectName}"? Esta ação não pode ser desfeita.`
    );
    
    if (confirmDelete) {
      // Remover o projeto da lista
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      // Se o projeto excluído for o ativo, limpar a seleção
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
        // Mostrar o kanban
        setShowProjectsKanban(true);
        setShowClientsList(false);
        setShowMyWorkshop(false);
        setShowFinancialSummary(false);
      }
      
    }
  };

  const saveCurrentProject = () => {
    if (!projectName.trim() || !clientName.trim()) {
      alert('Por favor, insira o nome do cliente e o nome do projeto.');
      return;
    }

    const summary = calculateProjectSummary({
      id: activeProjectId || crypto.randomUUID(),
      name: projectName,
      date: projectDate,
      clientName: clientName,
      contactPhone: contactPhone,
      fixedExpenses: fixedExpenses,
      variableExpenses: variableExpenses,
      materials: materials,
      profitMargin: profitMargin,
      comments: projectComments,
      stages: projectStages,
      totalCost: 0, // Será calculado
      salePrice: 0, // Será calculado
      fixedExpenseDays: fixedExpenseDays !== undefined ? fixedExpenseDays : undefined,
      useWorkshopForFixedExpenses: useWorkshopForFixedExpenses,
      frozenDailyCost: frozenDailyCost !== undefined ? frozenDailyCost : undefined,
      priceType: priceType,
      markupPercentage: markupPercentage
    });
    const currentDateTime = new Date().toISOString();
    
    // Salvar o projeto atualizado com os valores calculados
    setProjects(prev => prev.map(project => 
      project.id === activeProjectId
        ? {
            ...project,
            name: projectName,
            date: projectDate,
            clientName: clientName,
            contactPhone: contactPhone,
            fixedExpenses: fixedExpenses,
            variableExpenses: variableExpenses,
            materials: materials,
            profitMargin: profitMargin,
            comments: projectComments,
            stages: projectStages,
            totalCost: summary.totalCost,
            salePrice: summary.salePrice,
            fixedExpenseDays: fixedExpenseDays !== undefined ? fixedExpenseDays : undefined,
            useWorkshopForFixedExpenses: useWorkshopForFixedExpenses,
            frozenDailyCost: frozenDailyCost !== undefined ? frozenDailyCost : undefined,
            lastModified: currentDateTime,
            priceType: priceType,
            markupPercentage: markupPercentage
          }
        : project
    ));
  };

  const handleSaveProject = () => {
    // Verificar se os campos obrigatórios estão preenchidos antes de salvar
    if (!projectName.trim() || !clientName.trim()) {
      if (!projectName.trim() && !clientName.trim()) {
        alert('Por favor, insira o nome do cliente e o nome do projeto para salvar.');
      } else if (!projectName.trim()) {
        alert('Por favor, insira um nome para o projeto antes de salvar.');
      } else {
        alert('Por favor, insira o nome do cliente antes de salvar.');
      }
      return;
    }
    
    // Se chegou aqui, os campos obrigatórios estão preenchidos, então salva o projeto
    saveCurrentProject();
    alert('Projeto salvo com sucesso!');
  };

  // Função para normalizar texto (remover acentos e converter para minúsculas)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
  };

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClientName(value);
    
    // Se o valor estiver vazio, não mostrar sugestões
    if (!value.trim()) {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
      return;
    }
    
    // Normalizar o texto de busca (remover acentos e converter para minúsculas)
    const normalizedValue = normalizeText(value);
    
    // Buscar clientes que correspondam ao texto digitado
    // 1. Clientes de projetos existentes
    const projectClientNames = projects
      .map(project => project.clientName)
      .filter(name => 
        name && 
        normalizeText(name).includes(normalizedValue)
      );
    
    // 2. Clientes cadastrados diretamente
    const registeredClientNames = clients
      .map(client => client.name)
      .filter(name => 
        name && 
        normalizeText(name).includes(normalizedValue)
      );
    
    // Combinar as duas fontes de clientes
    const allMatchingClients = [...projectClientNames, ...registeredClientNames];
    
    // Remover duplicatas e ordenar por relevância
    const uniqueClients = Array.from(new Set(allMatchingClients))
      .filter(name => normalizeText(name) !== normalizedValue) // Não incluir correspondências exatas
      .sort((a, b) => {
        const aStartsWith = normalizeText(a).startsWith(normalizedValue);
        const bStartsWith = normalizeText(b).startsWith(normalizedValue);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 5); // Limitar a 5 sugestões
    
    setClientSuggestions(uniqueClients);
    setShowClientSuggestions(uniqueClients.length > 0);
  };

  const handleSelectClientSuggestion = (clientName: string) => {
    console.log('Selecionando sugestão:', clientName);
    
    // Atualizar o nome do cliente
    setClientName(clientName);
    
    // Buscar o telefone do cliente nos projetos existentes
    const clientProjects = projects.filter(project => 
      project.clientName === clientName
    );
    
    // Se encontrou projetos desse cliente, usar o telefone do projeto mais recente
    if (clientProjects.length > 0) {
      // Ordenar projetos por data (do mais recente para o mais antigo)
      const sortedProjects = [...clientProjects].sort((a, b) => {
        // Se não tiver data, considerar como mais antigo
        if (!a.date) return 1;
        if (!b.date) return -1;
        // Comparar datas (mais recente primeiro)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      // Pegar o telefone do projeto mais recente
      const latestPhone = sortedProjects[0].contactPhone;
      
      // Se tiver telefone, atualizar o campo
      if (latestPhone) {
        console.log('Preenchendo telefone automaticamente:', latestPhone);
        setContactPhone(latestPhone);
      }
    }
    
    // Limpar as sugestões
    setClientSuggestions([]);
    setShowClientSuggestions(false);
    
    // Focar no próximo campo com um pequeno atraso
    setTimeout(() => {
      const projectNameInput = document.querySelector('input[placeholder="Nome do Projeto"]') as HTMLInputElement;
      if (projectNameInput) {
        projectNameInput.focus();
      }
    }, 100);
  };

  // Fechar sugestões quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientInputRef.current && !clientInputRef.current.contains(event.target as Node)) {
        setShowClientSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleContactPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove todos os caracteres não numéricos
    const onlyNumbers = e.target.value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (DDD + 9 dígitos do número)
    const limitedNumbers = onlyNumbers.slice(0, 11);
    
    // Aplica a máscara conforme o usuário digita
    let formattedValue = '';
    
    if (limitedNumbers.length <= 2) {
      // Se tiver até 2 dígitos, coloca apenas os parênteses
      formattedValue = limitedNumbers.length ? `(${limitedNumbers}` : '';
    } else if (limitedNumbers.length <= 7) {
      // Se tiver de 3 a 7 dígitos, formata como (DDD)XXXX
      formattedValue = `(${limitedNumbers.substring(0, 2)}) ${limitedNumbers.substring(2)}`;
    } else {
      // Se tiver mais de 7 dígitos, formata como (DDD)XXXXX-XXXX
      formattedValue = `(${limitedNumbers.substring(0, 2)}) ${limitedNumbers.substring(2, 7)}-${limitedNumbers.substring(7)}`;
    }
    
    // Atualiza o estado com o valor formatado
    setContactPhone(formattedValue);
  };

  const handleProjectDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectDate(e.target.value);
  };

  // Função para abreviar texto se ultrapassar o limite de caracteres
  const abbreviateText = (text: string, maxLength: number = 10): string => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Função para lidar com a exibição da lista de clientes
  const handleShowClientsList = () => {
    setActiveProjectId(null);
    setShowClientsList(true);
    setShowProjectsKanban(false);
    setShowMyWorkshop(false);
    setShowFinancialSummary(false);
    
    // Fechar a barra lateral automaticamente em dispositivos móveis
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleDuplicateProject = () => {
    if (!activeProjectId) return;
    
    // Encontrar o projeto atual
    const currentProject = projects.find(p => p.id === activeProjectId);
    if (!currentProject) return;
    
    // Criar um novo projeto com os dados de despesas do projeto atual
    const duplicatedProject: Project = {
      id: crypto.randomUUID(),
      name: '', // Nome em branco
      date: new Date().toISOString().split('T')[0], // Data atual
      clientName: '', // Cliente em branco
      contactPhone: '', // Telefone em branco
      fixedExpenses: JSON.parse(JSON.stringify(currentProject.fixedExpenses)), // Cópia profunda
      variableExpenses: JSON.parse(JSON.stringify(currentProject.variableExpenses)), // Cópia profunda
      materials: JSON.parse(JSON.stringify(currentProject.materials)), // Cópia profunda
      profitMargin: currentProject.profitMargin,
      totalCost: currentProject.totalCost,
      salePrice: currentProject.salePrice,
      comments: '', // Comentários em branco
      fixedExpenseDays: undefined, // Alterado para undefined
      stages: {
        orcamento: { completed: false, date: null },
        projetoTecnico: { completed: false, date: null },
        corte: { completed: false, date: null },
        fitamento: { completed: false, date: null },
        furacaoUsinagem: { completed: false, date: null },
        preMontagem: { completed: false, date: null },
        acabamento: { completed: false, date: null },
        entrega: { completed: false, date: null },
        instalacao: { completed: false, date: null },
        projetoCancelado: { completed: false, date: null } // Adicionar o novo estágio
      },
      lastModified: undefined,
      useWorkshopForFixedExpenses: true,
      frozenDailyCost: undefined,
      priceType: 'normal',
      markupPercentage: 10
    };
    
    // Inserir o novo projeto no início da lista para que apareça no topo da barra lateral
    setProjects(prev => [duplicatedProject, ...prev]);
    
    // Selecionar o novo projeto
    setActiveProjectId(duplicatedProject.id);
    
    // Atualizar os estados locais com os valores do novo projeto
    setFixedExpenses(JSON.parse(JSON.stringify(currentProject.fixedExpenses)));
    setVariableExpenses(JSON.parse(JSON.stringify(currentProject.variableExpenses)));
    setMaterials(JSON.parse(JSON.stringify(currentProject.materials)));
    setProfitMargin(currentProject.profitMargin);
    setProjectName('');
    setClientName('');
    setContactPhone('');
    setProjectDate(new Date().toISOString().split('T')[0]);
    setProjectComments('');
    setFixedExpenseDays(undefined); // Alterado para undefined
    setProjectStages({
      orcamento: { completed: false, date: null },
      projetoTecnico: { completed: false, date: null },
      corte: { completed: false, date: null },
      fitamento: { completed: false, date: null },
      furacaoUsinagem: { completed: false, date: null },
      preMontagem: { completed: false, date: null },
      acabamento: { completed: false, date: null },
      entrega: { completed: false, date: null },
      instalacao: { completed: false, date: null },
      projetoCancelado: { completed: false, date: null } // Adicionar o novo estágio
    });
    setUseWorkshopForFixedExpenses(true);
    setFrozenDailyCost(undefined);
    setPriceType('normal');
    setMarkupPercentage(10);
  };

  const handleSaveWorkshopSettings = (settings: WorkshopSettings) => {
    // Atualizar o estado com as novas configurações
    setWorkshopSettings({...settings});
    
    // Salvar no localStorage
    localStorage.setItem('workshopSettings', JSON.stringify(settings));
    
    // Log para depuração
    console.log('Configurações da marcenaria atualizadas:', settings);
  };

  // Função para atualizar o número de dias de trabalho para despesas fixas
  const handleUpdateFixedExpenseDays = (days: number | null) => {
    setFixedExpenseDays(days === null ? undefined : days);
  };

  // Funções para gerenciamento de clientes
  const handleAddClient: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    // Criar um novo cliente com valores padrão
    const newClient: Omit<Client, "id" | "createdAt"> = {
      name: '',
      phone: ''
    };
    
    // Adicionar o cliente à lista
    const clientWithId: Client = {
      ...newClient,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    setClients(prevClients => [...prevClients, clientWithId]);
    
    // Salvar a lista atualizada no localStorage
    localStorage.setItem('clients', JSON.stringify([...clients, clientWithId]));
    
    return clientWithId;
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === updatedClient.id ? updatedClient : client
      )
    );
  };

  const handleDeleteClient = (clientId: string) => {
    // Verificar se o cliente está associado a algum projeto
    const clientProjects = projects.filter(project => project.clientId === clientId);
    
    if (clientProjects.length > 0) {
      const confirmDelete = window.confirm(
        `Este cliente está associado a ${clientProjects.length} projeto(s). Deseja realmente excluí-lo?`
      );
      
      if (!confirmDelete) return;
    }
    
    setClients(prevClients => prevClients.filter(client => client.id !== clientId));
  };

  const [showClientTracking, setShowClientTracking] = useState(false);
  const [trackingProjectId, setTrackingProjectId] = useState<string | null>(null);

  const handleUpdateProject = (projectId: string, field: string, value: any) => {
    setProjects(prevProjects => 
      prevProjects.map(p => 
        p.id === projectId 
          ? { ...p, [field]: value, lastModified: new Date().toISOString() } 
          : p
      )
    );
  };

  const ClientTrackingView = () => {
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const loadProject = () => {
        try {
          if (!trackingProjectId) {
            setError("Link de rastreamento inválido");
            setLoading(false);
            return;
          }

          const savedProjects = localStorage.getItem('projects');
          if (!savedProjects) {
            setError("Nenhum projeto encontrado");
            setLoading(false);
            return;
          }

          const parsedProjects = JSON.parse(savedProjects);
          const foundProject = parsedProjects.find((p: Project) => p.id === trackingProjectId);
          
          if (!foundProject) {
            setError("Projeto não encontrado");
            setLoading(false);
            return;
          }

          setProject(foundProject);
          setLoading(false);
        } catch (error) {
          console.error('Erro ao carregar projeto:', error);
          setError("Erro ao carregar dados do projeto");
          setLoading(false);
        }
      };

      loadProject();
    }, [trackingProjectId]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">Carregando...</h2>
              <p className="mt-1 text-sm text-gray-500">
                Aguarde enquanto carregamos as informações do projeto.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (error || !project) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-2 text-lg font-medium text-gray-900">
                {error || "Projeto não encontrado"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                O link que você acessou não corresponde a nenhum projeto ativo.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    const isCanceled = project.stages.projetoCancelado?.completed || false;
    const cancelDate = project.stages.projetoCancelado?.date 
      ? new Date(project.stages.projetoCancelado.date).toLocaleDateString('pt-BR') 
      : '';
    
    // Verificar se o projeto foi finalizado (instalação concluída)
    const isProjectCompleted = project.stages.instalacao?.completed || false;
    const completionDate = project.stages.instalacao?.date 
      ? new Date(project.stages.instalacao.date).toLocaleDateString('pt-BR') 
      : '';

    const formattedEstimatedDate = project.estimatedCompletionDate 
      ? (() => {
          // Corrigir o problema de timezone que causa a diferença de um dia
          const date = new Date(project.estimatedCompletionDate);
          // Ajustar para o fuso horário local para evitar problemas com UTC
          const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
          return localDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        })()
      : null;

    const stagesArray = PROJECT_STAGES.filter(stage => stage.id !== 'projetoCancelado');

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <h1 className="text-2xl font-bold">Acompanhamento de Projeto</h1>
                <p className="mt-1 text-lg">{project.clientName} - {project.name}</p>
                <p className="mt-1 text-sm opacity-80">Iniciado em: {new Date(project.date).toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              
              {isCanceled && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700 font-medium">
                      Este projeto foi cancelado em {cancelDate}
                    </p>
                  </div>
                </div>
              )}
              
              {isProjectCompleted && !isCanceled && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-sm text-green-700 font-medium">
                      Projeto finalizado com sucesso em {completionDate}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-green-600 ml-7">
                    Agradecemos pela confiança! Esperamos que esteja satisfeito com o resultado.
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Status do Projeto</h2>
              </div>
              
              <div className="p-4">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {stagesArray
                      .map((stage) => {
                        const stageKey = stage.id as keyof ProjectStages;
                        return {
                          ...stage,
                          completed: project.stages[stageKey]?.completed || false,
                          date: project.stages[stageKey]?.date || null
                        };
                      })
                      .map((stage, index) => (
                        <li key={stage.id}>
                          <div className="relative pb-8">
                            {index !== stagesArray.length - 1 && stage.id !== 'instalacao' && (
                              <span
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                  project.stages && project.stages[stage.id as keyof ProjectStages]?.completed 
                                    ? 'bg-green-500' 
                                    : isCanceled 
                                      ? 'bg-gray-300' 
                                      : index === stagesArray.findIndex(s => project.stages && !project.stages[s.id as keyof ProjectStages]?.completed) 
                                        ? 'bg-blue-500 animate-pulse' 
                                        : 'bg-gray-300'
                                }`}>
                                  {project.stages && project.stages[stage.id as keyof ProjectStages]?.completed ? (
                                    <Check className="h-5 w-5 text-white" />
                                  ) : (
                                    <span className="h-2 w-2 rounded-full bg-white" />
                                  )}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className={`text-sm font-medium ${
                                    project.stages && project.stages[stage.id as keyof ProjectStages]?.completed 
                                      ? 'text-gray-900' 
                                      : isCanceled 
                                        ? 'text-gray-500' 
                                        : index === stagesArray.findIndex(s => project.stages && !project.stages[s.id as keyof ProjectStages]?.completed) 
                                          ? 'text-blue-600' 
                                          : 'text-gray-500'
                                  }`}>
                                    {stage.label}
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  {stage.date && (
                                    <time dateTime={stage.date}>{stage.date}</time>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Este é um acompanhamento em tempo real do seu projeto.</p>
              <p className="mt-1">Para mais informações, entre em contato pelo telefone informado.</p>
            </div>
            {formattedEstimatedDate && !isProjectCompleted && !isCanceled && (
              <p className="mt-4 text-center text-sm text-blue-600 font-medium">
                Data prevista de entrega: {formattedEstimatedDate}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Se estiver carregando, mostrar um indicador de carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }
  
  // Se não houver usuário autenticado, mostrar a tela de login
  if (!user) {
    return <Login />;
  }
  
  // Se houver usuário autenticado, mostrar a aplicação principal
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar para navegação */}
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onClose={() => setSidebarOpen(false)}
        onClientsView={handleShowClientsList}
        onProjectsKanbanView={handleShowProjectsKanban}
        onMyWorkshopView={handleShowMyWorkshop}
        onFinancialSummaryView={handleShowFinancialSummary}
        workshopSettings={workshopSettings}
        onLogout={signOut}
        onMyWorkshopActive={showMyWorkshop}
        onFinancialSummaryActive={showFinancialSummary}
        onClientsListActive={showClientsList}
        onProjectsKanbanActive={showProjectsKanban}
      />
      
      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto">
        {/* Barra superior com botão de menu para dispositivos móveis */}
        <div className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
            onClick={toggleSidebar}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <h1 className="text-xl font-semibold text-gray-800">
            {showProjectsKanban && "Meus Projetos"}
            {showClientsList && "Meus Clientes"}
            {showMyWorkshop && "Minha Marcenaria"}
            {showFinancialSummary && "Resumo Financeiro"}
            {activeProjectId && (projectName || "Novo Projeto")}
          </h1>
          
          <div className="flex items-center gap-2">
            {/* Botões de ação específicos para cada visualização */}
            {showClientsList && (
              <button
                className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                onClick={handleAddClient}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Novo Cliente</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Conteúdo principal */}
        <div className="p-2 sm:p-4">
          {showMyWorkshop ? (
            <MyWorkshop 
              workshopSettings={workshopSettings}
              onSaveSettings={handleSaveWorkshopSettings}
            />
          ) : showClientsList ? (
            <ClientsList 
              projects={projects} 
              clients={clients} 
              onAddClient={handleAddClient} 
              onUpdateClient={handleUpdateClient} 
              onDeleteClient={handleDeleteClient}
              onSelectProject={(projectId) => {
                handleSelectProject(projectId);
                setShowClientsList(false);
                setShowProjectsKanban(false);
                setShowMyWorkshop(false);
                setShowFinancialSummary(false);
              }}
            />
          ) : showFinancialSummary ? (
            <FinancialSummary projects={projects} />
          ) : showProjectsKanban ? (
            <ProjectsKanban 
              projects={projects} 
              onSelectProject={(projectId) => {
                handleSelectProject(projectId);
                setShowClientsList(false);
                setShowProjectsKanban(false);
                setShowMyWorkshop(false);
                setShowFinancialSummary(false);
              }} 
              onDeleteProject={handleDeleteProject}
            />
          ) : activeProjectId ? (
            <div className="container mx-auto">
              {/* Layout principal com grid para desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Coluna das despesas - ocupa 3/4 em desktop */}
                <div className="lg:col-span-3 space-y-4 sm:space-y-6 order-1 lg:order-1">
                  {/* Verificar se o projeto técnico está aprovado */}
                  {projectStages.projetoTecnico?.completed && (
                    <div className="bg-amber-100 p-4 rounded-lg mb-4 flex items-center gap-2 text-amber-800 border border-amber-300">
                      <AlertCircle size={20} />
                      <div>
                        <p className="font-semibold">Orçamento congelado</p>
                        <p className="text-sm">O orçamento deste projeto não pode ser alterado porque o projeto técnico já foi aprovado.</p>
                      </div>
                    </div>
                  )}
                   
                  <ExpenseSection
                    title="Despesas Fixas"
                    type="fixed"
                    items={fixedExpenses}
                    onAdd={() => handleAddExpense(setFixedExpenses, 'fixed')}
                    onRemove={(id) => handleRemoveExpense(id, setFixedExpenses)}
                    onChange={(id, field, value) => 
                      handleExpenseChange(
                        id, 
                        field as keyof ExpenseItem, 
                        value, 
                        setFixedExpenses
                      )
                    }
                    dailyCost={projectStages.projetoTecnico?.completed && frozenDailyCost !== undefined 
                      ? frozenDailyCost 
                      : calculateDailyCost()}
                    useWorkshopSettings={useWorkshopForFixedExpenses}
                    fixedExpenseDays={fixedExpenseDays}
                    onChangeDays={handleUpdateFixedExpenseDays}
                    onToggleCalculationMode={handleToggleFixedExpenseMode}
                    disabled={projectStages.projetoTecnico?.completed}
                  />

                  <ExpenseSection
                    title="Despesas Variáveis"
                    type="variable"
                    items={variableExpenses}
                    onAdd={() => handleAddExpense(setVariableExpenses, 'variable')}
                    onRemove={(id) => handleRemoveExpense(id, setVariableExpenses)}
                    onChange={(id, field, value) => 
                      handleExpenseChange(
                        id, 
                        field as keyof ExpenseItem, 
                        value, 
                        setVariableExpenses
                      )
                    }
                    disabled={projectStages.projetoTecnico?.completed}
                  />

                  <ExpenseSection
                    title="Materiais"
                    type="material"
                    items={materials}
                    onAdd={() => handleAddExpense(setMaterials, 'material')}
                    onRemove={(id) => handleRemoveExpense(id, setMaterials)}
                    onChange={(id, field, value) => 
                      handleExpenseChange(
                        id, 
                        field as keyof ExpenseItem, 
                        value, 
                        setMaterials
                      )
                    }
                    disabled={projectStages.projetoTecnico?.completed}
                  />

                  {/* Seção de Comentários */}
                  <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      Comentários do Orçamento
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none sm:resize-none"
                          placeholder="Adicione informações importantes sobre o projeto, especificações, prazos de entrega, etc."
                          value={projectComments}
                          onChange={(e) => {
                            setProjectComments(e.target.value);
                            // Ajustar altura automaticamente em todas as telas
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          onFocus={(e) => {
                            // Definir altura mínima ao focar
                            if (!e.target.value) {
                              e.target.style.height = '100px';
                            }
                          }}
                          ref={(textarea) => {
                            if (textarea) {
                              // Ajustar altura inicial com base no conteúdo
                              textarea.style.height = 'auto';
                              textarea.style.height = projectComments 
                                ? `${Math.max(100, textarea.scrollHeight)}px` 
                                : '100px';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botão Salvar no final da página */}
                  <div className="mt-4 sm:mt-6 flex justify-center">
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mx-auto"
                      onClick={handleSaveProject}
                    >
                      <Save size={20} />
                      Salvar Projeto
                    </button>
                  </div>
                </div>

                {/* Resumo do Projeto - Lateral direita em desktop, ocupa 1/4 */}
                <div className="lg:col-span-1 order-2 lg:order-2">
                  <div className="lg:sticky lg:top-4">
                    <Summary 
                      summary={calculateSummary()} 
                      profitMargin={profitMargin}
                      onProfitMarginChange={setProfitMargin}
                      isDisabled={activeProjectId && projects.find(p => p.id === activeProjectId)?.stages?.projetoTecnico?.completed}
                      onSaveProject={handleSaveProject}
                      priceType={priceType}
                      onPriceTypeChange={setPriceType}
                      markupPercentage={markupPercentage}
                    />
                    {/* Data da última modificação */}
                    <div className="mt-2 text-xs text-gray-400 text-right">
                      {activeProjectId && (
                        <>
                          {(() => {
                            const currentProject = projects.find(p => p.id === activeProjectId);
                            return currentProject?.lastModified ? (
                              <>
                                Última modificação: {new Date(currentProject.lastModified).toLocaleDateString('pt-BR', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </>
                            ) : 'Projeto não salvo';
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Nenhum projeto selecionado</h2>
                <p className="text-gray-500 mb-6">Crie um novo projeto ou selecione um existente para começar</p>
                <button
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mx-auto"
                  onClick={handleCreateProject}
                >
                  <Plus size={20} />
                  Criar Novo Projeto
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente App que envolve AppContent com o AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;