import React, { useMemo, useState, useEffect } from 'react';
import { Project, ProjectStages } from '../types';
import { Calendar, Clock, Check, XCircle, AlertCircle, X, Trash2, Filter } from 'lucide-react';

interface ProjectsKanbanProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export function ProjectsKanban({ projects, onSelectProject, onDeleteProject }: ProjectsKanbanProps) {
  // Estados para os filtros
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Opções para o filtro de mês
  const monthOptions = [
    { value: '', label: 'Todos os meses' },
    { value: '0', label: 'Janeiro' },
    { value: '1', label: 'Fevereiro' },
    { value: '2', label: 'Março' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Maio' },
    { value: '5', label: 'Junho' },
    { value: '6', label: 'Julho' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Setembro' },
    { value: '9', label: 'Outubro' },
    { value: '10', label: 'Novembro' },
    { value: '11', label: 'Dezembro' }
  ];
  
  // Gerar opções de anos (do ano atual até 5 anos atrás)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [{ value: '', label: 'Todos os anos' }];
    
    for (let i = 0; i <= 5; i++) {
      const year = currentYear - i;
      years.push({ value: year.toString(), label: year.toString() });
    }
    
    return years;
  }, []);
  
  // Função para determinar o status do projeto baseado nos estágios
  const getProjectStatus = (project: Project): 'toStart' | 'inProgress' | 'completed' | 'canceled' => {
    // Verificar primeiro se o projeto foi cancelado
    if (project.stages?.projetoCancelado?.completed) {
      return 'canceled';
    }
    
    // Verificar se o projeto foi instalado (agora considerado como concluído)
    if (project.stages?.instalacao?.completed) {
      return 'completed';
    }
    
    // Projeto está "A iniciar" se não tem nenhuma caixa marcada ou apenas orçamento está marcado
    const hasAnyNonOrcamentoStageCompleted = Object.entries(project.stages || {}).some(
      ([key, stage]) => key !== 'orcamento' && stage.completed
    );
    
    if (!hasAnyNonOrcamentoStageCompleted) {
      return 'toStart';
    }
    
    // Se não se encaixa em nenhuma categoria específica, considerar em andamento
    return 'inProgress';
  };
  
  // Função para filtrar projetos
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Filtrar por mês
      if (filterMonth && project.date) {
        const projectDate = new Date(project.date);
        if (projectDate.getMonth().toString() !== filterMonth) {
          return false;
        }
      }
      
      // Filtrar por ano
      if (filterYear && project.date) {
        const projectDate = new Date(project.date);
        if (projectDate.getFullYear().toString() !== filterYear) {
          return false;
        }
      }
      
      return true;
    });
  }, [projects, filterMonth, filterYear]);
  
  // Agrupar projetos por status
  const groupedProjects = useMemo(() => {
    const grouped = {
      toStart: [] as Project[],
      inProgress: [] as Project[],
      completed: [] as Project[],
      canceled: [] as Project[]
    };
    
    filteredProjects.forEach(project => {
      const status = getProjectStatus(project);
      grouped[status].push(project);
    });
    
    return grouped;
  }, [filteredProjects]);
  
  // Calcular porcentagens para cada estágio
  const percentages = useMemo(() => {
    const total = filteredProjects.length;
    if (total === 0) return { toStart: 0, inProgress: 0, completed: 0, canceled: 0 };
    
    return {
      toStart: Math.round((groupedProjects.toStart.length / total) * 100),
      inProgress: Math.round((groupedProjects.inProgress.length / total) * 100),
      completed: Math.round((groupedProjects.completed.length / total) * 100),
      canceled: Math.round((groupedProjects.canceled.length / total) * 100)
    };
  }, [filteredProjects.length, groupedProjects]);
  
  // Estado para controlar a visibilidade do modal de projetos cancelados
  const [showCanceledModal, setShowCanceledModal] = useState(false);

  // Formatar data para exibição
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Data não definida';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return 'Data inválida';
    }
  };
  
  // Limpar todos os filtros
  const clearFilters = () => {
    setFilterMonth('');
    setFilterYear('');
  };
  
  // Renderizar cartão de projeto
  const renderProjectCard = (project: Project) => {
    // Verificar se o projeto está cancelado
    const isCanceled = project.stages?.projetoCancelado?.completed === true;
    const cancellationReason = project.stages?.projetoCancelado?.cancellationReason;
    
    return (
      <div 
        key={project.id}
        className="bg-white rounded-lg shadow-md p-4 mb-3 cursor-pointer hover:shadow-lg transition-shadow relative"
        onClick={() => onSelectProject(project.id)}
      >
        {/* Botão de exclusão no canto superior direito */}
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors z-10"
          onClick={(e) => {
            e.stopPropagation(); // Impedir a propagação do clique para o card
            onDeleteProject(project.id);
          }}
          title="Excluir projeto"
        >
          <Trash2 size={18} />
        </button>
        
        <div className="font-semibold text-gray-800 mb-2 truncate pr-7"> {/* Adicionando padding à direita para o botão */}
          {project.clientName ? `${project.clientName} - ` : ''}
          {project.name || 'Projeto sem nome'}
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-1">
          <Calendar size={14} className="mr-1" />
          <span>Criado em: {formatDate(project.date)}</span>
        </div>
        
        {project.lastModified && (
          <div className="flex items-center text-sm text-gray-500 mb-1">
            <Clock size={14} className="mr-1" />
            <span>Modificado: {formatDate(project.lastModified)}</span>
          </div>
        )}

        {isCanceled && (
          <div className="flex items-start text-sm mt-2 rounded">
            <XCircle size={14} className="mr-1 mt-0.5" />
            <div>
              <span className="font-medium">Motivo do cancelamento: </span>
              {cancellationReason || "Nenhum motivo informado"}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visão Geral dos Projetos</h1>
          {/* Contador de projetos totais e cancelados */}
          <div className="mt-2 flex items-center">
            <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
              Total de projetos: {projects.length} {projects.filter(p => p.stages?.projetoCancelado?.completed).length > 0 && 
                `- ${projects.filter(p => p.stages?.projetoCancelado?.completed).length} cancelado(s)`}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão para mostrar/esconder filtros */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Filter size={18} />
            <span>{showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
          </button>
          
          {/* Botão de projetos cancelados em desktop */}
          {groupedProjects.canceled.length > 0 && (
            <button 
              onClick={() => setShowCanceledModal(true)}
              className="hidden md:flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <XCircle size={18} />
              <span>Exibir projetos cancelados ({groupedProjects.canceled.length})</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Seção de filtros */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {yearOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-medium transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      )}
      
      {/* Resumo dos filtros aplicados */}
      {(filterMonth || filterYear) && (
        <div className="bg-blue-50 rounded-lg p-3 mb-6 border border-blue-100 text-sm">
          <div className="flex items-center gap-2 text-blue-700">
            <Filter size={16} />
            <span className="font-medium">Filtros aplicados:</span>
            {filterMonth && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                Mês: {monthOptions.find(m => m.value === filterMonth)?.label}
              </span>
            )}
            {filterYear && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                Ano: {filterYear}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="ml-auto text-blue-700 hover:text-blue-900"
              title="Limpar filtros"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Mensagem quando não há projetos após a filtragem */}
      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center mb-6 border border-gray-200">
          <AlertCircle size={40} className="text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">Nenhum projeto encontrado com os filtros aplicados.</p>
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      )}
      
      {/* Colunas de projetos */}
      {filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Coluna: A Iniciar */}
          <div className="bg-white rounded-lg p-4 border border-amber-200 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 rounded-full bg-amber-400 mr-2"></div>
              <h2 className="text-lg font-semibold text-gray-800">A Iniciar</h2>
              <span className="ml-2 bg-amber-100 text-amber-600 px-2 py-1 rounded-full text-xs font-medium">
                {groupedProjects.toStart.length} ({percentages.toStart}%)
              </span>
            </div>
            <div className="space-y-3">
              {groupedProjects.toStart.length === 0 ? (
                <div className="text-center text-gray-500 py-4">Nenhum projeto a iniciar</div>
              ) : (
                groupedProjects.toStart.map(renderProjectCard)
              )}
            </div>
          </div>
          
          {/* Coluna: Em Andamento */}
          <div className="bg-white rounded-lg p-4 border border-cyan-200 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 rounded-full bg-cyan-400 mr-2"></div>
              <h2 className="text-lg font-semibold text-gray-800">Em Andamento</h2>
              <span className="ml-2 bg-cyan-100 text-cyan-600 px-2 py-1 rounded-full text-xs font-medium">
                {groupedProjects.inProgress.length} ({percentages.inProgress}%)
              </span>
            </div>
            <div className="space-y-3">
              {groupedProjects.inProgress.length === 0 ? (
                <div className="text-center text-gray-500 py-4">Nenhum projeto em andamento</div>
              ) : (
                groupedProjects.inProgress.map(renderProjectCard)
              )}
            </div>
          </div>
          
          {/* Coluna: Concluídos */}
          <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
              <h2 className="text-lg font-semibold text-gray-800">Concluídos</h2>
              <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                {groupedProjects.completed.length} ({percentages.completed}%)
              </span>
            </div>
            <div className="space-y-3">
              {groupedProjects.completed.length === 0 ? (
                <div className="text-center text-gray-500 py-4">Nenhum projeto concluído</div>
              ) : (
                groupedProjects.completed.map(renderProjectCard)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botão de projetos cancelados em mobile - centralizado abaixo das colunas */}
      {groupedProjects.canceled.length > 0 && (
        <div className="md:hidden flex justify-center mt-6">
          <button 
            onClick={() => setShowCanceledModal(true)}
            className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <XCircle size={18} />
            <span>Exibir projetos cancelados ({groupedProjects.canceled.length})</span>
          </button>
        </div>
      )}

      {/* Modal para exibir projetos cancelados */}
      {showCanceledModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
            <div className="bg-rose-600 p-4 text-white flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <XCircle size={20} />
                Projetos Cancelados ({groupedProjects.canceled.length})
              </h3>
              <button 
                onClick={() => setShowCanceledModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {groupedProjects.canceled.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle size={40} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum projeto cancelado encontrado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedProjects.canceled.map(renderProjectCard)}
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-5 py-3 flex justify-end">
              <button 
                onClick={() => setShowCanceledModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}