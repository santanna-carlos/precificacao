import React, { useState, useCallback, useEffect } from 'react';
import { 
  Calculator, Menu, X, Save, Copy, 
  Plus, Calendar, PenLine, Trash, 
  DollarSign, ArrowRight, 
  FileText, ChevronDown, ChevronUp 
} from 'lucide-react';
import { ExpenseSection } from './components/ExpenseSection';
import { Summary } from './components/Summary';
import { Sidebar } from './components/Sidebar';
import { ExpenseItem, Project, ProjectSummary, ProjectStages } from './types';
import { ProjectStagesBar } from './components/ProjectStagesBar';
import { ClientsList } from './components/ClientsList';
import { ProjectsKanban } from './components/ProjectsKanban';

// IDENTIFICADOR ÚNICO: ATUALIZAÇÃO 14 MARÇO 2025 9:16
console.log('VERSÃO ATUALIZADA DO APP - 14 MARÇO 2025 9:16');

function App() {
  const [showProjectsKanban, setShowProjectsKanban] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showClientsList, setShowClientsList] = useState(false);
  const handleShowProjectsKanban = () => {
    setActiveProjectId(null);
    setShowClientsList(false);
    setShowProjectsKanban(true);
    
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
    finalizacao: { completed: false, date: null },
    projetoCancelado: { completed: false, date: null } // Adicionar o novo estágio
  });
  
  // Estado para controlar a visibilidade da barra lateral em dispositivos móveis
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Função para alternar a visibilidade da barra lateral
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Carregar projetos do localStorage ao iniciar
  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    
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
          return project;
        });
        
        setProjects(updatedProjects);
        
        // Se houver projetos, selecionar o primeiro
        if (updatedProjects.length > 0) {
          setActiveProjectId(updatedProjects[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        setProjects([]);
      }
    }
  }, []);

  // Atualizar o estado local quando o projeto ativo mudar
  useEffect(() => {
    if (activeProjectId) {
      const activeProject = projects.find(p => p.id === activeProjectId);
      if (activeProject) {
        setFixedExpenses(activeProject.fixedExpenses);
        setVariableExpenses(activeProject.variableExpenses);
        setMaterials(activeProject.materials);
        setProfitMargin(activeProject.profitMargin);
        setProjectName(activeProject.name);
        setClientName(activeProject.clientName || '');
        setContactPhone(activeProject.contactPhone || '');
        setProjectDate(activeProject.date || new Date().toISOString().split('T')[0]); // Usar data atual se não existir
        setProjectComments(activeProject.comments || ''); // Carregar comentários ou string vazia se não existir
        
        // Carregar os estágios do projeto ou usar valores padrão
        if (activeProject.stages) {
          setProjectStages(activeProject.stages);
        } else {
          // Inicializar com valores padrão se o projeto existente não tiver estágios
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
            finalizacao: { completed: false, date: null },
            projetoCancelado: { completed: false, date: null } // Adicionar o novo estágio
          });
        }
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
    quantity: 1,
    unitValue: 0,
    total: 0,
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
    value: number | string,
    setter: React.Dispatch<React.SetStateAction<ExpenseItem[]>>
  ) => {
    setter(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Se o tipo mudou para "Outro" e não há customType, inicialize-o como string vazia
          if (field === 'type' && value === 'Outro' && !updatedItem.customType) {
            updatedItem.customType = '';
          }
          
          // Calcula o total
          updatedItem.total = calculateItemTotal(updatedItem);
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  const calculateItemTotal = (item: ExpenseItem): number => {
    return item.quantity * item.unitValue;
  };

  const calculateSummary = useCallback((): ProjectSummary => {
    const fixedExpensesTotal = fixedExpenses.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const variableExpensesTotal = variableExpenses.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const materialsTotal = materials.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    
    const totalCost = fixedExpensesTotal + variableExpensesTotal + materialsTotal;
    const salePrice = totalCost / (1 - profitMargin / 100);
    const profitAmount = salePrice - totalCost;

    // Nova abordagem para o cálculo do markup - ATUALIZAÇÃO 14/03/2025
    console.log("Calculando markup com nova abordagem - ATUALIZAÇÃO 14/03/2025 9:16");
    
    // Markup é a razão entre o preço de venda e o custo
    const markup = salePrice / materialsTotal;
    
    // O preço com markup é o markup x custo total
    const markupSalePrice = markup * totalCost;

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
  }, [fixedExpenses, variableExpenses, materials, profitMargin]);

  // Função para gerenciar mudanças nos estágios do projeto
  const handleStageChange = (
    stageId: keyof ProjectStages,
    field: 'completed' | 'date',
    value: boolean | string
  ) => {
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
      clientName: '',
      contactPhone: '',
      date: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
      fixedExpenses: [],
      variableExpenses: [],
      materials: [],
      profitMargin: 20,
      totalCost: 0,
      salePrice: 0,
      comments: '',
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
        finalizacao: { completed: false, date: null },
        projetoCancelado: { completed: false, date: null } // Adicionar o novo estágio
      },
      lastModified: null // Inicialmente não tem lastModified até que seja salvo
    };
    
    // Adicionar novo projeto no início da lista para que apareça no topo da barra lateral
    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    
    // Resetar todos os campos para os valores do novo projeto
    setFixedExpenses([]);
    setVariableExpenses([]);
    setMaterials([]);
    setProfitMargin(20);
    setProjectName('');
    setClientName('');
    setContactPhone('');
    setProjectDate(new Date().toISOString().split('T')[0]);
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
      finalizacao: { completed: false, date: null },
      projetoCancelado: { completed: false, date: null } // Adicionar o novo estágio
    });
  };

  const handleSelectProject = (projectId: string) => {
    // Não salvar mais automaticamente ao trocar de projeto
    setActiveProjectId(projectId);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    
    // Se o projeto ativo for excluído, selecionar outro
    if (projectId === activeProjectId) {
      const remainingProjects = projects.filter(p => p.id !== projectId);
      if (remainingProjects.length > 0) {
        setActiveProjectId(remainingProjects[0].id);
      } else {
        setActiveProjectId(null);
        // Limpar o estado local
        setFixedExpenses([]);
        setVariableExpenses([]);
        setMaterials([]);
        setProfitMargin(20);
        setProjectName('');
        setClientName('');
        setContactPhone('');
        setProjectDate(new Date().toISOString().split('T')[0]);
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
          finalizacao: { completed: false, date: null },
          projetoCancelado: { completed: false, date: null } // Adicionar o novo estágio
        });
      }
    }
  };

  const saveCurrentProject = () => {
    if (!activeProjectId) return;
    
    const summary = calculateSummary();
    const currentDateTime = new Date().toISOString();
    
    setProjects(prev => prev.map(project => 
      project.id === activeProjectId
        ? {
            ...project,
            name: projectName,
            clientName,
            contactPhone,
            date: projectDate,
            fixedExpenses,
            variableExpenses,
            materials,
            profitMargin,
            totalCost: summary.totalCost,
            salePrice: summary.salePrice,
            comments: projectComments,
            stages: projectStages,
            lastModified: currentDateTime // Atualiza a data de modificação SOMENTE ao salvar
          }
        : project
    ));
  };

  const handleSaveProject = () => {
    saveCurrentProject();
    alert('Projeto salvo com sucesso!');
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  };

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientName(e.target.value);
  };

  const handleContactPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactPhone(e.target.value);
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
      clientName: '', // Cliente em branco
      contactPhone: '', // Telefone em branco
      date: new Date().toISOString().split('T')[0], // Data atual
      fixedExpenses: JSON.parse(JSON.stringify(currentProject.fixedExpenses)), // Cópia profunda
      variableExpenses: JSON.parse(JSON.stringify(currentProject.variableExpenses)), // Cópia profunda
      materials: JSON.parse(JSON.stringify(currentProject.materials)), // Cópia profunda
      profitMargin: currentProject.profitMargin,
      totalCost: currentProject.totalCost,
      salePrice: currentProject.salePrice,
      comments: '', // Comentários em branco
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
        finalizacao: { completed: false, date: null },
        projetoCancelado: { completed: false, date: null } // Adicionar o novo estágio
      },
      lastModified: null
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
      finalizacao: { completed: false, date: null },
      projetoCancelado: { completed: false, date: null } // Adicionar o novo estágio
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Responsiva */}
      <div className="relative z-50">
        {/* Backdrop escuro para dispositivos móveis - apenas visível quando o sidebar está aberto */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Container do Sidebar */}
        <div 
          className={`fixed md:relative h-full z-50 transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-300 ease-in-out`}
        >
          <Sidebar
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={(projectId) => {
              handleSelectProject(projectId);
              setShowClientsList(false);
              setShowProjectsKanban(false);
              if (window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            }}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            onClose={() => setSidebarOpen(false)}
            onClientsView={handleShowClientsList}
            onProjectsKanbanView={handleShowProjectsKanban}
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Cabeçalho - Sem classes que o tornem fixo */}
        <div className="bg-blue-600 text-white shadow-lg w-full">
          <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
            {/* Linha do título */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Botão para alternar a barra lateral em dispositivos móveis */}
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
                <h1 className="text-2xl font-bold hidden sm:inline">Precificador Inteligente para Marceneiros</h1>
                <h1 className="text-lg font-bold sm:hidden">Precificador</h1>
              </div>
            </div>
              
            {/* Linha dos inputs - só aparece quando há um projeto ativo */}
            {activeProjectId && (
              <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
                  <input
                    type="text"
                    value={clientName}
                    onChange={handleClientNameChange}
                    className="px-2 sm:px-3 py-1 rounded text-gray-800 font-medium text-sm sm:text-base w-full"
                    placeholder="Nome do Cliente"
                  />
                  <input
                    type="text"
                    value={projectName}
                    onChange={handleProjectNameChange}
                    className="px-2 sm:px-3 py-1 rounded text-gray-800 font-medium text-sm sm:text-base w-full"
                    placeholder="Nome do Projeto"
                  />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={handleContactPhoneChange}
                    className="px-2 sm:px-3 py-1 rounded text-gray-800 font-medium text-sm sm:text-base w-full"
                    placeholder="Telefone de Contato"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={projectDate}
                      onChange={handleProjectDateChange}
                      className="px-2 sm:px-3 py-1 rounded text-gray-800 font-medium text-sm sm:text-base flex-1"
                      title="Data de Criação"
                    />
                    <button
                      className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base whitespace-nowrap"
                      onClick={handleSaveProject}
                    >
                      <Save size={16} className="sm:hidden" />
                      <Save size={20} className="hidden sm:block" />
                      Salvar
                    </button>
                    <button
                      className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors text-sm sm:text-base whitespace-nowrap"
                      onClick={handleDuplicateProject}
                      title="Duplicar projeto"
                    >
                      <Copy size={16} className="sm:hidden" />
                      <Copy size={20} className="hidden sm:block" />
                      <span className="hidden sm:inline">Duplicar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barra de Estágios do Projeto */}
        {activeProjectId && (
          <ProjectStagesBar 
            stages={projectStages}
            onChange={handleStageChange}
          />
        )}

        {/* Conteúdo principal */}
        <div className="flex-1 p-2 sm:p-4">
          {activeProjectId ? (
            <div className="container mx-auto">
              {/* Layout principal com grid para desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Coluna das despesas - ocupa 3/4 em desktop */}
                <div className="lg:col-span-3 space-y-4 sm:space-y-6 order-1 lg:order-1">
                  <ExpenseSection
                    title="Despesas Fixas"
                    type="fixed"
                    items={fixedExpenses}
                    onAdd={() => handleAddExpense(setFixedExpenses, 'fixed')}
                    onRemove={(id) => handleRemoveExpense(id, setFixedExpenses)}
                    onChange={(id, field, value) => handleExpenseChange(id, field, value, setFixedExpenses)}
                  />

                  <ExpenseSection
                    title="Despesas Variáveis"
                    type="variable"
                    items={variableExpenses}
                    onAdd={() => handleAddExpense(setVariableExpenses, 'variable')}
                    onRemove={(id) => handleRemoveExpense(id, setVariableExpenses)}
                    onChange={(id, field, value) => handleExpenseChange(id, field, value, setVariableExpenses)}
                  />

                  <ExpenseSection
                    title="Materiais"
                    type="material"
                    items={materials}
                    onAdd={() => handleAddExpense(setMaterials, 'material')}
                    onRemove={(id) => handleRemoveExpense(id, setMaterials)}
                    onChange={(id, field, value) => handleExpenseChange(id, field, value, setMaterials)}
                  />

                  {/* Seção de Comentários */}
                  <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      Comentários do Orçamento
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-[150px] sm:max-h-none overflow-auto sm:overflow-hidden resize-none"
                          placeholder="Adicione informações importantes sobre o projeto, especificações, prazos de entrega, etc."
                          value={projectComments}
                          onChange={(e) => {
                            setProjectComments(e.target.value);
                            // Em telas maiores, ajustamos a altura automaticamente
                            const mediaQuery = window.matchMedia('(min-width: 640px)');
                            if (mediaQuery.matches) {
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }
                          }}
                          onFocus={(e) => {
                            // Definir altura mínima ao focar
                            if (!e.target.value) {
                              e.target.style.height = '100px';
                            }
                          }}
                          ref={(textarea) => {
                            if (textarea) {
                              // Verificar se estamos em uma tela maior
                              const mediaQuery = window.matchMedia('(min-width: 640px)');
                              if (mediaQuery.matches) {
                                textarea.style.height = 'auto';
                                textarea.style.height = projectComments 
                                  ? `${Math.max(100, textarea.scrollHeight)}px` 
                                  : '100px';
                              } else {
                                // Em dispositivos móveis, usamos as classes CSS para controlar
                                textarea.style.minHeight = '100px';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botão Salvar no final da página */}
                  <div className="mt-4 sm:mt-6 flex justify-center">
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      onClick={saveCurrentProject}
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
            <div className="container mx-auto">
              {showClientsList ? (
                <ClientsList projects={projects} />
              ) : showProjectsKanban ? (
                <ProjectsKanban 
                  projects={projects} 
                  onSelectProject={(projectId) => {
                    handleSelectProject(projectId);
                    setShowClientsList(false);
                    setShowProjectsKanban(false);
                  }} 
                />
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
          )}
        </div>
      </div>
    </div>
  );
}

export default App;