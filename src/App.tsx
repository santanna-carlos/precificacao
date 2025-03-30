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
import { UserProfile } from './components/UserProfile';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { getProjects, createProject, updateProject, deleteProject, getProject } from './services/projectService';
import { getClients, createClient, updateClient, deleteClient } from './services/clientService';
import { getWorkshopSettings, saveWorkshopSettings } from './services/workshopService';

function App() {
  const { user, loading, signOut } = useAuth();
  
  const [showProjectsKanban, setShowProjectsKanban] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showClientsList, setShowClientsList] = useState(false);
  const [showMyWorkshop, setShowMyWorkshop] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Função para salvar o estado de navegação no sessionStorage
  const saveNavigationState = () => {
    if (user) {
      const navigationState = {
        showProjectsKanban,
        showClientsList,
        showMyWorkshop,
        showFinancialSummary,
        showUserProfile,
        activeProjectId
      };
      sessionStorage.setItem('navigationState', JSON.stringify(navigationState));
    }
  };
  
  // Efeito para salvar o estado de navegação sempre que ele mudar
  useEffect(() => {
    if (user) {
      saveNavigationState();
    }
  }, [showProjectsKanban, showClientsList, showMyWorkshop, showFinancialSummary, showUserProfile, activeProjectId, user]);
  
  // Efeito para restaurar o estado de navegação ao carregar a página
  useEffect(() => {
    if (user && !loading) {
      const storedNavigationState = sessionStorage.getItem('navigationState');
      if (storedNavigationState) {
        try {
          const navigationState = JSON.parse(storedNavigationState);
          setShowProjectsKanban(navigationState.showProjectsKanban);
          setShowClientsList(navigationState.showClientsList);
          setShowMyWorkshop(navigationState.showMyWorkshop);
          setShowFinancialSummary(navigationState.showFinancialSummary);
          setShowUserProfile(navigationState.showUserProfile);
          if (navigationState.activeProjectId) {
            setActiveProjectId(navigationState.activeProjectId);
          }
        } catch (error) {
          console.error('Erro ao restaurar estado de navegação:', error);
          sessionStorage.removeItem('navigationState');
        }
      }
    }
  }, [user, loading]);
  
  const handleShowProjectsKanban = () => {
    setActiveProjectId(null);
    setShowClientsList(false);
    setShowMyWorkshop(false);
    setShowFinancialSummary(false);
    setShowUserProfile(false);
    setShowProjectsKanban(true);
    
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
    setShowUserProfile(false);
    
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
    setShowUserProfile(false);
    
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  
  const handleShowUserProfile = () => {
    setActiveProjectId(null);
    setShowClientsList(false);
    setShowProjectsKanban(false);
    setShowMyWorkshop(false);
    setShowFinancialSummary(false);
    setShowUserProfile(true);
    
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  
  const [fixedExpenses, setFixedExpenses] = useState<ExpenseItem[]>([]);
  const [variableExpenses, setVariableExpenses] = useState<ExpenseItem[]>([]);
  const [materials, setMaterials] = useState<ExpenseItem[]>([]);
  const [profitMargin, setProfitMargin] = useState(20);
  const [priceType, setPriceType] = useState<'normal' | 'markup'>('normal');
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [projectDate, setProjectDate] = useState<string>(new Date().toISOString().split('T')[0]);
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
    projetoCancelado: { completed: false, date: null }
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fixedExpenseDays, setFixedExpenseDays] = useState<number | undefined>(undefined);
  const [useWorkshopForFixedExpenses, setUseWorkshopForFixedExpenses] = useState(true);
  const [frozenDailyCost, setFrozenDailyCost] = useState<number | undefined>(undefined);
  const [clientSuggestions, setClientSuggestions] = useState<string[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleToggleFixedExpenseMode = (useAutoCalculation: boolean) => {
    setUseWorkshopForFixedExpenses(useAutoCalculation);
    
    if (useAutoCalculation && fixedExpenses.length > 0) {
      const confirmClear = window.confirm(
        "Alternar para o modo automático removerá todas as despesas fixas manuais que você adicionou. Deseja continuar?"
      );
      
      if (confirmClear) {
        setFixedExpenses([]);
      } else {
        setUseWorkshopForFixedExpenses(false);
        return false;
      }
    }
    
    return true;
  };

  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;

      try {
        // Verificar se existe um estado de navegação salvo
        const storedNavigationState = sessionStorage.getItem('navigationState');
        const hasStoredState = !!storedNavigationState;
        
        // Carregar projetos
        const { data: projectsData, error: projectsError } = await getProjects();
        if (projectsError) throw projectsError;
        setProjects(projectsData || []);
        
        // Carregar clientes
        const { data: clientsData, error: clientsError } = await getClients();
        if (clientsError) throw clientsError;
        setClients(clientsData || []);
        
        // Carregar configurações da marcenaria
        const { data: workshopData, error: workshopError } = await getWorkshopSettings();
        if (workshopError) throw workshopError;
        setWorkshopSettings(workshopData || {
          id: '',
          workingDaysPerMonth: 22,
          workshopName: null,
          logoImage: null,
          expenses: [],
          lastUpdated: new Date().toISOString(),
        });
        
        // Verificar se há um parâmetro de tracking na URL
        const urlParams = new URLSearchParams(window.location.search);
        const trackingParam = urlParams.get('tracking');
        
        // Só definir o estado de navegação se não houver um estado salvo
        if (!hasStoredState) {
          if (trackingParam) {
            const projectExists = projectsData?.some(project => project.id === trackingParam);
            
            if (projectExists) {
              setTrackingProjectId(trackingParam);
              setShowClientTracking(true);
              
              setShowProjectsKanban(false);
              setShowClientsList(false);
              setShowMyWorkshop(false);
              setShowFinancialSummary(false);
              setActiveProjectId(null);
            } else {
              setShowProjectsKanban(true);
              setShowClientsList(false);
              setShowMyWorkshop(false);
              setShowFinancialSummary(false);
              setActiveProjectId(null);
            }
          } else {
            setShowProjectsKanban(true);
            setShowClientsList(false);
            setShowMyWorkshop(false);
            setShowFinancialSummary(false);
            setActiveProjectId(null);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        setProjects([]);
        setClients([]);
        setWorkshopSettings({
          id: '',
          workingDaysPerMonth: 22,
          workshopName: null,
          logoImage: null,
          expenses: [],
          lastUpdated: new Date().toISOString(),
        });
      }
    };

    loadInitialData();
  }, [user]);

  useEffect(() => {
    // Quando o usuário não estiver autenticado (após logout), redefinir os estados para seus valores padrão
    if (!user && !loading) {
      setShowProjectsKanban(true);
      setShowClientsList(false);
      setShowMyWorkshop(false);
      setShowFinancialSummary(false);
      setShowUserProfile(false);
      setActiveProjectId(null);
      setProjects([]);
      setClients([]);
      setWorkshopSettings({
        id: '',
        workingDaysPerMonth: 22,
        workshopName: null,
        logoImage: null,
        expenses: [],
        lastUpdated: new Date().toISOString(),
      });
    }
  }, [user, loading]);

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
        setProjectComments(activeProject.comments);
        
        if (activeProject.stages) {
          setProjectStages(activeProject.stages);
        } else {
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
            projetoCancelado: { completed: false, date: null }
          });
        }
        
        setFixedExpenseDays(activeProject.fixedExpenseDays !== undefined ? activeProject.fixedExpenseDays : undefined);
        setUseWorkshopForFixedExpenses(activeProject.useWorkshopForFixedExpenses ?? true);
        setFrozenDailyCost(activeProject.frozenDailyCost !== undefined ? activeProject.frozenDailyCost : undefined);
      }
    }
  }, [activeProjectId, projects]);

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
          
          if (field === 'quantity' || field === 'unitValue' || field === 'total') {
            updatedItem[field] = typeof value === 'string' && value === '' ? 0 : Number(value);
          } else {
            updatedItem[field] = value as any;
          }
          
          if (field === 'type' && value !== 'Outros') {
            updatedItem.customType = '';
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  const [workshopSettings, setWorkshopSettings] = useState<WorkshopSettings>({
    id: '',
    workshopName: null,
    logoImage: null,
    expenses: [],
    workingDaysPerMonth: 22,
    lastUpdated: new Date().toISOString()
  });

  const calculateDailyCost = useCallback((): number => {
    if (!workshopSettings || workshopSettings.expenses.length === 0 || !workshopSettings.workingDaysPerMonth) {
      return 0;
    }
    
    const totalMonthlyCost = workshopSettings.expenses.reduce((sum, expense) => {
      const unitValue = parseFloat(expense.unitValue?.toString() || '0') || 0;
      return sum + unitValue;
    }, 0);
    
    return totalMonthlyCost / workshopSettings.workingDaysPerMonth;
  }, [workshopSettings]);

  const calculateProjectSummary = useCallback((projectToCalculate: Project): ProjectSummary => {
    const isProjectTechnicalStageCompleted = projectToCalculate?.stages?.projetoTecnico?.completed || false;
    
    let fixedExpensesTotal = 0;
    
    if (projectToCalculate.fixedExpenses && projectToCalculate.fixedExpenses.length > 0) {
      fixedExpensesTotal = projectToCalculate.fixedExpenses.reduce((sum: number, expense) => {
        const quantity = typeof expense.quantity === 'string' 
          ? (expense.quantity === '' ? 0 : parseFloat(expense.quantity)) 
          : (expense.quantity || 0);
        const total = typeof expense.total === 'string'
          ? (expense.total === '' ? 0 : parseFloat(expense.total))
          : (expense.total || 0);
        const unitValue = typeof expense.unitValue === 'string'
          ? (expense.unitValue === '' ? 0 : parseFloat(expense.unitValue))
          : (expense.unitValue || 0);
        return sum + (total || (quantity * unitValue));
      }, 0);
    } else {
      const dailyCost = isProjectTechnicalStageCompleted && projectToCalculate.frozenDailyCost !== undefined
        ? projectToCalculate.frozenDailyCost
        : calculateDailyCost();
        
      fixedExpensesTotal = dailyCost * ((projectToCalculate.fixedExpenseDays !== undefined) ? projectToCalculate.fixedExpenseDays : 0);
    }

    const variableExpensesTotal = projectToCalculate.variableExpenses 
      ? projectToCalculate.variableExpenses.reduce((sum: number, expense) => {
          const quantity = typeof expense.quantity === 'string' 
            ? (expense.quantity === '' ? 0 : parseFloat(expense.quantity)) 
            : (expense.quantity || 0);
          const total = typeof expense.total === 'string'
            ? (expense.total === '' ? 0 : parseFloat(expense.total))
            : (expense.total || 0);
          const unitValue = typeof expense.unitValue === 'string'
            ? (expense.unitValue === '' ? 0 : parseFloat(expense.unitValue))
            : (expense.unitValue || 0);
          return sum + (total || (quantity * unitValue));
        }, 0)
      : 0;

    const materialsTotal = projectToCalculate.materials
      ? projectToCalculate.materials.reduce((sum: number, material) => {
          const quantity = typeof material.quantity === 'string' 
            ? (material.quantity === '' ? 0 : parseFloat(material.quantity)) 
            : (material.quantity || 0);
          const total = typeof material.total === 'string'
            ? (material.total === '' ? 0 : parseFloat(material.total))
            : (material.total || 0);
          const unitValue = typeof material.unitValue === 'string'
            ? (material.unitValue === '' ? 0 : parseFloat(material.unitValue))
            : (material.unitValue || 0);
          return sum + (total || (quantity * unitValue));
        }, 0)
      : 0;
    
    const totalCost = fixedExpensesTotal + variableExpensesTotal + materialsTotal;
    const profitMarginToUse = projectToCalculate.profitMargin !== undefined ? projectToCalculate.profitMargin : 20;
    
    const salePrice = profitMarginToUse === 0 ? totalCost : totalCost / (1 - profitMarginToUse / 100);
    const profitAmount = salePrice - totalCost;
    
    const markup = materialsTotal > 0 ? salePrice / materialsTotal : 1;
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

  const calculateSummary = useCallback((): ProjectSummary => {
    const activeProject = projects.find(p => p.id === activeProjectId);
    if (!activeProject) {
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

  const handleStageChange = async (
    stageId: keyof ProjectStages,
    field: 'completed' | 'date' | 'cancellationReason' | 'realCost' | 'hasCompletionNotes' | 'completionNotes',
    value: boolean | string | number
  ) => {
    console.log(`Alterando etapa ${stageId}, campo ${field}, valor ${value}`);
    
    if (stageId === 'projetoTecnico' && field === 'completed' && value === true) {
      const currentProject = projects.find(p => p.id === activeProjectId);
      if (!currentProject?.clientName || !currentProject?.name || currentProject.clientName.trim() === '' || currentProject.name.trim() === '') {
        alert("Não é possível marcar a etapa 'Projeto Técnico' sem preencher o nome do cliente e nome do projeto.");
        return;
      }
      
      const confirmCheck = window.confirm(
        "Se essa etapa for selecionada, todas as despesas fixas serão congeladas e não serão mais afetadas por mudanças nas configurações da marcenaria. Deseja continuar?"
      );
      
      if (!confirmCheck) {
        console.log('Operação cancelada pelo usuário');
        return;
      }
      
      console.log('Confirmação aceita pelo usuário. Congelando despesas...');
      
      let frozenValue = undefined;
      if (useWorkshopForFixedExpenses) {
        frozenValue = calculateDailyCost();
        console.log(`Valor diário congelado: ${frozenValue}`);
      }
      
      const updatedStages = {
        ...projectStages,
        [stageId]: {
          ...projectStages[stageId],
          completed: true,
          date: projectStages[stageId].date || new Date().toISOString().split('T')[0]
        }
      };
      
      setProjectStages(updatedStages);
      setFrozenDailyCost(frozenValue);
      
      const updatedProject = {
        ...currentProject!,
        stages: updatedStages,
        frozenDailyCost: frozenValue,
        lastModified: new Date().toISOString()
      };
      
      try {
        const { data, error } = await updateProject(updatedProject);
        if (error) throw error;
        setProjects(prev => prev.map(project => 
          project.id === activeProjectId ? data! : project
        ));
        console.log('Projeto atualizado com sucesso e despesas fixas congeladas');
      } catch (error) {
        console.error('Erro ao atualizar projeto no Supabase:', error);
        alert('Erro ao salvar as alterações no projeto.');
      }
      
      return;
    }
    
    if (stageId === 'projetoTecnico' && field === 'completed' && value === false) {
      const confirmUncheck = window.confirm(
        "Se você desmarcar a etapa Projeto Técnico, as Despesas Fixas serão atualizadas com os últimos valores inseridos na página Minha Marcenaria. Deseja continuar?"
      );
      
      if (!confirmUncheck) {
        console.log('Operação cancelada pelo usuário');
        return;
      }
      
      console.log('Confirmação de desmarcação aceita. Descongelando despesas...');
      
      const updatedStages = {
        ...projectStages,
        [stageId]: {
          ...projectStages[stageId],
          completed: false
        }
      };
      
      setProjectStages(updatedStages);
      setFrozenDailyCost(undefined);
      
      const updatedProject = {
        ...projects.find(p => p.id === activeProjectId)!,
        stages: updatedStages,
        frozenDailyCost: undefined,
        lastModified: new Date().toISOString()
      };
      
      try {
        const { data, error } = await updateProject(updatedProject);
        if (error) throw error;
        setProjects(prev => prev.map(project => 
          project.id === activeProjectId ? data! : project
        ));
        console.log('Projeto atualizado com sucesso');
      } catch (error) {
        console.error('Erro ao atualizar projeto no Supabase:', error);
        alert('Erro ao salvar as alterações no projeto.');
      }
      
      return;
    }
    
    const updatedStages = {
      ...projectStages,
      [stageId]: {
        ...projectStages[stageId],
        [field]: value,
        ...(field === 'completed' && value === true && !projectStages[stageId].date
          ? { date: new Date().toISOString().split('T')[0] }
          : {})
      }
    };
    
    setProjectStages(updatedStages);
    
    const updatedProject = {
      ...projects.find(p => p.id === activeProjectId)!,
      stages: updatedStages,
      lastModified: new Date().toISOString()
    };
    
    try {
      const { data, error } = await updateProject(updatedProject);
      if (error) throw error;
      setProjects(prev => prev.map(project => 
        project.id === activeProjectId ? data! : project
      ));
    } catch (error) {
      console.error('Erro ao atualizar projeto no Supabase:', error);
      alert('Erro ao salvar as alterações no projeto.');
    }
  };

  const handleCreateProject = async () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    
    const newProject: Project = {
      id: '',
      name: '',
      date: new Date().toISOString().split('T')[0],
      clientId: null,
      clientName: '',
      contactPhone: '',
      fixedExpenses: [],
      variableExpenses: [],
      materials: [],
      profitMargin: 20,
      totalCost: 0,
      salePrice: 0,
      comments: '',
      fixedExpenseDays: undefined,
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
        projetoCancelado: { completed: false, date: null }
      },
      lastModified: undefined,
      useWorkshopForFixedExpenses: true,
      frozenDailyCost: undefined,
      priceType: 'normal',
      markupPercentage: 10,
      estimatedCompletionDate: null
    };

    try {
      const { data, error } = await createProject(newProject);
      if (error) throw error;
      setProjects(prev => [...prev, data!]);
      setActiveProjectId(data!.id);
      setShowProjectsKanban(false);
      setShowClientsList(false);
      setShowMyWorkshop(false);
      setShowFinancialSummary(false);
      setShowUserProfile(false);

      setProjectName('');
      setClientName('');
      setContactPhone('');
      setProjectDate(new Date().toISOString().split('T')[0]);
      setFixedExpenses([]);
      setVariableExpenses([]);
      setMaterials([]);
      setProfitMargin(20);
      setProjectComments('');
      setFixedExpenseDays(undefined);
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
        projetoCancelado: { completed: false, date: null }
      });
      setUseWorkshopForFixedExpenses(true);
      setFrozenDailyCost(undefined);
      setPriceType('normal');
    } catch (error) {
      console.error('Erro ao criar projeto no Supabase:', error);
      alert('Erro ao criar o projeto.');
    }
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setShowProjectsKanban(false);
    setShowClientsList(false);
    setShowMyWorkshop(false);
    setShowFinancialSummary(false);
    setShowUserProfile(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;
    
    const projectName = projectToDelete.name || 'Projeto sem nome';
    const clientName = projectToDelete.clientName ? `${projectToDelete.clientName} - ` : '';
    
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir permanentemente o projeto "${clientName}${projectName}"? Esta ação não pode ser desfeita.`
    );
    
    if (confirmDelete) {
      try {
        const { success, error } = await deleteProject(projectId);
        if (error) throw error;
        if (success) {
          setProjects(prev => prev.filter(project => project.id !== projectId));
          if (activeProjectId === projectId) {
            setActiveProjectId(null);
            setShowProjectsKanban(true);
            setShowClientsList(false);
            setShowMyWorkshop(false);
            setShowFinancialSummary(false);
            setShowUserProfile(false);
          }
        }
      } catch (error) {
        console.error('Erro ao excluir projeto no Supabase:', error);
        alert('Erro ao excluir o projeto.');
      }
    }
  };

  const saveCurrentProject = async () => {
    if (!projectName.trim() || !clientName.trim()) {
      alert('Por favor, insira o nome do cliente e o nome do projeto.');
      return;
    }

    const summary = calculateProjectSummary({
      id: activeProjectId || '',
      name: projectName,
      date: projectDate,
      clientId: selectedClientId,
      clientName: clientName,
      contactPhone: contactPhone,
      fixedExpenses: fixedExpenses,
      variableExpenses: variableExpenses,
      materials: materials,
      profitMargin: profitMargin,
      comments: projectComments,
      stages: projectStages,
      totalCost: 0,
      salePrice: 0,
      fixedExpenseDays: fixedExpenseDays !== undefined ? fixedExpenseDays : undefined,
      useWorkshopForFixedExpenses: useWorkshopForFixedExpenses,
      frozenDailyCost: frozenDailyCost !== undefined ? frozenDailyCost : undefined,
      priceType: priceType,
      markupPercentage: 10,
      estimatedCompletionDate: null
    });
    const currentDateTime = new Date().toISOString();
    
    const updatedProject = {
      ...projects.find(project => project.id === activeProjectId)!,
      name: projectName,
      date: projectDate,
      clientId: selectedClientId,
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
      markupPercentage: 10,
      estimatedCompletionDate: null
    };
    
    try {
      const { data, error } = await updateProject(updatedProject);
      if (error) throw error;
      setProjects(prev => prev.map(project => 
        project.id === activeProjectId ? data! : project
      ));
    } catch (error) {
      console.error('Erro ao salvar projeto no Supabase:', error);
      alert('Erro ao salvar o projeto.');
    }
  };

  const handleSaveProject = async () => {
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
    
    await saveCurrentProject();
    alert('Projeto salvo com sucesso!');
  };

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClientName(value);
    
    if (!value.trim()) {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
      setSelectedClientId(null);
      return;
    }
    
    const normalizedValue = normalizeText(value);
    
    const projectClientNames = projects
      .map(project => project.clientName)
      .filter(name => 
        name && 
        normalizeText(name).includes(normalizedValue)
      );
    
    const registeredClientNames = clients
      .map(client => client.name)
      .filter(name => 
        name && 
        normalizeText(name).includes(normalizedValue)
      );
    
    const allMatchingClients = [...projectClientNames, ...registeredClientNames];
    
    const uniqueClients = Array.from(new Set(allMatchingClients))
      .filter(name => normalizeText(name) !== normalizedValue)
      .sort((a, b) => {
        const aStartsWith = normalizeText(a).startsWith(normalizedValue);
        const bStartsWith = normalizeText(b).startsWith(normalizedValue);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 5);
    
    setClientSuggestions(uniqueClients);
    setShowClientSuggestions(uniqueClients.length > 0);
    
    const matchingClient = clients.find(client => normalizeText(client.name) === normalizedValue);
    setSelectedClientId(matchingClient ? matchingClient.id : null);
  };

  const handleSelectClientSuggestion = (clientName: string) => {
    console.log('Selecionando sugestão:', clientName);
    
    setClientName(clientName);
    
    const matchingClient = clients.find(client => normalizeText(client.name) === normalizeText(clientName));
    
    if (matchingClient) {
      console.log('Cliente cadastrado encontrado:', matchingClient);
      if (matchingClient.phone) {
        console.log('Preenchendo telefone do cliente cadastrado:', matchingClient.phone);
        setContactPhone(matchingClient.phone);
      }
      setSelectedClientId(matchingClient.id);
    } else {
      const clientProjects = projects.filter(project => 
        project.clientName === clientName
      );
      
      if (clientProjects.length > 0) {
        const sortedProjects = [...clientProjects].sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        const latestPhone = sortedProjects[0].contactPhone;
        
        if (latestPhone) {
          console.log('Preenchendo telefone automaticamente de projeto anterior:', latestPhone);
          setContactPhone(latestPhone);
        }
      }
      
      setSelectedClientId(null);
    }
    
    setClientSuggestions([]);
    setShowClientSuggestions(false);
    
    setTimeout(() => {
      const projectNameInput = document.querySelector('input[placeholder="Nome do Projeto"]') as HTMLInputElement;
      if (projectNameInput) {
        projectNameInput.focus();
      }
    }, 100);
  };

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
    const onlyNumbers = e.target.value.replace(/\D/g, '');
    const limitedNumbers = onlyNumbers.slice(0, 11);
    
    let formattedValue = '';
    if (limitedNumbers.length <= 2) {
      formattedValue = limitedNumbers.length ? `(${limitedNumbers}` : '';
    } else if (limitedNumbers.length <= 7) {
      formattedValue = `(${limitedNumbers.substring(0, 2)}) ${limitedNumbers.substring(2)}`;
    } else {
      formattedValue = `(${limitedNumbers.substring(0, 2)}) ${limitedNumbers.substring(2, 7)}-${limitedNumbers.substring(7)}`;
    }
    
    setContactPhone(formattedValue);
  };

  const handleProjectDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectDate(e.target.value);
  };

  const abbreviateText = (text: string, maxLength: number = 10): string => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const handleShowClientsList = () => {
    setActiveProjectId(null);
    setShowClientsList(true);
    setShowProjectsKanban(false);
    setShowMyWorkshop(false);
    setShowFinancialSummary(false);
    setShowUserProfile(false);
    
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleDuplicateProject = async () => {
    if (!activeProjectId) return;
    
    const currentProject = projects.find(p => p.id === activeProjectId);
    if (!currentProject) return;
    
    const duplicatedProject: Project = {
      id: '',
      name: '',
      date: new Date().toISOString().split('T')[0],
      clientId: null,
      clientName: '',
      contactPhone: '',
      fixedExpenses: JSON.parse(JSON.stringify(currentProject.fixedExpenses)),
      variableExpenses: JSON.parse(JSON.stringify(currentProject.variableExpenses)),
      materials: JSON.parse(JSON.stringify(currentProject.materials)),
      profitMargin: currentProject.profitMargin,
      totalCost: currentProject.totalCost,
      salePrice: currentProject.salePrice,
      comments: '',
      fixedExpenseDays: undefined,
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
        projetoCancelado: { completed: false, date: null }
      },
      lastModified: undefined,
      useWorkshopForFixedExpenses: true,
      frozenDailyCost: undefined,
      priceType: 'normal',
      markupPercentage: 10,
      estimatedCompletionDate: null
    };
    
    try {
      const { data, error } = await createProject(duplicatedProject);
      if (error) throw error;
      setProjects(prev => [data!, ...prev]);
      setActiveProjectId(data!.id);
      
      setFixedExpenses(JSON.parse(JSON.stringify(currentProject.fixedExpenses)));
      setVariableExpenses(JSON.parse(JSON.stringify(currentProject.variableExpenses)));
      setMaterials(JSON.parse(JSON.stringify(currentProject.materials)));
      setProfitMargin(currentProject.profitMargin);
      setProjectName('');
      setClientName('');
      setContactPhone('');
      setProjectDate(new Date().toISOString().split('T')[0]);
      setProjectComments('');
      setFixedExpenseDays(undefined);
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
        projetoCancelado: { completed: false, date: null }
      });
      setUseWorkshopForFixedExpenses(true);
      setFrozenDailyCost(undefined);
      setPriceType('normal');
    } catch (error) {
      console.error('Erro ao duplicar projeto no Supabase:', error);
      alert('Erro ao duplicar o projeto.');
    }
  };

  const handleSaveWorkshopSettings = async (settings: WorkshopSettings) => {
    try {
      const { data, error } = await saveWorkshopSettings(settings);
      if (error) throw error;
      setWorkshopSettings(data!);
      console.log('Configurações da marcenaria atualizadas:', data);
    } catch (error) {
      console.error('Erro ao salvar configurações da marcenaria no Supabase:', error);
      alert('Erro ao salvar as configurações da marcenaria.');
    }
  };

  const handleUpdateFixedExpenseDays = (days: number | null) => {
    setFixedExpenseDays(days === null ? undefined : days);
  };

  const handleAddClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await createClient(client);
      if (error) throw error;
      setClients(prevClients => [...prevClients, data!]);
      return data;
    } catch (error) {
      console.error('Erro ao adicionar cliente no Supabase:', error);
      alert('Erro ao adicionar o cliente.');
      return null;
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    try {
      const { data, error } = await updateClient(updatedClient);
      if (error) throw error;
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === updatedClient.id ? data! : client
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar cliente no Supabase:', error);
      alert('Erro ao atualizar o cliente.');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const clientProjects = projects.filter(project => project.clientId === clientId);
    
    if (clientProjects.length > 0) {
      const confirmDelete = window.confirm(
        `Este cliente está associado a ${clientProjects.length} projeto(s). Deseja realmente excluí-lo?`
      );
      
      if (!confirmDelete) return;
    }
    
    try {
      const { success, error } = await deleteClient(clientId);
      if (error) throw error;
      if (success) {
        setClients(prevClients => prevClients.filter(client => client.id !== clientId));
      }
    } catch (error) {
      console.error('Erro ao excluir cliente no Supabase:', error);
      alert('Erro ao excluir o cliente.');
    }
  };

  const [showClientTracking, setShowClientTracking] = useState(false);
  const [trackingProjectId, setTrackingProjectId] = useState<string | null>(null);

  const handleUpdateProject = async (projectId: string, field: string, value: any) => {
    const projectToUpdate = projects.find(p => p.id === projectId);
    if (!projectToUpdate) return;

    const updatedProject = {
      ...projectToUpdate,
      [field]: value,
      lastModified: new Date().toISOString()
    };

    try {
      const { data, error } = await updateProject(updatedProject);
      if (error) throw error;
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === projectId ? data! : p
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar projeto no Supabase:', error);
      alert('Erro ao atualizar o projeto.');
    }
  };

  const ClientTrackingView = () => {
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const loadProject = async () => {
        try {
          if (!trackingProjectId) {
            setError("Link de rastreamento inválido");
            setLoading(false);
            return;
          }

          const { data, error } = await getProject(trackingProjectId);
          if (error) throw error;
          if (!data) {
            setError("Projeto não encontrado");
            setLoading(false);
            return;
          }

          setProject(data);
          setLoading(false);
        } catch (error) {
          console.error('Erro ao carregar projeto do Supabase:', error);
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
    
    const isProjectCompleted = project.stages.instalacao?.completed || false;
    const completionDate = project.stages.instalacao?.date 
      ? new Date(project.stages.instalacao.date).toLocaleDateString('pt-BR') 
      : '';

    const formattedEstimatedDate = project.estimatedCompletionDate 
      ? (() => {
          const date = new Date(project.estimatedCompletionDate);
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
                <p className="mt-1 text-sm opacity-80">
                  Iniciado em: {new Date(project.date).toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
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
              {formattedEstimatedDate && !isProjectCompleted && !isCanceled && (
                <p className="mt-4 text-center text-sm text-blue-600 font-medium">
                  Data prevista de entrega: {formattedEstimatedDate}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (user) {
      const handleBeforeUnload = () => {
        // Usar localStorage para verificar se o usuário fechou a aba/navegador
        localStorage.setItem('app_closing', 'true');
        
        // Não é necessário chamar signOut aqui, pois o navegador está fechando
        // e o sessionStorage será limpo automaticamente
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Verificar se o navegador foi fechado anteriormente
      const wasClosing = localStorage.getItem('app_closing') === 'true';
      if (wasClosing) {
        // Se o navegador foi fechado, fazer logout
        signOut();
        localStorage.removeItem('app_closing');
      }
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [user, signOut]);

  return (
    <>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
          <div className="text-white text-xl">Carregando...</div>
        </div>
      ) : !user ? (
        <Login />
      ) : showClientTracking ? (
        <ClientTrackingView />
      ) : (
        <div className="flex h-screen bg-gray-100">
          <div className="relative z-50">
            {sidebarOpen && (
              <div 
                className="md:hidden fixed inset-0 bg-black bg-opacity-50" 
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            <div 
              className={`fixed md:relative h-full z-50 transform ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              } md:translate-x-0 transition-transform duration-300 ease-in-out`}
            >
              <Sidebar
                projects={projects}
                activeProjectId={activeProjectId}
                workshopSettings={workshopSettings}
                onSelectProject={(projectId) => {
                  handleSelectProject(projectId);
                  setShowClientsList(false);
                  setShowProjectsKanban(false);
                  setShowMyWorkshop(false);
                  setShowFinancialSummary(false);
                  setShowUserProfile(false);
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                onCreateProject={handleCreateProject}
                onDeleteProject={handleDeleteProject}
                onClose={() => setSidebarOpen(false)}
                onClientsView={handleShowClientsList}
                onProjectsKanbanView={handleShowProjectsKanban}
                onMyWorkshopView={handleShowMyWorkshop}
                onFinancialSummaryView={handleShowFinancialSummary}
                onUserProfileView={handleShowUserProfile}
              />
            </div>
          </div>
        
          <div className="flex-1 flex flex-col overflow-auto">
            <div className="bg-blue-600 text-white shadow-lg w-full">
              <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button 
                      className="md:hidden mr-1 sm:mr-2 text-white" 
                      onClick={toggleSidebar}
                      aria-label="Toggle sidebar"
                    >
                      {sidebarOpen ? <X size={20} className="sm:hidden" /> : <Menu size={20} className="sm:hidden" />}
                      {sidebarOpen ? <X size={24} className="hidden sm:block" /> : <Menu size={24} className="hidden sm:block" />}
                    </button>
                    <Calculator size={24} className="sm:hidden" />
                    <Calculator size={32} className="hidden sm:block" />
                    <h1 className="text-2xl font-bold hidden sm:inline">Gestão de Processos e Precificação Inteligente para Marceneiros</h1>
                    <h1 className="text-lg font-bold sm:hidden">Gestão e Precificação</h1>
                  </div>
                </div>
                  
                {activeProjectId && (
                  <div className="w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative w-full sm:w-auto sm:max-w-[300px]">
                        <input
                          type="text"
                          value={clientName}
                          onChange={handleClientNameChange}
                          className="px-2 sm:px-3 py-1 h-9 rounded text-gray-800 font-medium text-sm sm:text-base w-full"
                          placeholder="Nome do Cliente"
                          ref={clientInputRef}
                          onFocus={() => {
                            if (clientName.trim()) {
                              handleClientNameChange({ target: { value: clientName } } as React.ChangeEvent<HTMLInputElement>);
                            }
                          }}
                        />
                        {showClientSuggestions && clientSuggestions.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            <ul className="py-1">
                              {clientSuggestions.map((suggestion, index) => (
                                <li 
                                  key={index}
                                  className="client-suggestion-item px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center text-gray-800"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    console.log('Clicou na sugestão (mousedown):', suggestion);
                                    handleSelectClientSuggestion(suggestion);
                                  }}
                                >
                                  <Search size={14} className="mr-2" />
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => {
                          setProjectName(e.target.value);
                        }}
                        className="px-2 sm:px-3 py-1 h-9 rounded text-gray-800 font-medium text-sm sm:text-base w-full sm:w-auto sm:max-w-[300px]"
                        placeholder="Nome do Projeto"
                      />
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={handleContactPhoneChange}
                        className="px-2 sm:px-3 py-1 h-9 rounded text-gray-800 font-medium text-sm sm:text-base w-full sm:w-auto sm:max-w-[300px]"
                        placeholder="Celular"
                      />
                      <input
                        type="date"
                        value={projectDate}
                        onChange={handleProjectDateChange}
                        className="px-2 sm:px-3 py-1 h-9 rounded text-gray-800 font-medium text-sm sm:text-base w-full sm:w-auto"
                        title="Data de Criação"
                      />
                      <button
                        className="flex items-center justify-center gap-2 px-4 py-1 h-9 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        onClick={handleSaveProject}
                      >
                        <Save size={16} />
                        Salvar
                      </button>
                      <button
                        className="flex items-center justify-center gap-2 px-4 py-1 h-9 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors"
                        onClick={handleDuplicateProject}
                        title="Duplicar projeto"
                      >
                        <Copy size={16} />
                        <span className="hidden sm:inline">Duplicar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {activeProjectId && (
              <ProjectStagesBar 
                stages={projectStages} 
                onChange={handleStageChange}
                projectId={activeProjectId}
                clientName={clientName}
                projectName={projectName}
                onUpdateProject={handleUpdateProject}
              />
            )}

            <div className="flex-1 p-2 sm:p-4">
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
                    setShowUserProfile(false);
                  }}
                />
              ) : showFinancialSummary ? (
                <FinancialSummary 
                  projects={projects} 
                  workshopSettings={workshopSettings}
                  onBack={() => {
                    setActiveProjectId(null);
                    setShowClientsList(false);
                    setShowProjectsKanban(true);
                    setShowMyWorkshop(false);
                    setShowFinancialSummary(false);
                    setShowUserProfile(false);
                  }} 
                  onDeleteProject={handleDeleteProject}
                />
              ) : showUserProfile ? (
                <UserProfile />
              ) : showProjectsKanban ? (
                <ProjectsKanban 
                  projects={projects} 
                  onSelectProject={(projectId) => {
                    handleSelectProject(projectId);
                    setShowClientsList(false);
                    setShowProjectsKanban(false);
                    setShowMyWorkshop(false);
                    setShowFinancialSummary(false);
                    setShowUserProfile(false);
                  }} 
                  onDeleteProject={handleDeleteProject}
                />
              ) : activeProjectId ? (
                <div className="container mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="lg:col-span-3 space-y-4 sm:space-y-6 order-1 lg:order-1">
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
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                              onFocus={(e) => {
                                if (!e.target.value) {
                                  e.target.style.height = '100px';
                                }
                              }}
                              ref={(textarea) => {
                                if (textarea) {
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

                      <div className="mt-4 sm:mt-6 flex justify-center">
                        <button
                          className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          onClick={handleSaveProject}
                        >
                          <Save size={20} />
                          Salvar Projeto
                        </button>
                      </div>
                    </div>

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
                        />
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
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
      )}
    </>
  );
}

export default App;