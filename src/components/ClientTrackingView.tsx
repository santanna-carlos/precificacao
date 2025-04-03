import React, { useEffect, useState } from 'react';
import { Project, ProjectStages, PROJECT_STAGES } from '../types';
import { supabase } from '../supabase';

interface ClientTrackingViewProps {
  projectId?: string;
  onClose?: () => void;
}

// Função simples para formatar datas com segurança
function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return 'Data não disponível';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch (e) {
    console.error('Erro ao formatar data:', e);
    return 'Data inválida';
  }
}

export function ClientTrackingView({ projectId, onClose }: ClientTrackingViewProps) {
  const [state, setState] = useState({
    project: null as Project | null,
    loading: true,
    error: null as string | null
  });
  
  // Um único useEffect para gerenciar todo o ciclo de vida
  useEffect(() => {
    async function loadProject() {
      // Inicialização
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        // Determinar ID do projeto
        let id = projectId;
        
        if (!id) {
          const path = window.location.pathname;
          const match = path.match(/\/acompanhamento\/([^\/]+)/);
          id = match && match[1] ? match[1] : null;
          
          if (!id) {
            setState({
              loading: false,
              project: null,
              error: 'Link de acompanhamento inválido'
            });
            return;
          }
        }
        
        // Carregar dados do projeto
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('Erro ao carregar projeto:', error);
          setState({
            loading: false,
            project: null,
            error: 'Não foi possível carregar o projeto'
          });
          return;
        }
        
        if (!data) {
          setState({
            loading: false,
            project: null,
            error: 'Projeto não encontrado'
          });
          return;
        }
        
        // Sucesso: projeto carregado
        setState({
          loading: false,
          project: data as Project,
          error: null
        });
      } catch (e) {
        console.error('Erro inesperado:', e);
        setState({
          loading: false,
          project: null,
          error: 'Ocorreu um erro ao processar a solicitação'
        });
      }
    }
    
    loadProject();
  }, [projectId]); // Dependência apenas do projectId
  
  // Extrair valores do estado
  const { project, loading, error } = state;
  
  // Renderização - sem condicionais que afetam hooks
  return (
    <div>
      {/* Componente de carregamento */}
      {loading && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Componente de erro */}
      {!loading && error && (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-2">{error}</h2>
            <p className="text-gray-600 mb-4">O link de acompanhamento não é válido ou expirou.</p>
            {onClose && (
              <button 
                onClick={onClose} 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200"
              >
                Voltar
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Componente de projeto */}
      {!loading && !error && project && (
        <div className="min-h-screen bg-gray-100">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <h1 className="text-2xl font-bold">Acompanhamento de Projeto</h1>
                  <p className="mt-1 text-lg">{project.clientName || ''} - {project.name || ''}</p>
                  <p className="mt-1 text-sm opacity-80">
                    Iniciado em: {formatDate(project.date)}
                  </p>
                </div>
                
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Status do Projeto</h2>
                  
                  <div className="space-y-6">
                    {PROJECT_STAGES
                      .filter(stage => stage.id !== 'projetoCancelado')
                      .map((stage) => {
                        const stageData = project.stages?.[stage.id as keyof ProjectStages];
                        const isCompleted = stageData?.completed || false;
                        
                        return (
                          <div key={stage.id} className="relative">
                            <div className={`flex items-center ${isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-green-100 border-green-500' : 'bg-gray-100 border-gray-300'}`}>
                                {isCompleted && (
                                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div className="ml-4">
                                <h3 className={`text-lg font-medium ${isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                                  {stage.label}
                                </h3>
                                {stageData?.date && (
                                  <p className="text-sm">
                                    {formatDate(stageData.date)}
                                  </p>
                                )}
                                {stage.id === 'instalacao' && isCompleted && (
                                  <p className="mt-2 text-green-600 font-medium">
                                    Projeto concluído! Obrigado pela confiança.
                                  </p>
                                )}
                              </div>
                            </div>
                            {stage.id !== 'instalacao' && (
                              <div className="absolute left-4 top-8 h-full w-0.5 bg-gray-200"></div>
                            )}
                          </div>
                        );
                      })}
                    
                    {project.stages?.projetoCancelado?.completed && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <h3 className="text-lg font-medium text-red-600">Projeto Cancelado</h3>
                        <p className="text-sm text-red-500 mt-1">
                          Data: {formatDate(project.stages.projetoCancelado.date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {project.estimatedCompletionDate && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-lg font-semibold mb-2">Data Prevista de Conclusão</h2>
                  <p className="text-gray-700">
                    {formatDate(project.estimatedCompletionDate)}
                  </p>
                </div>
              )}
              
              <div className="text-center mt-8">
                {onClose && (
                  <button 
                    onClick={onClose} 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Voltar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}