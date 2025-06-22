import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Calculator, Menu, X, Save, Copy, 
  Plus, AlertCircle, Search, Check, XCircle, Loader2, Trash2
} from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ExpenseSection } from './components/ExpenseSection';
import { Summary } from './components/Summary';
import { Sidebar } from './components/Sidebar';
import { ExpenseItem, Project, ProjectSummary, ProjectStages, WorkshopSettings, Client } from './types';
import { ProjectStagesBar } from './components/ProjectStagesBar';
import { ClientsList } from './components/ClientsList';
import { ProjectsKanban } from './components/ProjectsKanban';
import { MyWorkshop } from './components/MyWorkshop';
import { FinancialSummary } from './components/FinancialSummary';
import TrackingView from './components/TrackingView';
import { UserProfile } from './components/UserProfile';
import Dashboard from './components/Dashboard'; // Importar o componente Dashboard
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Signup } from './components/Signup'; // Importar o componente Signup
import { getProjects, createProject, updateProject, deleteProject } from './services/projectService';
import { getClients, createClient, updateClient, deleteClient } from './services/clientService';
import { getWorkshopSettings, saveWorkshopSettings } from './services/workshopService';
import { useLocation } from 'react-router-dom';
import { getProjectStatus } from './components/ProjectsKanban';
import ChatDrawer from './components/ChatDrawer/ChatDrawer';




function App() {
  return (
    <Routes>
      <Route path="/tracking/:id" element={<TrackingView />} />
      <Route path="/*" element={<AuthenticatedRoot />} />
    </Routes>
  );
}

function AuthenticatedRoot() {
  const location = useLocation();

  if (location.pathname.startsWith('/tracking')) {
    return <TrackingView />;
  }

  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { user, loading, signOut } = useAuth();
  const [showProjectsKanban, setShowProjectsKanban] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showClientsList, setShowClientsList] = useState(false);
  const [showMyWorkshop, setShowMyWorkshop] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true); // Dashboard começa visível
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Novo estado para controlar se a sidebar está retraída
  
  // Função para salvar o estado de navegação no sessionStorage
  const saveNavigationState = () => {
    if (user) {
      const navigationState = {
        showProjectsKanban,
        showClientsList,
        showMyWorkshop,
        showFinancialSummary,
        showUserProfile,
        showDashboard,
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
  }, [showProjectsKanban, showClientsList, showMyWorkshop, showFinancialSummary, showUserProfile, showDashboard, activeProjectId, user]);
  
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
          setShowDashboard(navigationState.showDashboard);
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
    setShowDashboard(false);
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
    setShowDashboard(false);
    
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
    setShowDashboard(false);
    
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
    setShowDashboard(false);
    
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  
  const handleShowDashboard = () => {
    setActiveProjectId(null);
    setShowClientsList(false);
    setShowProjectsKanban(false);
    setShowMyWorkshop(false);
    setShowFinancialSummary(false);
    setShowUserProfile(false);
    setShowDashboard(true);
    
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
  
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');

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

      setIsLoadingData(true); // Ativar o estado de carregamento
      
      try {
        // Verificar se existe um estado de navegação salvo
        const storedNavigationState = sessionStorage.getItem('navigationState');
        const hasStoredState = !!storedNavigationState;
        
        // Verificar se já carregamos dados nesta sessão
        const dataAlreadyLoaded = sessionStorage.getItem('dataAlreadyLoaded') === 'true';
        
        // Verificar se é um novo login
        const isNewLogin = sessionStorage.getItem('userAuthenticated') !== 'true';
        
        // Verificar se devemos forçar a recarga dos dados do Supabase (definido durante o login no AuthContext)
        const forceDataReload = localStorage.getItem('forceDataReload') === 'true';
        
        // Se for um novo login, se os dados ainda não foram carregados nesta sessão,
        // ou se forceDataReload está ativo, carregar do Supabase
        if (isNewLogin || !dataAlreadyLoaded || forceDataReload) {
          console.log('Novo login, primeira carga de dados ou recarga forçada, carregando do Supabase...');
          
          // Carregar projetos do Supabase
          const { data: projectsData, error: projectsError } = await getProjects();
          if (projectsError) throw projectsError;
          setProjects(projectsData || []);
          
          // Salvar no localStorage para uso futuro
          localStorage.setItem('cachedProjects', JSON.stringify(projectsData || []));
          console.log('Projetos carregados do Supabase e salvos no localStorage');
          
          // Carregar clientes do Supabase
          const { data: clientsData, error: clientsError } = await getClients();
          if (clientsError) throw clientsError;
          setClients(clientsData || []);
          
          // Salvar no localStorage para uso futuro
          localStorage.setItem('cachedClients', JSON.stringify(clientsData || []));
          console.log('Clientes carregados do Supabase e salvos no localStorage');
          
          // Marcar que o usuário está autenticado
          sessionStorage.setItem('userAuthenticated', 'true');
          
          // Marcar que já carregamos os dados nesta sessão
          sessionStorage.setItem('dataAlreadyLoaded', 'true');
          
          // Limpar a flag forceDataReload após a carga
          if (forceDataReload) {
            localStorage.removeItem('forceDataReload');
            console.log('Flag forceDataReload removida após recarga dos dados');
          }
          
        } else {
          console.log('Dados já carregados nesta sessão, usando cache...');
          
          // Tentar carregar projetos do localStorage
          const localProjects = localStorage.getItem('cachedProjects');
          if (localProjects) {
            const parsedProjects = JSON.parse(localProjects);
            setProjects(parsedProjects);
            console.log('Projetos carregados do localStorage');
          }
          
          // Tentar carregar clientes do localStorage
          const localClients = localStorage.getItem('cachedClients');
          if (localClients) {
            const parsedClients = JSON.parse(localClients);
            setClients(parsedClients);
            console.log('Clientes carregados do localStorage');
          }
        }
        
        // Carregar configurações da marcenaria
        const loadWorkshopSettings = async () => {
          if (!user) return;
          
          try {
            // Tentar carregar do Supabase
            const { data, error } = await getWorkshopSettings();
            
            if (error) {
              console.error('Erro ao carregar configurações da marcenaria do Supabase:', error);
              // Se não temos dados locais e houve erro, criar configurações padrão
              if (!localStorage.getItem('cachedWorkshopSettings')) {
                const defaultSettings = {
                  workingDaysPerMonth: 22,
                  workshopName: '', 
                  logoImage: undefined,
                  expenses: [],
                  lastUpdated: new Date().toISOString()
                };
                console.log('[WorkshopSettings] Salvando defaultSettings no localStorage pois não havia dados prévios.');
                localStorage.setItem('cachedWorkshopSettings', JSON.stringify(defaultSettings));
              } else {
                console.log('[WorkshopSettings] NÃO sobrescreveu localStorage, pois já havia dados salvos.');
              }
            } else if (data) {
              // Se carregou com sucesso do Supabase, atualizar o estado e o localStorage
              setWorkshopSettings(data);
              console.log('[WorkshopSettings] Salvando dados no localStorage:', data);
              localStorage.setItem('cachedWorkshopSettings', JSON.stringify(data));
              console.log('Configurações da marcenaria atualizadas do Supabase');
            }
          } catch (error) {
            console.error('Erro ao carregar configurações da marcenaria:', error);
            // Em caso de exceção, verificar se temos dados locais
            if (localStorage.getItem('cachedWorkshopSettings')) {
              const localSettings = JSON.parse(localStorage.getItem('cachedWorkshopSettings')!);
              setWorkshopSettings(localSettings);
            } else {
              // Se não temos dados locais, criar configurações padrão
              if (!localStorage.getItem('cachedWorkshopSettings')) {
                const defaultSettings = {
                  workingDaysPerMonth: 22,
                  workshopName: '', 
                  logoImage: undefined,
                  expenses: [],
                  lastUpdated: new Date().toISOString()
                };
                console.log('[WorkshopSettings] Salvando defaultSettings no localStorage pois não havia dados prévios.');
                localStorage.setItem('cachedWorkshopSettings', JSON.stringify(defaultSettings));
              } else {
                console.log('[WorkshopSettings] NÃO sobrescreveu localStorage, pois já havia dados salvos.');
              }
              setWorkshopSettings(defaultSettings);
            }
          }
        };
        
        loadWorkshopSettings();
        
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        setProjects([]);
        setClients([]);
        setWorkshopSettings({
          workingDaysPerMonth: 22,
          workshopName: '', 
          logoImage: undefined,
          expenses: [],
          lastUpdated: new Date().toISOString()
        });
      }
      
      setIsLoadingData(false); // Desativar o estado de carregamento
    };

    loadInitialData();
  }, [user]);

  useEffect(() => {
    // Quando o usuário não estiver autenticado (após logout), redefinir os estados para seus valores padrão
    if (!user && !loading) {
      setShowProjectsKanban(false);
      setShowClientsList(false);
      setShowMyWorkshop(false);
      setShowFinancialSummary(false);
      setShowUserProfile(false);
      setShowDashboard(false);
      setActiveProjectId(null);
      setProjects([]);
      setClients([]);
      setWorkshopSettings({
        workingDaysPerMonth: 22,
        workshopName: '', 
        logoImage: undefined,
        expenses: [],
        lastUpdated: new Date().toISOString()
      });
    }
  }, [user, loading]);

  useEffect(() => {
    if (activeProjectId) {
      console.log('Carregando projeto com ID:', activeProjectId);
      
      // Verificar primeiro se temos dados de edição temporários no localStorage
      const tempEditKey = `editing_project_${activeProjectId}`;
      const tempEditData = localStorage.getItem(tempEditKey);
      
      if (tempEditData) {
        try {
          // Se temos dados temporários, usá-los em vez de recarregar
          console.log('Usando dados temporários do localStorage para o projeto:', activeProjectId);
          const projectData = JSON.parse(tempEditData);
          console.log('Dados temporários encontrados:', projectData);
          console.log('Data prevista nos dados temporários:', projectData.estimatedCompletionDate);
          
          // Atualizar todos os estados com os dados temporários
          setProjectName(projectData.name);
          setClientName(projectData.clientName);
          setContactPhone(projectData.contactPhone);
          setProjectDate(projectData.date);
          setFixedExpenses(projectData.fixedExpenses);
          setVariableExpenses(projectData.variableExpenses);
          setMaterials(projectData.materials);
          setProfitMargin(projectData.profitMargin);
          setProjectComments(projectData.comments);
          setProjectStages(projectData.stages);
          setFixedExpenseDays(projectData.fixedExpenseDays);
          setUseWorkshopForFixedExpenses(projectData.useWorkshopForFixedExpenses);
          setFrozenDailyCost(projectData.frozenDailyCost);
          setEstimatedCompletionDate(projectData.estimatedCompletionDate || '');
          
          return; // Sair do useEffect sem carregar do banco
        } catch (error) {
          console.error('Erro ao processar dados temporários:', error);
          // Em caso de erro, continuar com o carregamento normal
        }
      }
      
      // Se não temos dados temporários, carregar do array de projetos
      const activeProject = projects.find(project => project.id === activeProjectId);
      console.log('Projeto encontrado no array de projetos:', activeProject);
      
      if (activeProject) {
        console.log('Data prevista no projeto encontrado:', activeProject.estimatedCompletionDate);
        
        setProjectName(activeProject.name);
        setClientName(activeProject.clientName);
        setContactPhone(activeProject.contactPhone);
        setProjectDate(activeProject.date);
        setFixedExpenses(activeProject.fixedExpenses);
        setVariableExpenses(activeProject.variableExpenses);
        setMaterials(activeProject.materials);
        setProfitMargin(activeProject.profitMargin);
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
        
        // Garantir que a data prevista seja definida corretamente, mesmo que seja uma string vazia
        console.log('Definindo data prevista para:', activeProject.estimatedCompletionDate || '');
        setEstimatedCompletionDate(activeProject.estimatedCompletionDate || '');
      }
    }
  }, [activeProjectId, projects]);

  useEffect(() => {
    if (!user || !activeProjectId) return;
    
    // Só salvar temporariamente se estiver em edição (não tiver concluído "Projeto Técnico")
    const currentProject = projects.find(p => p.id === activeProjectId);
    const isProjectTechnicalStageCompleted = currentProject?.stages?.projetoTecnico?.completed || false;
    
    if (!isProjectTechnicalStageCompleted) {
      // Salvar os dados atuais do projeto que está sendo editado
      const tempData = {
        name: projectName,
        clientName: clientName,
        contactPhone: contactPhone,
        date: projectDate,
        fixedExpenses: fixedExpenses,
        variableExpenses: variableExpenses,
        materials: materials,
        profitMargin: profitMargin,
        comments: projectComments,
        stages: projectStages,
        fixedExpenseDays: fixedExpenseDays,
        useWorkshopForFixedExpenses: useWorkshopForFixedExpenses,
        frozenDailyCost: frozenDailyCost,
        estimatedCompletionDate: estimatedCompletionDate,
        lastSaved: new Date().toISOString()
      };
      
      // Usar localStorage em vez de sessionStorage para persistir entre recargas
      localStorage.setItem(`editing_project_${activeProjectId}`, JSON.stringify(tempData));
      console.log(`Dados temporários do projeto ${activeProjectId} salvos no localStorage`);
    }
  }, [
    user, activeProjectId, projectName, clientName, contactPhone, projectDate,
    fixedExpenses, variableExpenses, materials, profitMargin, projectComments,
    projectStages, fixedExpenseDays, useWorkshopForFixedExpenses, frozenDailyCost, estimatedCompletionDate, projects
  ]);

  useEffect(() => {
    const tempEditKey = `editing_project_${activeProjectId}`;
    const tempEditData = localStorage.getItem(tempEditKey);
    
    if (tempEditData) {
      try {
        const projectData = JSON.parse(tempEditData);
        
        if (projectData.name !== projectName ||
            projectData.clientName !== clientName ||
            projectData.contactPhone !== contactPhone ||
            projectData.date !== projectDate ||
            JSON.stringify(projectData.fixedExpenses) !== JSON.stringify(fixedExpenses) ||
            JSON.stringify(projectData.variableExpenses) !== JSON.stringify(variableExpenses) ||
            JSON.stringify(projectData.materials) !== JSON.stringify(materials) ||
            projectData.profitMargin !== profitMargin ||
            projectData.comments !== projectComments ||
            JSON.stringify(projectData.stages) !== JSON.stringify(projectStages) ||
            projectData.fixedExpenseDays !== fixedExpenseDays ||
            projectData.useWorkshopForFixedExpenses !== useWorkshopForFixedExpenses ||
            projectData.frozenDailyCost !== frozenDailyCost ||
            projectData.estimatedCompletionDate !== estimatedCompletionDate) {
          setHasUnsavedChanges(true);
        } else {
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Erro ao verificar alterações temporárias:', error);
      }
    } else {
      setHasUnsavedChanges(false);
    }
  }, [
    activeProjectId, projectName, clientName, contactPhone, projectDate,
    fixedExpenses, variableExpenses, materials, profitMargin, projectComments,
    projectStages, fixedExpenseDays, useWorkshopForFixedExpenses, frozenDailyCost, estimatedCompletionDate
  ]);

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

  const handleClearAllExpenses = () => {
    const confirmClear = window.confirm(
      "Tem certeza que deseja excluir TODAS as despesas deste projeto? Esta ação não pode ser desfeita."
    );
    
    if (confirmClear) {
      setFixedExpenses([]);
      setVariableExpenses([]);
      setMaterials([]);
    }
  };

  const [workshopSettings, setWorkshopSettings] = useState<WorkshopSettings>({
    workingDaysPerMonth: 22,
    workshopName: '', 
    logoImage: undefined,
    expenses: [],
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
      
      // Obter os valores atuais de imposto para congelar
      const currentTaxPercentage = workshopSettings?.taxPercentage || 0;
      const currentApplyTax = currentProject?.applyTax || false;
      
      const currentSummary = calculateSummary(currentProject!.id);
      let frozenTaxAmount = 0;
      
      if (currentApplyTax && currentTaxPercentage > 0) {
        frozenTaxAmount = currentSummary.totalCost * (currentTaxPercentage / 100);
      }
      
      // Calcular o preço final para congelar
      let frozenFinalPrice = 0;
      const costWithTax = currentSummary.totalCost + frozenTaxAmount;
      
      if (priceType === 'normal') {
        // Preço com margem de lucro
        const profitAmount = profitMargin > 0 
          ? (costWithTax * profitMargin / (100 - profitMargin))
          : 0;
        frozenFinalPrice = costWithTax + profitAmount;
      } else {
        // Preço com markup
        frozenFinalPrice = costWithTax * currentSummary.markup;
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
        // Congelar também os valores de imposto
        frozenTaxPercentage: currentTaxPercentage,
        frozenApplyTax: currentApplyTax,
        frozenTaxAmount: frozenTaxAmount, // Adicionar o valor congelado do imposto
        frozenFinalPrice: frozenFinalPrice, // Adicionar o preço final congelado
        lastModified: new Date().toISOString()
      };
      
      // Salvar imediatamente no localStorage para prevenir dessincronização
      if (activeProjectId) {
        const tempData = {
          name: projectName,
          clientName: clientName,
          contactPhone: contactPhone,
          date: projectDate,
          fixedExpenses: fixedExpenses,
          variableExpenses: variableExpenses,
          materials: materials,
          profitMargin: profitMargin,
          comments: projectComments,
          stages: updatedStages, // Usar os estágios atualizados
          fixedExpenseDays: fixedExpenseDays,
          useWorkshopForFixedExpenses: useWorkshopForFixedExpenses,
          frozenDailyCost: frozenValue,
          // Congelar também os valores de imposto
          frozenTaxPercentage: currentTaxPercentage,
          frozenApplyTax: currentApplyTax,
          frozenTaxAmount: frozenTaxAmount, // Adicionar o valor congelado do imposto
          frozenFinalPrice: frozenFinalPrice, // Adicionar o preço final congelado
          estimatedCompletionDate: estimatedCompletionDate,
          lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem(`editing_project_${activeProjectId}`, JSON.stringify(tempData));
        console.log(`Dados temporários atualizados no localStorage após mudança na etapa ${stageId}`);
      }
      
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
        ...projects.find(project => project.id === activeProjectId)!,
        stages: updatedStages,
        frozenDailyCost: undefined,
        lastModified: new Date().toISOString()
      };
      
      // Salvar imediatamente no localStorage para prevenir dessincronização
      if (activeProjectId) {
        const tempData = {
          name: projectName,
          clientName: clientName,
          contactPhone: contactPhone,
          date: projectDate,
          fixedExpenses: fixedExpenses,
          variableExpenses: variableExpenses,
          materials: materials,
          profitMargin: profitMargin,
          comments: projectComments,
          stages: updatedStages, // Usar os estágios atualizados
          fixedExpenseDays: fixedExpenseDays,
          useWorkshopForFixedExpenses: useWorkshopForFixedExpenses,
          frozenDailyCost: undefined,
          estimatedCompletionDate: estimatedCompletionDate,
          lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem(`editing_project_${activeProjectId}`, JSON.stringify(tempData));
        console.log(`Dados temporários atualizados no localStorage após desmarcação da etapa ${stageId}`);
      }
      
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
      ...projects.find(project => project.id === activeProjectId)!,
      stages: updatedStages,
      lastModified: new Date().toISOString()
    };
    
    // Salvar imediatamente no localStorage para prevenir dessincronização
    if (activeProjectId) {
      const tempData = {
        name: projectName,
        clientName: clientName,
        contactPhone: contactPhone,
        date: projectDate,
        fixedExpenses: fixedExpenses,
        variableExpenses: variableExpenses,
        materials: materials,
        profitMargin: profitMargin,
        comments: projectComments,
        stages: updatedStages, // Usar os estágios atualizados
        fixedExpenseDays: fixedExpenseDays,
        useWorkshopForFixedExpenses: useWorkshopForFixedExpenses,
        frozenDailyCost: frozenDailyCost,
        estimatedCompletionDate: estimatedCompletionDate,
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(`editing_project_${activeProjectId}`, JSON.stringify(tempData));
      console.log(`Dados temporários atualizados no localStorage após alteração na etapa ${stageId}`);
    }
    
    try {
      const { data, error } = await updateProject(updatedProject);
      
      if (error) {
        console.error('Erro ao atualizar projeto no Supabase:', error);
        throw error;
      }
      
      console.log('Resposta do Supabase após updateProject:', data);
      
      // Verificar especificamente a data prevista
      if (field === 'estimatedCompletionDate') {
        console.log('Data prevista no objeto retornado:', data?.estimatedCompletionDate);
      }
      
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === activeProjectId ? data! : p
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar projeto no Supabase:', error);
      alert('Erro ao atualizar o projeto.');
    }
  };

  const handleCreateProject = async () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    
    // Usar a data atual com milissegundos para garantir que seja a mais recente
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    
    // Calcular o salário diário a partir das configurações da marcenaria
    const salaryExpense = workshopSettings?.expenses?.find(expense => expense.type === 'Salário');
    const dailySalaryValue = salaryExpense 
      ? (salaryExpense.unitValue * salaryExpense.quantity) / workshopSettings.workingDaysPerMonth 
      : 0;
    
    const newProject: Project = {
      id: '',
      name: '',
      date: formattedDate,
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
      estimatedCompletionDate: null,
      dailySalary: dailySalaryValue // Adicionar o valor do salário diário
    };

    try {
      const { data, error } = await createProject(newProject);
      if (error) throw error;
      
      // Adicionar o novo projeto no início do array para que apareça no topo da lista
      setProjects(prev => [data!, ...prev]);
      
      setActiveProjectId(data!.id);
      setShowProjectsKanban(false);
      setShowClientsList(false);
      setShowMyWorkshop(false);
      setShowFinancialSummary(false);
      setShowUserProfile(false);
      setShowDashboard(false);

      setProjectName('');
      setClientName('');
      setContactPhone('');
      setProjectDate(new Date().toISOString().split('T')[0]);
      setFixedExpenses([]);
      setVariableExpenses([]);
      setMaterials([]);
      setProfitMargin(20);
      setProjectComments('');
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
      setEstimatedCompletionDate(null);
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
    setShowDashboard(false);
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
            setShowDashboard(false);
          }
        }
      } catch (error) {
        console.error('Erro ao excluir projeto no Supabase:', error);
        alert('Erro ao excluir o projeto.');
      }
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveCurrentProject = async () => {
    if (!projectName.trim() || !clientName.trim()) {
      alert('Por favor, insira o nome do cliente e o nome do projeto.');
      return;
    }

    setIsSaving(true);

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
      estimatedCompletionDate: estimatedCompletionDate
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
      estimatedCompletionDate: estimatedCompletionDate
    };
    
    try {
      const { data, error } = await updateProject(updatedProject);
      if (error) throw error;
      
      // Atualizar a lista de projetos local
      setProjects(prev => prev.map(project => 
        project.id === activeProjectId ? data! : project
      ));
      
      // Limpar dados temporários do localStorage, já que agora estão salvos no Supabase
      if (activeProjectId) {
        localStorage.removeItem(`editing_project_${activeProjectId}`);
        console.log('Dados temporários removidos do localStorage após salvamento');
      }
      
      // Resetar o estado de alterações não salvas
      setHasUnsavedChanges(false);
      console.log('Estado de alterações não salvas resetado após salvamento');
      
      setTimeout(() => {
        setIsSaving(false);
      }, 1500); // Mesmo tempo usado no ProjectStagesBar
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar projeto no Supabase:', error);
      alert('Erro ao salvar o projeto.');
      setIsSaving(false);
      return false;
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
    setShowDashboard(false);
    
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
      setFixedExpenses([]);
      setVariableExpenses([]);
      setMaterials([]);
      setProjectComments('');
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
      setEstimatedCompletionDate(null);
    } catch (error) {
      console.error('Erro ao duplicar projeto no Supabase:', error);
      alert('Erro ao duplicar o projeto.');
    }
  };

  const handleSaveWorkshopSettings = async (settings: WorkshopSettings) => {
    try {
      // Salvar localmente primeiro para garantir que os dados não sejam perdidos
      const localSettings = {
        ...settings,
        lastUpdated: new Date().toISOString()
      };
      console.log('[WorkshopSettings] Salvando dados no localStorage:', localSettings);
      localStorage.setItem('cachedWorkshopSettings', JSON.stringify(localSettings));
      setWorkshopSettings(localSettings);
      
      // Calcular o novo valor do salário diário
      const salaryExpense = settings.expenses.find(expense => expense.type === 'Salário');
      const newDailySalary = salaryExpense 
        ? (salaryExpense.unitValue * salaryExpense.quantity) / settings.workingDaysPerMonth 
        : 0;
      
      const updatedProjects = projects.map(project => {
          if (
            project.useWorkshopForFixedExpenses &&
            getProjectStatus(project) === 'toStart'
          ) {
            return {
              ...project,
              dailySalary: newDailySalary
            };
          }
          return project;
        });
      
      // Atualizar os projetos localmente
      setProjects(updatedProjects);
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      
      // Tentar salvar no Supabase
      const { data, error } = await saveWorkshopSettings(settings);
      if (error) {
        console.error('Erro ao salvar configurações da marcenaria no Supabase:', error);
      } else if (data) {
        setWorkshopSettings(data);
        console.log('[WorkshopSettings] Salvando dados no localStorage:', data);
        localStorage.setItem('cachedWorkshopSettings', JSON.stringify(data));
        console.log('Configurações da marcenaria atualizadas no Supabase');
      }
      
      // Atualizar os projetos no Supabase
      for (const project of updatedProjects) {
        if (
          project.useWorkshopForFixedExpenses &&
          getProjectStatus(project) === 'toStart'
        ) {
          try {
            await updateProject(project);
          } catch (error) {
            console.error(`Erro ao atualizar o salário diário no projeto ${project.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao salvar configurações da marcenaria:', error);
      alert('Erro ao salvar as configurações no servidor. Os dados foram salvos localmente.');
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

  const handleUpdateProject = async (projectId: string, field: string, value: any) => {
    console.log(`handleUpdateProject chamado com campo ${field} e valor:`, value);
    
    const projectToUpdate = projects.find(p => p.id === projectId);
    if (!projectToUpdate) {
      console.error('Projeto não encontrado:', projectId);
      return;
    }

    console.log('Projeto antes da atualização:', projectToUpdate);
    
    // Criar uma cópia do projeto para atualização
    const updatedProject = {
      ...projectToUpdate,
      [field]: value,
      lastModified: new Date().toISOString()
    };

    console.log('Projeto após atualização local:', updatedProject);
    
    try {
      const { data, error } = await updateProject(updatedProject);
      
      if (error) {
        console.error('Erro ao atualizar projeto no Supabase:', error);
        throw error;
      }
      
      console.log('Resposta do Supabase após updateProject:', data);
      
      // Verificar especificamente a data prevista
      if (field === 'estimatedCompletionDate') {
        console.log('Data prevista no objeto retornado:', data?.estimatedCompletionDate);
      }
      
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

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('cachedProjects', JSON.stringify(projects));
      console.log('Projetos salvos no localStorage');
    }
  }, [projects]);

  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem('cachedClients', JSON.stringify(clients));
      console.log('Clientes salvos no localStorage');
    }
  }, [clients]);

  useEffect(() => {
    if (!user && !loading) {
      sessionStorage.removeItem('dataAlreadyLoaded');
      sessionStorage.removeItem('userAuthenticated');
      console.log('Flags de sessão removidas após logout');
    }
  }, [user, loading]);

  // Verificar alterações não salvas comparando o estado atual com o projeto salvo
  useEffect(() => {
    if (!activeProjectId || !projects.length) return;
    
    const currentProject = projects.find(project => project.id === activeProjectId);
    if (!currentProject) return;
    
    // Adicionar logs detalhados para diagnóstico
    console.log('Verificando alterações não salvas para o projeto:', activeProjectId);
    console.log('Estado atual da data prevista:', estimatedCompletionDate);
    console.log('Data prevista no projeto salvo:', currentProject.estimatedCompletionDate);
    
    // Normalizar valores para comparação
    // Converter null/undefined para string vazia para evitar falsos positivos
    const normalizeValue = (value: any) => {
      if (value === null || value === undefined) return '';
      return value;
    };
    
    // Normalizar datas para comparação
    const normalizeDate = (dateStr: string | null) => {
      if (!dateStr) return '';
      // Remover parte de hora se existir
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr;
    };
    
    const hasChanges = (
      projectName !== currentProject.name ||
      clientName !== currentProject.clientName ||
      contactPhone !== currentProject.contactPhone ||
      projectDate !== currentProject.date ||
      JSON.stringify(fixedExpenses) !== JSON.stringify(currentProject.fixedExpenses) ||
      JSON.stringify(variableExpenses) !== JSON.stringify(currentProject.variableExpenses) ||
      JSON.stringify(materials) !== JSON.stringify(currentProject.materials) ||
      profitMargin !== currentProject.profitMargin ||
      projectComments !== currentProject.comments ||
      JSON.stringify(projectStages) !== JSON.stringify(currentProject.stages) ||
      fixedExpenseDays !== currentProject.fixedExpenseDays ||
      useWorkshopForFixedExpenses !== currentProject.useWorkshopForFixedExpenses ||
      frozenDailyCost !== currentProject.frozenDailyCost ||
      normalizeDate(normalizeValue(estimatedCompletionDate)) !== normalizeDate(normalizeValue(currentProject.estimatedCompletionDate))
    );

    // Adicionar log para debug
    if (hasChanges) {
      console.log('Alterações não salvas detectadas no projeto', activeProjectId);
      console.log('Nome do projeto alterado:', projectName !== currentProject.name);
      console.log('Nome do cliente alterado:', clientName !== currentProject.clientName);
      console.log('Telefone alterado:', contactPhone !== currentProject.contactPhone);
      console.log('Data alterada:', projectDate !== currentProject.date);
      console.log('Data prevista alterada:', 
        normalizeDate(normalizeValue(estimatedCompletionDate)) !== 
        normalizeDate(normalizeValue(currentProject.estimatedCompletionDate))
      );
      console.log('Data prevista atual (normalizada):', normalizeDate(normalizeValue(estimatedCompletionDate)));
      console.log('Data prevista salva (normalizada):', normalizeDate(normalizeValue(currentProject.estimatedCompletionDate)));
    } else {
      console.log('Projeto sem alterações não salvas');
    }
    
    setHasUnsavedChanges(hasChanges);
  }, [
    activeProjectId, projectName, clientName, contactPhone, projectDate,
    fixedExpenses, variableExpenses, materials, profitMargin, projectComments,
    projectStages, fixedExpenseDays, useWorkshopForFixedExpenses, frozenDailyCost, estimatedCompletionDate, projects
  ]);

  return (
    <>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">Carregando...</h2>
              <p className="mt-1 text-sm text-gray-500">
                Aguarde enquanto autenticamos seu acesso.
              </p>
            </div>
          </div>
        </div>
      ) : !user ? (
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Login />} />
        </Routes>
      ) : isLoadingData ? (
        <div className="fixed inset-0 bg-white flex items-center justify-center">
          <div className="text-center max-w-xs mx-auto">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-opacity-50 border-t-transparent"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Carregando seus dados</h2>
            <p className="text-gray-500 mb-6">
              Estamos recuperando suas informações do banco de dados.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
          {/* Sidebar - Fixa na visualização desktop */}
          <aside className={`md:fixed md:inset-y-0 md:left-0 z-50 md:flex md:flex-col ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'} transition-all duration-300`}>
            {sidebarOpen && (
              <div 
                className="md:hidden fixed inset-0 bg-black bg-opacity-50" 
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            <div 
              className={`fixed md:static h-screen z-50 transform ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              } md:translate-x-0 transition-transform duration-300 ease-in-out w-full`}
              style={{ 
                overflow: 'auto',
                scrollbarWidth: 'thin',
                msOverflowStyle: 'none',
                scrollbarColor: 'rgba(203, 213, 224, 0.2) transparent'
              }}
            >
              <style>
                {`
                  div[style*="overflow: auto"]::-webkit-scrollbar {
                    width: 2px;
                  }
                  div[style*="overflow: auto"]::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  div[style*="overflow: auto"]::-webkit-scrollbar-thumb {
                    background-color: rgba(203, 213, 224, 0.2);
                    border-radius: 10px;
                  }
                  div[style*="overflow: auto"]::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(160, 174, 192, 0.4);
                  }
                `}
              </style>
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
                  setShowDashboard(false);
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
                onShowDashboard={handleShowDashboard}
                onCollapseChange={setIsSidebarCollapsed} // Nova prop para receber o estado de colapso da sidebar
              />
            </div>
          </aside>
        
          {/* Conteúdo principal - Rolável, com margem para a barra lateral em desktop */}
          <div className={`flex-1 flex flex-col w-full ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} overflow-auto transition-all duration-300`}>
            <div className="bg-[#506D67] md:bg-gray-100 
              text-white md:text-gray-800 
              
              w-full sticky top-0 z-10
              ${!activeProjectId && 'md:hidden'}
            ">
              <div className="container mx-auto px-3 sm:px-2 py-3 sm:py-6 md:py-1 md:px-3">
                <div className="flex items-center justify-between mb-6 md:mb-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button 
                      className="md:hidden mr-1 sm:mr-2 text-white" 
                      onClick={toggleSidebar}
                      aria-label="Toggle sidebar"
                    >
                      {sidebarOpen ? <X size={20} className="sm:hidden" /> : <Menu size={20} className="sm:hidden" />}
                      {sidebarOpen ? <X size={24} className="hidden sm:block" /> : <Menu size={24} className="hidden sm:block" />}
                    </button>
                    <img 
                      src="/imagens/banner2.png"
                      alt="Logo Offi"
                      className="sm:hidden w-28 h-15 flex justify-center"
                    />
                    <img
                      src="/imagens/banner2.png"
                      alt="Logo Offi"
                      className={`sm:hidden w-40 h-30 hidden sm:block ${activeProjectId ? "md:hidden" : ""}`}
                    />

                  </div>
                </div>
                  
                {activeProjectId && (
                  <div className="w-full">
                    <div className="sm:border flex flex-wrap items-center gap-3 sm:bg-white sm:rounded-lg sm:shadow-md sm:p-6 sm:mb-3">
                      {/* Título do container */}
                      <div className="w-full mb-1">
                        <h2 className="text-center sm:text-left text-xl font-medium text-white sm:text-gray-900 text-shadow sm:text-shadow-none">Dados do Projeto</h2>
                      </div>
                      <div className="relative w-full sm:w-auto sm:max-w-[300px]">
                        <input
                          type="text"
                          value={clientName}
                          onChange={handleClientNameChange}
                          className="px-3 py-2 h-10 border border-gray-200 rounded-md text-gray-800 font-medium text-base sm:text-base w-full sm:w-auto sm:max-w-[200px]"
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
                        className="px-3 py-2 h-10 border border-gray-200 rounded-md text-gray-800 font-medium text-base sm:text-base w-full sm:w-auto sm:max-w-[200px]"
                        placeholder="Nome do Projeto"
                      />
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={handleContactPhoneChange}
                        className="px-3 py-2 h-10 border border-gray-200 rounded-md text-gray-800 font-medium text-base sm:text-base w-full sm:max-w-[170px]"
                        placeholder="Celular"
                      />
                      <input
                        type="date"
                        value={projectDate}
                        onChange={handleProjectDateChange}
                        className="px-3 py-2 h-10 border border-gray-200 rounded-md text-gray-800 font-medium text-base sm:text-base w-full sm:max-w-[170px]"
                        title="Data de Criação"
                      />
                      <div className="flex flex-row w-full gap-2 sm:contents">
                        <button
                          className="flex items-center justify-center gap-2 px-4 py-1 h-10 bg-[#FFA136] text-base text-white rounded-md hover:bg-[#FF8800] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex-1 sm:flex-initial"
                          onClick={handleSaveProject}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              Salvar
                            </>
                          )}
                        </button>
                        <button
                          className="flex items-center justify-center px-4 py-1 h-10 bg-[#2F524B] text-sm text-white rounded-md hover:bg-green-800 transition-colors flex-1 sm:flex-initial sm:w-auto"
                          onClick={handleDuplicateProject}
                          title="Duplicar projeto"
                        >
                          <Copy size={18} />
                          <span className="hidden sm:inline"></span>
                        </button>
                      </div>
                      {hasUnsavedChanges && activeProjectId && (
                        <div className="flex items-center text-sm text-white animate-pulse transition-opacity duration-1000 bg-gray-600 px-3 py-1 h-10 rounded-md">
                          <AlertCircle size={18} />
                          <span className="text-sm"></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {activeProjectId && (
              <>
                <hr className="border-t border-gray-300 w-full my-4" />
                <ProjectStagesBar 
                  stages={projectStages} 
                  onChange={handleStageChange} 
                  projectId={activeProjectId!}
                  projectName={projectName}
                  clientName={clientName}
                  onUpdateProject={handleUpdateProject}
                  estimatedCompletionDate={estimatedCompletionDate}
                />
              </>
            )}
            <span className=""></span>
            <div className="flex-1 p-2 sm:p-4">
              {showDashboard ? (
                <Dashboard 
                  projects={projects}
                  clients={clients}
                  workshopSettings={workshopSettings}
                  onSelectProject={(projectId) => {
                    handleSelectProject(projectId);
                    setShowClientsList(false);
                    setShowProjectsKanban(false);
                    setShowMyWorkshop(false);
                    setShowFinancialSummary(false);
                    setShowUserProfile(false);
                    setShowDashboard(false);
                  }}
                  onShowKanban={handleShowProjectsKanban}
                />
              ) : showMyWorkshop ? (
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
                    setShowDashboard(false);
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
                    setShowDashboard(false);
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
                    setShowDashboard(false);
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

                      {/* Botão para limpar todas as despesas */}
                      {!projectStages.projetoTecnico?.completed && (
                        <div className="flex justify-center sm:justify-end mb-4">
                          <button
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors w-center sm:w-auto"
                            onClick={handleClearAllExpenses}
                            title="Excluir todas as despesas"
                          >
                            <Trash2 size={18} />
                            <span>Excluir todas as despesas</span>
                          </button>
                        </div>
                      )}

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
                          className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-[#FFA136] text-white rounded-md hover:bg-[#FF8800] transition-colors disabled:bg-grey-300 disabled:cursor-not-allowed"
                          onClick={handleSaveProject}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 size={20} className="animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save size={20} />
                              Salvar Projeto
                            </>
                          )}
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
                          taxPercentage={workshopSettings?.taxPercentage}
                          applyTax={activeProjectId ? projects.find(p => p.id === activeProjectId)?.applyTax || false : false}
                          onApplyTaxChange={(apply) => {
                            if (activeProjectId) {
                              const updatedProjects = projects.map(p => 
                                p.id === activeProjectId ? { ...p, applyTax: apply } : p
                              );
                              setProjects(updatedProjects);
                              
                              // Salvar no localStorage para persistência imediata
                              localStorage.setItem('projects', JSON.stringify(updatedProjects));
                              
                              // Marcar que há alterações não salvas
                              setHasUnsavedChanges(true);
                            }
                          }}
                          // Passar propriedades congeladas para o Summary
                          isProjectTechnicalCompleted={activeProjectId && projects.find(p => p.id === activeProjectId)?.stages?.projetoTecnico?.completed}
                          frozenTaxPercentage={activeProjectId ? projects.find(p => p.id === activeProjectId)?.frozenTaxPercentage : undefined}
                          frozenApplyTax={activeProjectId ? projects.find(p => p.id === activeProjectId)?.frozenApplyTax : undefined}
                          frozenTaxAmount={activeProjectId ? projects.find(p => p.id === activeProjectId)?.frozenTaxAmount : undefined}
                          frozenFinalPrice={activeProjectId ? projects.find(p => p.id === activeProjectId)?.frozenFinalPrice : undefined}
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
                <Dashboard 
                  projects={projects}
                  clients={clients}
                  workshopSettings={workshopSettings}
                  onSelectProject={(projectId) => {
                    handleSelectProject(projectId);
                    setShowClientsList(false);
                    setShowProjectsKanban(false);
                    setShowMyWorkshop(false);
                    setShowFinancialSummary(false);
                    setShowUserProfile(false);
                    setShowDashboard(false);
                  }}
                  onShowKanban={handleShowProjectsKanban}
                />
              )}
            </div>
          </div>
        </div>
      )}
    {!loading && user && <ChatDrawer />}
    </>
  );
}

export default App;