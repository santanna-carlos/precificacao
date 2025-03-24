import React from 'react';
import { Plus, Trash2, Users, LayoutDashboard, Building2, BarChart3 } from 'lucide-react';
import { Project, WorkshopSettings } from '../types';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onClose?: () => void;
  onClientsView?: () => void;
  onProjectsKanbanView?: () => void; 
  onMyWorkshopView?: () => void; 
  onMyWorkshopSettingsView?: () => void;
  onFinancialSummaryView?: () => void;
  workshopSettings?: WorkshopSettings;
}

export function Sidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onClose,
  onClientsView,
  onProjectsKanbanView,
  onMyWorkshopView,
  onMyWorkshopSettingsView,
  onFinancialSummaryView,
  workshopSettings
}: SidebarProps) {
  // Função para abreviar texto se ultrapassar o limite de caracteres
  const abbreviateText = (text: string, maxLength: number = 9): string => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  
  // Função para formatar a data no padrão dia-mes-ano
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Verifica se a data é válida
      if (isNaN(date.getTime())) return dateString;
      
      // Formata para DD-MM-YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}-${month}-${year}`;
    } catch (error) {
      // Em caso de erro na formatação, retorna a data original
      return dateString;
    }
  };
  
  // Função para determinar o status do projeto baseado nos estágios
  const getProjectStatus = (project: Project): 'toStart' | 'inProgress' | 'completed' | 'canceled' => {
    // Verificar primeiro se o projeto foi cancelado
    if (project.stages?.projetoCancelado?.completed) {
      return 'canceled';
    }
    
    // Verificar se o projeto foi instalado (considerado como concluído)
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
  
  // Filtra apenas projetos "A Iniciar" e "Em Andamento"
  const filteredProjects = projects.filter(project => {
    const status = getProjectStatus(project);
    return status === 'toStart' || status === 'inProgress';
  });
  
  // Invertemos a ordem dos projetos para que os últimos adicionados apareçam primeiro
  const reversedProjects = [...filteredProjects].reverse();
  
  // Define a cor do indicador baseado no status
  const getStatusIndicatorColor = (project: Project): string => {
    const status = getProjectStatus(project);
    return status === 'toStart' ? 'bg-amber-400' : 'bg-cyan-400';
  };
  
  return (
    <div className="bg-gradient-to-b from-gray-800 to-gray-900 text-white w-64 flex flex-col h-screen shadow-xl">
      {/* Logo e nome da marcenaria */}
      <div className="p-5 border-b border-gray-700/50 flex flex-col items-center">
        {workshopSettings?.logoImage ? (
          <div className="w-20 h-20 mb-2 overflow-hidden rounded-full bg-white/10 flex items-center justify-center">
            <img 
              src={workshopSettings.logoImage} 
              alt="Logo da Marcenaria" 
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-20 h-20 mb-2 rounded-full bg-white/10 flex items-center justify-center">
            <Building2 size={32} className="text-white/80" />
          </div>
        )}
        <h1 className="text-xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white">
          {workshopSettings?.workshopName || "Marcenaria"}
        </h1>
      </div>
    
      {/* Seção Minha Marcenaria (PRIMEIRO) */}
      <div 
        className={`p-4 border-b border-gray-700/50 flex justify-between items-center cursor-pointer 
          transition-all duration-200 hover:bg-gray-700/50 relative overflow-hidden group
          ${onMyWorkshopView ? 'sidebar-active' : ''}`}
        onClick={() => {
          if (onMyWorkshopView) {
            onMyWorkshopView();
          }
          // Fechar a barra lateral em dispositivos móveis
          if (onClose && window.innerWidth < 768) {
            onClose();
          }
        }}
      >
        <div className="flex items-center gap-3 z-10">
          <div className="p-1.5 rounded-md bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
            <Building2 size={18} className="text-blue-400" />
          </div>
          <h2 className="text-base font-medium">Minha Marcenaria</h2>
        </div>
        <div className="absolute left-0 h-full w-1 bg-blue-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>
      </div>
      
      {/* Seção Resumo Financeiro (SEGUNDO) */}
      <div 
        className={`p-4 border-b border-gray-700/50 flex justify-between items-center cursor-pointer 
          transition-all duration-200 hover:bg-gray-700/50 relative overflow-hidden group
          ${onFinancialSummaryView ? 'sidebar-active' : ''}`}
        onClick={() => {
          if (onFinancialSummaryView) {
            onFinancialSummaryView();
          }
          // Fechar a barra lateral em dispositivos móveis
          if (onClose && window.innerWidth < 768) {
            onClose();
          }
        }}
      >
        <div className="flex items-center gap-3 z-10">
          <div className="p-1.5 rounded-md bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
            <BarChart3 size={18} className="text-green-400" />
          </div>
          <h2 className="text-base font-medium">Resumo Financeiro</h2>
        </div>
        <div className="absolute left-0 h-full w-1 bg-green-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>
      </div>
      
      {/* Seção de Meus Clientes (TERCEIRO) */}
      <div 
        className={`p-4 border-b border-gray-700/50 flex justify-between items-center cursor-pointer 
          transition-all duration-200 hover:bg-gray-700/50 relative overflow-hidden group
          ${onClientsView ? 'sidebar-active' : ''}`}
        onClick={() => {
          if (onClientsView) {
            onClientsView();
          }
          // Fechar a barra lateral em dispositivos móveis
          if (onClose && window.innerWidth < 768) {
            onClose();
          }
        }}
      >
        <div className="flex items-center gap-3 z-10">
          <div className="p-1.5 rounded-md bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
            <Users size={18} className="text-purple-400" />
          </div>
          <h2 className="text-base font-medium">Meus Clientes</h2>
        </div>
        <div className="absolute left-0 h-full w-1 bg-purple-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>
      </div>
      
      {/* Seção de Meus Projetos (QUARTO) */}
      <div 
        className={`p-4 border-b border-gray-700/50 flex justify-between items-center cursor-pointer 
          transition-all duration-200 hover:bg-gray-700/50 relative overflow-hidden group
          ${onProjectsKanbanView ? 'sidebar-active' : ''}`}
        onClick={() => {
          if (onProjectsKanbanView) {
            onProjectsKanbanView();
          }
          // Fechar a barra lateral em dispositivos móveis
          if (onClose && window.innerWidth < 768) {
            onClose();
          }
        }}
      >
        <div className="flex items-center gap-3 z-10">
          <div className="p-1.5 rounded-md bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
            <LayoutDashboard size={18} className="text-amber-400" />
          </div>
          <h2 className="text-base font-medium">Meus Projetos</h2>
        </div>
        <div className="absolute left-0 h-full w-1 bg-amber-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredProjects.length === 0 ? (
          <div className="p-4 text-gray-400 text-center">
            Nenhum projeto ativo encontrado
          </div>
        ) : (
          <div className="pt-2">
            <div className="px-4 py-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
              Projetos Ativos ({filteredProjects.length})
            </div>
            <ul className="pb-2">
              {reversedProjects.map(project => (
                <li 
                  key={project.id}
                  className={`px-4 py-2 flex items-center justify-between hover:bg-gray-700/50 cursor-pointer ${
                    project.id === activeProjectId ? 'bg-gray-700/50' : ''
                  }`}
                  onClick={() => onSelectProject(project.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-2 h-full min-h-[24px] rounded-sm ${getStatusIndicatorColor(project)}`}></div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {project.clientName ? `${abbreviateText(project.clientName)} - ` : ''}
                        {project.name || 'Sem nome'}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {project.date ? formatDate(project.date) : 'Sem data'}
                      </div>
                    </div>
                  </div>
                  <button
                    className="text-gray-400 hover:text-red-400 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-700/50">
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={onCreateProject}
        >
          <Plus size={20} />
          Novo Projeto
        </button>
      </div>
    </div>
  );
}

<style>
  {
    `
  .sidebar-active {
    background-color: rgba(55, 65, 81, 0.5);
  }
  
  .sidebar-active .absolute {
    transform: translateX(0);
  }
  `
  }
</style>