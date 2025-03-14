import React from 'react';
import { Plus, FolderOpen, Trash2, Calendar, X } from 'lucide-react';
import { Project } from '../types';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  onClose?: () => void; // Nova prop para fechar a barra lateral em dispositivos móveis
}

export function Sidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onClose
}: SidebarProps) {
  // Ordenar projetos em ordem decrescente (do mais recente para o mais antigo)
  const sortedProjects = [...projects].reverse();
  
  return (
    <div className="bg-gray-800 text-white w-64 flex flex-col h-screen shadow-lg">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Meus Projetos</h2>
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
            {sortedProjects.map(project => (
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
                    <span className="truncate">{project.name}</span>
                  </div>
                  {project.date && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <Calendar size={12} />
                      <span>{project.date}</span>
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