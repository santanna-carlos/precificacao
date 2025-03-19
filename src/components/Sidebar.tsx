import React from 'react';
import { Plus, FolderOpen, Trash2, Calendar, X, Users, LayoutDashboard } from 'lucide-react';
import { Project } from '../types';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onClose?: () => void;
  onClientsView?: () => void;
  onProjectsKanbanView?: () => void; // Nova prop para mostrar a visão kanban
}

export function Sidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onClose,
  onClientsView,
  onProjectsKanbanView
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
  
  return (
    <div className="bg-gray-800 text-white w-64 flex flex-col h-screen shadow-lg">
      {/* Seção de cabeçalho com botão de clientes */}
      <div 
        className="p-4 border-b border-gray-700 flex justify-between items-center cursor-pointer hover:bg-gray-700"
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
        <div className="flex items-center gap-2">
          <Users size={18} />
          <h2 className="text-xl font-semibold">Meus Clientes</h2>
        </div>
        {/* Botão de fechamento visível apenas em dispositivos móveis */}
        {onClose && (
          <button 
            className="text-gray-400 hover:text-white md:hidden" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Seção de cabeçalho para visualização kanban dos projetos */}
      <div 
        className="p-4 border-b border-gray-700 flex justify-between items-center cursor-pointer hover:bg-gray-700"
        onClick={onProjectsKanbanView}
      >
        <div className="flex items-center gap-2">
          <LayoutDashboard size={18} />
          <h2 className="text-xl font-semibold">Meus Projetos</h2>
        </div>
        {/* Botão de fechamento visível apenas em dispositivos móveis */}
        {onClose && (
          <button 
            className="text-gray-400 hover:text-white md:hidden" 
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="p-4 text-gray-400 text-center">
            Nenhum projeto encontrado
          </div>
        ) : (
          <ul className="py-2">
            {projects.map(project => (
              <li 
                key={project.id}
                className={`px-4 py-2 flex items-center justify-between hover:bg-gray-700 cursor-pointer ${
                  project.id === activeProjectId ? 'bg-gray-700' : ''
                }`}
                onClick={() => onSelectProject(project.id)}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <FolderOpen size={18} />
                    <span className="truncate">
                      {project.clientName ? `${abbreviateText(project.clientName)} - ` : ''}
                      {abbreviateText(project.name) || 'Projeto sem nome'}
                    </span>
                  </div>
                  {project.date && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <Calendar size={12} />
                      <span>{formatDate(project.date)}</span>
                    </div>
                  )}
                </div>
                <button
                  className="text-gray-400 hover:text-red-400"
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
        )}
      </div>
      
      <div className="p-4 border-t border-gray-700">
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