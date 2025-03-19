import React, { useMemo } from 'react';
import { Project, ProjectStages } from '../types';
import { Calendar, Clock, Check, XCircle } from 'lucide-react';

interface ProjectsKanbanProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
}

export function ProjectsKanban({ projects, onSelectProject }: ProjectsKanbanProps) {
  // Função para determinar o status do projeto baseado nos estágios
  const getProjectStatus = (project: Project): 'toStart' | 'inProgress' | 'completed' | 'canceled' => {
    // Verificar primeiro se o projeto foi cancelado
    if (project.stages?.projetoCancelado?.completed) {
      return 'canceled';
    }
    
    // Verificar se o projeto foi finalizado
    if (project.stages?.finalizacao?.completed) {
      return 'completed';
    }
    
    // Verificar se o projeto está em andamento (Instalação marcada)
    if (project.stages?.instalacao?.completed) {
      return 'inProgress';
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
  
  // Agrupar projetos por status
  const groupedProjects = useMemo(() => {
    const grouped = {
      toStart: [] as Project[],
      inProgress: [] as Project[],
      completed: [] as Project[],
      canceled: [] as Project[]
    };
    
    projects.forEach(project => {
      const status = getProjectStatus(project);
      grouped[status].push(project);
    });
    
    return grouped;
  }, [projects]);
  
  // Calcular porcentagens para cada estágio
  const percentages = useMemo(() => {
    const total = projects.length;
    if (total === 0) return { toStart: 0, inProgress: 0, completed: 0, canceled: 0 };
    
    return {
      toStart: Math.round((groupedProjects.toStart.length / total) * 100),
      inProgress: Math.round((groupedProjects.inProgress.length / total) * 100),
      completed: Math.round((groupedProjects.completed.length / total) * 100),
      canceled: Math.round((groupedProjects.canceled.length / total) * 100)
    };
  }, [projects.length, groupedProjects]);
  
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
  
  // Renderizar cartão de projeto
  const renderProjectCard = (project: Project) => {
    return (
      <div 
        key={project.id}
        className="bg-white rounded-lg shadow-md p-4 mb-3 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onSelectProject(project.id)}
      >
        <div className="font-semibold text-gray-800 mb-2 truncate">
          {project.clientName ? `${project.clientName} - ` : ''}
          {project.name || 'Projeto sem nome'}
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-1">
          <Calendar size={14} className="mr-1" />
          <span>Criado em: {formatDate(project.date)}</span>
        </div>
        
        {project.lastModified && (
          <div className="flex items-center text-sm text-gray-500">
            <Clock size={14} className="mr-1" />
            <span>Modificado: {formatDate(project.lastModified)}</span>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 md:text-left text-center">Visão Geral dos Projetos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        
        {/* Coluna: Cancelados */}
        <div className="bg-white rounded-lg p-4 border border-rose-200 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 rounded-full bg-rose-400 mr-2"></div>
            <h2 className="text-lg font-semibold text-gray-800">Cancelados</h2>
            <span className="ml-2 bg-rose-100 text-rose-600 px-2 py-1 rounded-full text-xs font-medium">
              {groupedProjects.canceled.length} ({percentages.canceled}%)
            </span>
          </div>
          <div className="space-y-3">
            {groupedProjects.canceled.length === 0 ? (
              <div className="text-center text-gray-500 py-4">Nenhum projeto cancelado</div>
            ) : (
              groupedProjects.canceled.map(renderProjectCard)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}