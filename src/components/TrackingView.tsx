import React, { useEffect, useState } from 'react';
import { Check, Loader2, MinusCircle, AlertTriangle, CheckCircle2, X, Clock, Circle } from 'lucide-react';
import { PROJECT_STAGES, ProjectStages, Project } from '../types';
import { supabase } from '../supabase';
import { useParams } from "react-router-dom";


interface TrackingViewProps {
  projectId?: string;
}

export const TrackingView: React.FC<TrackingViewProps> = ({ projectId }) => {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para formatar corretamente datas no fuso horário local
  const formatLocalDate = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      // Criar data no fuso horário local extraindo ano, mês e dia
      const [year, month, day] = dateString.split('-').map(Number);
      
      // Se não for possível extrair ano, mês e dia, tente o método padrão
      if (!year || !month || !day) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        return date.toLocaleDateString('pt-BR');
      }
      
      // Criar data local e formatar
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  };

  useEffect(() => {
    // Usar projectId da prop se disponível, senão usar o id do parâmetro de rota
    const projectIdToUse = projectId || params.id;
    
    if (!projectIdToUse) {
      setError('Link inválido ou projeto não especificado.');
      setLoading(false);
      return;
    }

    const fetchProject = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectIdToUse)
          .single();

        if (error) throw error;
        
        if (!data) {
          setError('Projeto não encontrado.');
          return;
        }
        
        setProject(data as Project);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar projeto:', err);
        setError('Erro ao buscar detalhes do projeto. Verifique se o link está correto.');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, params.id]);

  useEffect(() => {
    // Criar um elemento de estilo
    const styleEl = document.createElement('style');
    
    // Definir a animação personalizada
    styleEl.textContent = `
      @keyframes enhanced-pulse {
        0% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
        }
        
        70% {
          transform: scale(1.05);
          box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
        }
        
        100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
        }
      }
      
      .enhanced-pulse {
        animation: enhanced-pulse 2s infinite;
      }
    `;
    
    // Adicionar ao head do documento
    document.head.appendChild(styleEl);
    
    // Limpar ao desmontar o componente
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-red-600">{error || 'Projeto não encontrado.'}</h2>
          <p className="mt-2 text-gray-500">Verifique se o link está correto ou entre em contato com a marcenaria.</p>
        </div>
      </div>
    );
  }

  // Verifica se o projeto foi cancelado
  const isCancelled = project.stages?.projetoCancelado?.completed || false;
  
  // Verifica se o projeto foi concluído (instalação finalizada)
  const isCompleted = project.stages?.instalacao?.completed || false;
  
  // Filtra as etapas para remover "projetoCancelado" da timeline normal
  const displayStages = PROJECT_STAGES.filter(stage => stage.id !== "projetoCancelado");

  // Lógica para etapas puladas
  // 1. Encontra o índice da última etapa concluída
  const completedStages = displayStages.map((stage, idx) =>
    project.stages?.[stage.id as keyof ProjectStages]?.completed ? idx : -1
  ).filter(idx => idx !== -1);

  const lastCompletedIndex = completedStages.length > 0 ? Math.max(...completedStages) : -1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-2">
      <div className="w-full max-w-2xl bg-white border rounded-xl shadow-lg p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-blue-700 py-4">Acompanhamento do Projeto</h1>
          <p className="text-lg text-gray-700 mt-1">{project.client_name} - {project.name}</p>
          {project.estimated_completion_date && !isCancelled && (
            <p className="mt-2 text-gray-500">
              Data prevista de entrega:{" "}
              <span className="font-medium text-gray-600">
                {formatLocalDate(project.estimated_completion_date)}
              </span>
            </p>
          )}
        </div>
        
        {/* Exibe aviso de cancelamento se o projeto foi cancelado */}
        {isCancelled && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <div className="flex justify-center items-center mb-2">
              <AlertTriangle className="text-red-500 mr-2" size={24} />
              <h2 className="text-xl font-bold text-red-600">Projeto Cancelado</h2>
            </div>
            {project.stages?.projetoCancelado?.date && (
              <p className="text-red-500">
                Em {formatLocalDate(project.stages.projetoCancelado.date)}
              </p>
            )}
          </div>
        )}
        
        {/* Exibe mensagem de conclusão se o projeto foi finalizado */}
        {isCompleted && !isCancelled && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg text-center">
            <div className="flex justify-center items-center mb-2">
              <CheckCircle2 className="text-green-500 mr-2" size={24} />
              <h2 className="text-xl font-bold text-green-600">Projeto Concluído</h2>
            </div>
            {project.stages?.instalacao?.date && (
              <p className="text-green-600">
                Instalação finalizada em {formatLocalDate(project.stages.instalacao.date)}
              </p>
            )}
            <p className="mt-2 text-gray-600">
              Agradecemos a confiança em nosso trabalho!
            </p>
          </div>
        )}
        
        <ol className="relative border-blue-200">
          {displayStages.map((stage, idx) => {
            const stageData = project.stages?.[stage.id as keyof ProjectStages];
            const isCompleted = stageData?.completed;
            // Etapa pulada: não está concluída, mas existe etapa posterior concluída
            const isSkipped =
              !isCompleted &&
              completedStages.some(completedIdx => completedIdx > idx);

            // Etapa que não será realizada devido ao cancelamento
            const isCancelledStage = isCancelled && !isCompleted;

            const isCurrent =
              !isCompleted &&
              !isSkipped &&
              !isCancelledStage &&
              (completedStages.length === 0 ? idx === 0 : idx === lastCompletedIndex + 1);

            return (
              <li key={stage.id} className="mb-8 ml-4">
                <div className="flex items-center">
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2
                      ${isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isSkipped
                        ? 'bg-yellow-300 border-yellow-400 text-yellow-800'
                        : isCancelledStage
                        ? 'bg-red-100 border-red-300 text-red-600'
                        : isCurrent
                        ? 'bg-blue-500 border-blue-500 text-white enhanced-pulse'
                        : 'bg-gray-200 border-gray-200 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={20} />
                    ) : isSkipped ? (
                      <MinusCircle size={20} />
                    ) : isCancelledStage ? (
                      <X size={20} />
                    ) : isCurrent ? (
                      <Clock size={20} />
                    ) : (
                      <Circle size={16} />
                    )}
                  </span>
                  <div className="ml-4">
                    <span
                      className={`text-base font-medium ${
                        isCompleted
                          ? 'text-green-700'
                          : isSkipped
                          ? 'text-yellow-800'
                          : isCancelledStage
                          ? 'text-red-600'
                          : isCurrent
                          ? 'text-blue-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {stage.label}
                    </span>
                    {stageData?.date && (
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {formatLocalDate(stageData.date)}
                      </span>
                    )}
                    {isSkipped && (
                      <span className="block text-xs text-yellow-700 mt-0.5">
                        Etapa não realizada neste projeto
                      </span>
                    )}
                    {isCancelledStage && (
                      <span className="block text-xs text-red-600 mt-0.5">
                        Etapa cancelada
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 text-center text-gray-500 text-sm">
          <span>Este link é público e atualizado em tempo real.</span>
          <br></br>
          <span>Para mais informações, entre em contato com a marcenaria.</span>
        </div>
      </div>
    </div>
  );
};

export default TrackingView;