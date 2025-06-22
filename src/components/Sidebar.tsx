import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, LayoutDashboard, Building2, BarChart3, LogOut, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Project, WorkshopSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';

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
  onUserProfileView?: () => void;
  onShowDashboard?: () => void;
  workshopSettings?: WorkshopSettings;
  onCollapseChange?: (isCollapsed: boolean) => void;
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
  onUserProfileView,
  onShowDashboard,
  workshopSettings,
  onCollapseChange
}: SidebarProps) {
  const { signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Detectar se é desktop ou mobile
  useEffect(() => {
    const handleResize = () => {
      const newIsDesktop = window.innerWidth >= 768;
      setIsDesktop(newIsDesktop);
      
      // Se mudar para mobile e a sidebar estiver retraída, expandi-la automaticamente
      if (!newIsDesktop && isCollapsed) {
        setIsCollapsed(false);
        // Notificar o componente pai sobre a mudança
        if (onCollapseChange) {
          onCollapseChange(false);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed, onCollapseChange]);

  // Notificar o componente pai sempre que o estado de colapso mudar
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  // Função para alternar o estado de expansão da sidebar (apenas em desktop)
  const toggleSidebar = () => {
    if (isDesktop) {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Função para lidar com o logout
  const handleLogout = async () => {
    await signOut();
  };

  // Função para abreviar texto se ultrapassar o limite de caracteres
  const abbreviateText = (text: string, maxLength: number = 9): string => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  
  // Função para formatar a data no padrão dia-mes-ano
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      // Corrigido: Criar data no fuso horário local
      const [year, month, day] = dateString.split('-').map(Number);
      
      // Se não for possível extrair ano, mês e dia, tente o método padrão
      if (!year || !month || !day) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        // Formata para DD-MM-YYYY
        return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
      }
      
      // Formata para DD-MM-YYYY
      return `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;
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
  
  // Ordenar projetos por data de criação (mais recentes primeiro)
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    // Corrigido: Criar datas no fuso horário local
    const getLocalDate = (dateStr: string): Date => {
      if (!dateStr) return new Date(0); // Data mínima para ordenação
      
      const [year, month, day] = dateStr.split('-').map(Number);
      
      // Se conseguimos extrair ano, mês e dia, crie a data no fuso local
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
      
      // Fallback para o método padrão (menos preciso)
      return new Date(dateStr);
    };
    
    // Usar a data do projeto como critério de ordenação
    const dateA = getLocalDate(a.date || '');
    const dateB = getLocalDate(b.date || '');
    
    // Ordem decrescente (mais recentes primeiro)
    return dateB.getTime() - dateA.getTime();
  });
  
  // Define a cor do indicador baseado no status
  const getStatusIndicatorColor = (project: Project): string => {
    const status = getProjectStatus(project);
    return status === 'toStart' ? 'bg-amber-400' : 'bg-cyan-400';
  };

  // Função para selecionar um projeto e limpar a seleção da seção
  const handleSelectProject = (projectId: string) => {
    setActiveSection(''); // Limpa a seleção da seção quando um projeto é selecionado
    onSelectProject(projectId);
    // Fechar a barra lateral em dispositivos móveis
    if (onClose && window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <div className={`bg-[#334B47] text-white ${isCollapsed && isDesktop ? 'w-20' : 'w-64'} flex flex-col h-screen shadow-xl transition-width duration-300`}>
      {/* Logo e nome da marcenaria */}
      <div className="p-5 border-b border-gray-700/50 flex flex-col items-center relative">
        {/* Botão para alternar a sidebar (apenas em desktop) */}
        {isDesktop && (
          isCollapsed ? (
            <div className="w-full flex justify-center mb-2">
              <button 
                className="p-1 rounded-full bg-gray-600/50 hover:bg-gray-600 transition-colors"
                onClick={toggleSidebar}
                aria-label="Expandir sidebar"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <button 
              className="absolute right-2 top-2 p-1 rounded-full bg-gray-600/50 hover:bg-gray-600 transition-colors"
              onClick={toggleSidebar}
              aria-label="Retrair sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )
        )}
        <div className="my-1 overflow-hidden flex items-center justify-center">
          {isCollapsed && isDesktop ? (
            <img 
              src="/imagens/icone.svg" 
              alt="Ícone Offi" 
              className="w-12 h-auto object-contain transition-all duration-300"
            />
          ) : (
            <img 
              src="/imagens/logo_cor_verde_334B47.png" 
              alt="Logo Offi" 
              className="w-48 h-auto object-contain transition-all duration-300"
            />
          )}
        </div>
      </div>
    
      {/* Seção Dashboard (PRIMEIRO) */}
      <div 
        className={`px-4 py-1.5 w-full border-b border-gray-700/50 flex ${isCollapsed && isDesktop ? 'justify-center' : 'justify-between'} items-center cursor-pointer 
          transition-all duration-200 hover:bg-gray-900/50 relative overflow-hidden group
          ${activeSection === 'dashboard' ? 'bg-gray-900/80' : ''}`}
        onClick={() => {
          setActiveSection('dashboard');
          if (onShowDashboard) {
            onShowDashboard();
          }
          // Fechar a barra lateral em dispositivos móveis
          if (onClose && window.innerWidth < 768) {
            onClose();
          }
        }}
      >
        <div className={`flex items-center ${isCollapsed && isDesktop ? '' : 'gap-3'} z-10`}>
          <div className="p-1.5 rounded-md bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
            <LayoutDashboard size={18} className="text-purple-400" />
          </div>
          {(!isCollapsed || !isDesktop) && <h2 className="text-base font-medium">Dashboard</h2>}
        </div>
        {(!isCollapsed || !isDesktop) && <div className="absolute left-0 h-full w-1 bg-purple-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>}
      </div>

      {/* Seção Minha Marcenaria (SEGUNDO) */}
      <div 
        className={`px-4 py-1.5 w-full border-b border-gray-700/50 flex ${isCollapsed && isDesktop ? 'justify-center' : 'justify-between'} items-center cursor-pointer 
          transition-all duration-200 hover:bg-gray-900/50 relative overflow-hidden group
          ${activeSection === 'myWorkshop' ? 'bg-gray-900/80' : ''}`}
        onClick={() => {
          setActiveSection('myWorkshop');
          if (onMyWorkshopView) {
            onMyWorkshopView();
          }
          // Fechar a barra lateral em dispositivos móveis
          if (onClose && window.innerWidth < 768) {
            onClose();
          }
        }}
      >
        <div className={`flex items-center ${isCollapsed && isDesktop ? '' : 'gap-3'} z-10`}>
          <div className="p-1.5 rounded-md bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
            <Building2 size={18} className="text-blue-400" />
          </div>
          {(!isCollapsed || !isDesktop) && <h2 className="text-base font-medium">Despesas Fixas</h2>}
        </div>
        {(!isCollapsed || !isDesktop) && <div className="absolute left-0 h-full w-1 bg-blue-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>}
      </div>
      
      {/* Seção Resumo Financeiro (TERCEIRO) */}
      <div 
        className={`p-4 py-1.5 border-b border-gray-700/50 flex ${isCollapsed && isDesktop ? 'justify-center' : 'justify-between'} items-center cursor-pointer 
          transition-all duration-200 hover:bg-gray-900/50 relative overflow-hidden group
          ${activeSection === 'financialSummary' ? 'bg-gray-900/80' : ''}`}
        onClick={() => {
          setActiveSection('financialSummary');
          if (onFinancialSummaryView) {
            onFinancialSummaryView();
          }
          // Fechar a barra lateral em dispositivos móveis
          if (onClose && window.innerWidth < 768) {
            onClose();
          }
        }}
      >
        <div className={`flex items-center ${isCollapsed && isDesktop ? '' : 'gap-3'} z-10`}>
          <div className="p-1.5 rounded-md bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
            <BarChart3 size={18} className="text-green-400" />
          </div>
          {(!isCollapsed || !isDesktop) && <h2 className="text-base font-medium">Resumo Financeiro</h2>}
        </div>
        {(!isCollapsed || !isDesktop) && <div className="absolute left-0 h-full w-1 bg-green-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>}
      </div>
      
      {/* Seção de Meus Clientes (QUARTO) */}
      <div 
        className={`p-4 py-1.5 border-b border-gray-700/50 flex ${isCollapsed && isDesktop ? 'justify-center' : 'justify-between'} items-center cursor-pointer 
          transition-all duration-200 hover:bg-gray-900/50 relative overflow-hidden group
          ${activeSection === 'clients' ? 'bg-gray-900/80' : ''}`}
        onClick={() => {
          setActiveSection('clients');
          if (onClientsView) {
            onClientsView();
          }
          // Fechar a barra lateral em dispositivos móveis
          if (onClose && window.innerWidth < 768) {
            onClose();
          }
        }}
      >
        <div className={`flex items-center ${isCollapsed && isDesktop ? '' : 'gap-3'} z-10`}>
          <div className="p-1.5 rounded-md bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
            <Users size={18} className="text-purple-400" />
          </div>
          {(!isCollapsed || !isDesktop) && <h2 className="text-base font-medium">Clientes</h2>}
        </div>
        {(!isCollapsed || !isDesktop) && <div className="absolute left-0 h-full w-1 bg-purple-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>}
      </div>
      
      {/* Seção de Meus Projetos (QUINTO) */}
      <div 
        className={`p-4 py-1.5 border-b border-gray-900/5 flex ${isCollapsed && isDesktop ? 'justify-center' : 'justify-between'} items-center cursor-pointer 
          transition-all duration-200 hover:bg-gray-900/50 relative overflow-hidden group
          ${activeSection === 'projects' ? 'bg-gray-900/80' : ''}`}
        onClick={() => {
          setActiveSection('projects');
          if (onProjectsKanbanView) {
            onProjectsKanbanView();
          }
          // Fechar a barra lateral em dispositivos móveis
          if (onClose && window.innerWidth < 768) {
            onClose();
          }
        }}
      >
        <div className={`flex items-center ${isCollapsed && isDesktop ? '' : 'gap-3'} z-10`}>
          <div className="p-1.5 rounded-md bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
            <LayoutDashboard size={18} className="text-amber-400" />
          </div>
          {(!isCollapsed || !isDesktop) && <h2 className="text-base font-medium">Projetos</h2>}
        </div>
        {(!isCollapsed || !isDesktop) && <div className="absolute left-0 h-full w-1 bg-amber-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sortedProjects.length === 0 ? (
          <div className={`p-4 text-gray-400 text-center ${isCollapsed && isDesktop ? 'hidden' : ''}`}>
            Nenhum projeto ativo encontrado
          </div>
        ) : (
          <div className={`pt-2 ${isCollapsed && isDesktop ? 'hidden' : ''}`}>
            <div className="px-4 py-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
              Projetos Ativos ({sortedProjects.length})
            </div>
            <ul className="pb-2">
              {sortedProjects.map(project => (
                <li 
                  key={project.id}
                  className={`px-4 py-2 flex items-center justify-between hover:bg-gray-900/50 cursor-pointer ${
                    project.id === activeProjectId ? 'bg-gray-900/50' : ''
                  }`}
                  onClick={() => handleSelectProject(project.id)}
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
      
      <div className={`p-4 border-t border-gray-700/50 ${isCollapsed && isDesktop ? 'flex flex-col items-center' : ''}`}>
        <button
          className={`${isCollapsed && isDesktop ? 'w-10 h-10 p-0' : 'w-full'} flex items-center justify-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-800 transition-colors`}
          onClick={onCreateProject}
          title="Novo Projeto"
        >
          <Plus size={18} />
          {(!isCollapsed || !isDesktop) && "Novo Projeto"}
        </button>
        
        {/* Container para os botões Meu Perfil e Sair lado a lado em mobile */}
        <div className={`${isCollapsed && isDesktop ? 'flex flex-col gap-2' : 'grid grid-cols-2 md:grid-cols-2 gap-2'} mt-2`}>
          <button
            className={`flex items-center justify-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm md:text-base ${isCollapsed && isDesktop ? 'w-10 h-10 p-0' : ''}`}
            onClick={onUserProfileView}
            title="Perfil"
          >
            <User size={18} />
            {(!isCollapsed || !isDesktop) && <span>Perfil</span>}
          </button>
          
          <button
            className={`flex items-center justify-center gap-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm md:text-base ${isCollapsed && isDesktop ? 'w-10 h-10 p-0' : ''}`}
            onClick={handleLogout}
            title="Sair"
          >
            <LogOut size={18} />
            {(!isCollapsed || !isDesktop) && <span>Sair</span>}
          </button>
        </div>
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
  
  /* Adicionar transição suave para a largura da sidebar */
  .transition-width {
    transition-property: width;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
  }
  `
  }
</style>