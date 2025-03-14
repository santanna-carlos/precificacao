import React, { useState, useCallback, useEffect } from 'react';
import { Calculator, Save, Plus, Menu, X } from 'lucide-react';
import { ExpenseSection } from './components/ExpenseSection';
import { Summary } from './components/Summary';
import { Sidebar } from './components/Sidebar';
import { ExpenseItem, Project, ProjectSummary } from './types';

// IDENTIFICADOR ÚNICO: ATUALIZAÇÃO 14 MARÇO 2025 9:16
console.log('VERSÃO ATUALIZADA DO APP - 14 MARÇO 2025 9:16');

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  // Estado local para o projeto ativo
  const [fixedExpenses, setFixedExpenses] = useState<ExpenseItem[]>([]);
  const [variableExpenses, setVariableExpenses] = useState<ExpenseItem[]>([]);
  const [materials, setMaterials] = useState<ExpenseItem[]>([]);
  const [profitMargin, setProfitMargin] = useState(20);
  const [projectName, setProjectName] = useState('Novo Projeto');
  const [projectDate, setProjectDate] = useState<string>(new Date().toISOString().split('T')[0]); // Formato YYYY-MM-DD
  
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
      const parsedProjects = JSON.parse(savedProjects);
      setProjects(parsedProjects);
      
      // Se houver projetos, selecionar o primeiro
      if (parsedProjects.length > 0) {
        setActiveProjectId(parsedProjects[0].id);
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
        setProjectDate(activeProject.date || new Date().toISOString().split('T')[0]); // Usar data atual se não existir
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

  // Funções para gerenciar projetos
  const handleCreateProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: `Novo Projeto ${projects.length + 1}`,
      date: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
      fixedExpenses: [],
      variableExpenses: [],
      materials: [],
      profitMargin: 20,
      totalCost: 0,
      salePrice: 0
    };
    
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  };

  const handleSelectProject = (projectId: string) => {
    // Salvar o projeto atual antes de mudar
    if (activeProjectId) {
      saveCurrentProject();
    }
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
        setProjectName('Novo Projeto');
        setProjectDate(new Date().toISOString().split('T')[0]);
      }
    }
  };

  const saveCurrentProject = () => {
    if (!activeProjectId) return;
    
    const summary = calculateSummary();
    
    setProjects(prev => prev.map(project => 
      project.id === activeProjectId
        ? {
            ...project,
            name: projectName,
            date: projectDate,
            fixedExpenses,
            variableExpenses,
            materials,
            profitMargin,
            totalCost: summary.totalCost,
            salePrice: summary.salePrice
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

  const handleProjectDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectDate(e.target.value);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Responsiva */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block fixed md:relative z-50 h-full shadow-lg bg-white`}
           style={{ width: '16rem' }}>
        <Sidebar
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={(projectId) => {
            handleSelectProject(projectId);
            if (window.innerWidth < 768) {
              setSidebarOpen(false);
            }
          }}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Cabeçalho - Sem classes que o tornem fixo */}
        <div className="bg-blue-600 text-white shadow-lg w-full">
          <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
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
              
              {activeProjectId && (
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                  <input
                    type="text"
                    value={projectName}
                    onChange={handleProjectNameChange}
                    className="px-2 sm:px-3 py-1 rounded text-gray-800 font-medium text-sm sm:text-base flex-1 min-w-0"
                    placeholder="Nome do Projeto"
                  />
                  <input
                    type="date"
                    value={projectDate}
                    onChange={handleProjectDateChange}
                    className="px-2 sm:px-3 py-1 rounded text-gray-800 font-medium text-sm sm:text-base w-full sm:w-auto"
                  />
                  <button
                    className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                    onClick={handleSaveProject}
                  >
                    <Save size={16} className="sm:hidden" />
                    <Save size={20} className="hidden sm:block" />
                    Salvar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

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
                </div>

                {/* Resumo do Projeto - Lateral direita em desktop, ocupa 1/4 */}
                <div className="lg:col-span-1 order-2 lg:order-2">
                  <div className="lg:sticky lg:top-4">
                    <Summary 
                      summary={calculateSummary()} 
                      profitMargin={profitMargin}
                      onProfitMarginChange={setProfitMargin}
                    />
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

export default App;