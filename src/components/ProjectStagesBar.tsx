import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, XCircle, Check, Share2, Copy, Calendar, X, Loader2 } from 'lucide-react';
import { ProjectStages, PROJECT_STAGES, CANCELLATION_REASONS } from '../types';
import { supabase } from '../supabase';

interface ProjectStagesBarProps {
  stages: ProjectStages;
  onChange: (stageId: keyof ProjectStages, field: 'completed' | 'date' | 'cancellationReason' | 'realCost' | 'hasCompletionNotes' | 'completionNotes', value: boolean | string | number) => void;
  projectId: string; 
  clientName: string; 
  projectName: string; 
  estimatedCompletionDate?: string; 
  onUpdateProject?: (projectId: string, field: string, value: any) => void;
}

export const ProjectStagesBar: React.FC<ProjectStagesBarProps> = ({ 
  stages, 
  onChange, 
  projectId, 
  clientName, 
  projectName,
  estimatedCompletionDate: propEstimatedCompletionDate,
  onUpdateProject 
}) => {
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);
  const [isExpandedDesktop, setIsExpandedDesktop] = useState(true); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState<string>(propEstimatedCompletionDate || '');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStageId, setLoadingStageId] = useState<string | null>(null);

  // Sincronizar o estado com a prop sempre que ela mudar
  useEffect(() => {
    if (propEstimatedCompletionDate !== undefined) {
      console.log('ProjectStagesBar - Atualizando estado com nova prop de data:', propEstimatedCompletionDate);
      setEstimatedCompletionDate(propEstimatedCompletionDate);
    }
  }, [propEstimatedCompletionDate]);

  const toggleExpandMobile = () => {
    setIsExpandedMobile(!isExpandedMobile);
  };

  const toggleExpandDesktop = () => {
    setIsExpandedDesktop(!isExpandedDesktop);
  };

  const regularStages = PROJECT_STAGES.filter(stage => stage.id !== 'projetoCancelado');
  const cancelStage = PROJECT_STAGES.find(stage => stage.id === 'projetoCancelado');
  
  const firstRowStages = regularStages.slice(0, 5);
  const secondRowStages = regularStages.slice(5);

  const isProjectCanceled = stages.projetoCancelado?.completed || false;
  
  const isProjectCompleted = stages.instalacao?.completed || false;

  const isProjectTechnicalCompleted = stages.projetoTecnico?.completed || false;

  const canCompleteStage = (stageIndex: number, stageId: string): boolean => {
    if (stageId === 'projetoCancelado') {
      const instalacaoStage = stages.instalacao;
      if (instalacaoStage?.completed) {
        return false;
      }
      return true;
    }
    
    if (isProjectCanceled) return false;
    
    // Etapa inicial sempre pode ser marcada
    if (stageIndex === 0) return true;
    
    // Encontrar o índice da etapa "projetoTecnico"
    const projetoTecnicoIndex = regularStages.findIndex(s => s.id === 'projetoTecnico');
    
    // Para etapas até "projetoTecnico" (inclusive), manter a sequência lógica
    if (stageIndex <= projetoTecnicoIndex) {
      const previousStageId = PROJECT_STAGES[stageIndex - 1].id as keyof ProjectStages;
      return stages[previousStageId].completed;
    }
    
    // Para etapas após "projetoTecnico", verificar apenas se "projetoTecnico" está concluído
    if (stageIndex > projetoTecnicoIndex) {
      return stages.projetoTecnico.completed;
    }
    
    return true;
  };

  const canUncompleteStage = (stageIndex: number, stageId: string): boolean => {
    if (stageId === 'projetoCancelado') return true;
    
    if (isProjectCanceled) return false;
    
    for (let i = stageIndex + 1; i < regularStages.length; i++) {
      const nextStageId = regularStages[i].id as keyof ProjectStages;
      if (stages[nextStageId]?.completed) {
        return false; 
      }
    }
    
    return true;
  };

  const handleStageChange = (stageKey: keyof ProjectStages, field: 'completed' | 'date' | 'cancellationReason' | 'realCost' | 'hasCompletionNotes' | 'completionNotes', value: boolean | string | number) => {
    if (field === 'completed') {
      const isCompleting = value === true;
      const stageIndex = regularStages.findIndex(s => s.id === stageKey);
      
      if (isCompleting && !canCompleteStage(stageIndex, stageKey as string)) {
        return; 
      }
      
      if (!isCompleting && !canUncompleteStage(stageIndex, stageKey as string)) {
        return; 
      }

      // Set loading state
      setIsLoading(true);
      setLoadingStageId(stageKey as string);
    }
    
    onChange(stageKey, field, value);
    setErrorMessage(null);

    // Ajustar o tempo de exibição do indicador de carregamento para garantir
    // que ele permaneça visível durante todas as operações remotas
    if (field === 'completed') {
      // Tempo estimado baseado na complexidade das operações que observamos no App.tsx
      // que inclui várias chamadas ao localStorage e ao Supabase
      setTimeout(() => {
        setIsLoading(false);
        setLoadingStageId(null);
      }, 1500); // Ajustado para 1,5 segundos conforme solicitação
    }
  };

  const handleShareLink = () => {
    if (!estimatedCompletionDate) {
      alert('Por favor, preencha a data prevista de conclusão antes de compartilhar o link.');
      return;
    }
    
    const baseUrl = window.location.origin;
    // Garantir que o link inclua a barra no final do origin se necessário
    const formattedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    // Usar formato de query string padrão
    const shareUrl = `${formattedBaseUrl}?tracking=${encodeURIComponent(projectId)}`;
    
    // Tentar copiar para a área de transferência
    try {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setShowCopyConfirmation(true);
          setTimeout(() => setShowCopyConfirmation(false), 3000);
          
          // Salvar o link no localStorage para garantir que funcione mesmo sem conexão com o banco
          const trackingLinks = JSON.parse(localStorage.getItem('trackingLinks') || '{}');
          trackingLinks[projectId] = {
            url: shareUrl,
            projectId: projectId,
            clientName: clientName,
            projectName: projectName,
            createdAt: new Date().toISOString()
          };
          localStorage.setItem('trackingLinks', JSON.stringify(trackingLinks));
        })
        .catch(err => {
          console.error('Erro ao copiar link: ', err);
          alert('Não foi possível copiar o link. Por favor, tente novamente.');
        });
    } catch (err) {
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setShowCopyConfirmation(true);
          setTimeout(() => setShowCopyConfirmation(false), 3000);
          
          // Salvar o link no localStorage mesmo usando o método alternativo
          const trackingLinks = JSON.parse(localStorage.getItem('trackingLinks') || '{}');
          trackingLinks[projectId] = {
            url: shareUrl,
            projectId: projectId,
            clientName: clientName,
            projectName: projectName,
            createdAt: new Date().toISOString()
          };
          localStorage.setItem('trackingLinks', JSON.stringify(trackingLinks));
        } else {
          alert('Não foi possível copiar o link. Por favor, selecione e copie manualmente: ' + shareUrl);
        }
      } catch (err) {
        alert('Não foi possível copiar o link. Por favor, selecione e copie manualmente: ' + shareUrl);
      }
      
      document.body.removeChild(textArea);
    }
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    console.log('Nova data selecionada:', newDate);
    setEstimatedCompletionDate(newDate);
    
    if (onUpdateProject && projectId) {
      console.log('Atualizando data prevista no Supabase e localStorage');
      
      try {
        // Atualização direta no Supabase - enviar a string da data diretamente
        // Isso garante consistência com o formato esperado pelo serviço de projetos
        const { data, error } = await supabase
          .from('projects')
          .update({ estimated_completion_date: newDate })
          .eq('id', projectId)
          .select();
        
        if (error) {
          console.error('Erro ao atualizar data prevista no Supabase:', error);
          setErrorMessage('Erro ao atualizar data prevista. Por favor, tente novamente.');
        } else {
          console.log('Data prevista atualizada com sucesso no Supabase:', data);
          
          // Atualizar também no localStorage para garantir consistência
          const cachedProjects = JSON.parse(localStorage.getItem('cachedProjects') || '[]');
          const updatedProjects = cachedProjects.map((p: any) => 
            p.id === projectId 
              ? { ...p, estimatedCompletionDate: newDate, lastModified: new Date().toISOString() } 
              : p
          );
          localStorage.setItem('cachedProjects', JSON.stringify(updatedProjects));
          console.log('Data prevista atualizada no localStorage (cachedProjects)');
          
          // Chamar o método original para atualizar o estado React
          onUpdateProject(projectId, 'estimatedCompletionDate', newDate);
        }
      } catch (err) {
        console.error('Erro ao atualizar data prevista:', err);
        setErrorMessage('Erro ao atualizar data prevista. Por favor, tente novamente.');
      }
    }
  };

  useEffect(() => {
    if (projectId) {
      console.log('ProjectStagesBar useEffect - projectId alterado:', projectId);
      
      // Se a prop foi fornecida, usá-la
      if (propEstimatedCompletionDate) {
        console.log('Usando data prevista fornecida como prop:', propEstimatedCompletionDate);
        setEstimatedCompletionDate(propEstimatedCompletionDate);
        return;
      }
      
      // Caso contrário, tentar obter do localStorage
      const cachedProjects = JSON.parse(localStorage.getItem('cachedProjects') || '[]');
      const projectFromStorage = cachedProjects.find((p: any) => p.id === projectId);
      
      if (projectFromStorage) {
        console.log('Projeto encontrado no localStorage (cachedProjects):', projectFromStorage);
        
        if (projectFromStorage.estimatedCompletionDate) {
          console.log('Data prevista encontrada no localStorage:', projectFromStorage.estimatedCompletionDate);
          // Converter para formato YYYY-MM-DD para o input date
          try {
            const date = new Date(projectFromStorage.estimatedCompletionDate);
            const formattedDate = date.toISOString().split('T')[0];
            setEstimatedCompletionDate(formattedDate);
          } catch (error) {
            console.error('Erro ao converter data do localStorage:', error);
            // Se já estiver no formato correto, usar diretamente
            if (typeof projectFromStorage.estimatedCompletionDate === 'string') {
              setEstimatedCompletionDate(projectFromStorage.estimatedCompletionDate);
            } else {
              setEstimatedCompletionDate('');
            }
          }
        } else {
          console.log('Nenhuma data prevista encontrada no localStorage para o projeto');
          setEstimatedCompletionDate('');
        }
      } else {
        console.log('Projeto não encontrado no localStorage (cachedProjects)');
        setEstimatedCompletionDate('');
      }
    }
  }, [projectId]);

  return (
    <div className="bg-gray-100 border-b border-gray-300 py-3 px-2 sm:px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm sm:text-base md:text-lg font-medium text-gray-700">Etapas do Projeto:</div>
          <div className="flex gap-2">
            {isProjectTechnicalCompleted && !isProjectCanceled && (
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-50 p-1 rounded-md border border-gray-200">
                  <label htmlFor={`estimatedDate-${projectId}`} className="text-xs text-gray-600 mr-1 whitespace-nowrap hidden sm:inline">
                    Data prevista:
                  </label>
                  <input
                    type="date"
                    id={`estimatedDate-${projectId}`}
                    value={estimatedCompletionDate}
                    onChange={handleDateChange}
                    className="text-xs border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onClick={(e) => e.currentTarget.showPicker()}
                  />
                </div>
                <button
                  className="flex items-center justify-center p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                  onClick={handleShareLink}
                  title={`Compartilhar link de acompanhamento para ${clientName} - ${projectName}`}
                  disabled={!estimatedCompletionDate}
                >
                  <Share2 size={18} className="mr-1" />
                  <span className="text-xs hidden sm:inline">Compartilhar</span>
                </button>
              </div>
            )}
            
            <button
              className="sm:hidden flex items-center justify-center p-1 bg-blue-600 text-white rounded-md"
              onClick={toggleExpandMobile}
              aria-label={isExpandedMobile ? "Recolher etapas" : "Expandir etapas"}
            >
              {isExpandedMobile ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            
            <button
              className="hidden sm:flex items-center justify-center p-1 bg-blue-600 text-white rounded-md"
              onClick={toggleExpandDesktop}
              aria-label={isExpandedDesktop ? "Recolher etapas" : "Expandir etapas"}
            >
              {isExpandedDesktop ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
        
        {showCopyConfirmation && (
          <div className="flex items-center gap-2 p-2 mb-2 bg-green-100 text-green-700 rounded-md">
            <Check size={16} />
            <span className="text-sm">Link copiado para a área de transferência!</span>
          </div>
        )}
        
        {errorMessage && (
          <div className="flex items-center gap-2 p-2 mb-2 bg-red-100 text-red-700 rounded-md">
            <AlertCircle size={16} />
            <span className="text-sm">{errorMessage}</span>
          </div>
        )}
        
        {/* Layout para dispositivos móveis - escondido em desktop */}
        <div className={`${isExpandedMobile ? 'block' : 'hidden'} sm:hidden`}>
          <div className="grid grid-cols-2 gap-2">
            {regularStages.map((stage, index) => {
              const stageKey = stage.id as keyof ProjectStages;
              const stageData = stages[stageKey];
              const canComplete = canCompleteStage(index, stage.id);
              
              return (
                <div 
                  key={stage.id} 
                  className={`flex flex-col bg-white rounded-md border ${
                    isProjectCanceled ? 'opacity-60' : 
                    (stage.id === 'instalacao' && stageData?.completed) ? 'border-green-500 bg-green-50' : 
                    'border-gray-300'
                  } shadow-sm`}
                >
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
                    <div className="relative">
                      <input 
                        type="checkbox"
                        id={`stage-${stage.id}-mobile`}
                        checked={stageData?.completed || false}
                        onChange={(e) => handleStageChange(stageKey, 'completed', e.target.checked)}
                        className={`h-4 w-4 rounded ${
                          stage.id === 'instalacao' ? 
                            (canComplete ? 'text-green-600 focus:ring-green-500 cursor-pointer' : 'text-gray-400 cursor-not-allowed') :
                            (canComplete ? 'text-blue-600 focus:ring-blue-500 cursor-pointer' : 'text-gray-400 cursor-not-allowed')
                        }`}
                        disabled={(!canComplete && !stageData?.completed) || isProjectCanceled || isLoading}
                        title={!canComplete && !stageData?.completed ? `Conclua a etapa "${PROJECT_STAGES[index - 1]?.label}" primeiro` : isProjectCanceled ? 'Projeto cancelado' : isLoading ? 'Aguarde a atualização em andamento' : ''}
                      />
                    </div>
                    <label htmlFor={`stage-${stage.id}-mobile`} className={`text-sm font-medium ${
                      (stage.id === 'instalacao' && stageData?.completed) ? 'text-green-700' : ''
                    }`}>
                      {(stage.id === 'instalacao' && stageData?.completed) ? (
                        <span className="flex items-center gap-1">
                          <Check size={16} className="text-green-600" />
                          {stage.label}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          {stage.label}
                          {isLoading && loadingStageId === stage.id && (
                            <Loader2 size={16} className="animate-spin text-blue-500 ml-1" />
                          )}
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="p-2 space-y-2">
                    <input
                      type="date"
                      value={stageData?.date || ''}
                      onChange={(e) => handleStageChange(stageKey, 'date', e.target.value)}
                      className={`w-full text-xs border ${
                        stage.id === 'instalacao' && stageData?.completed ? 'border-green-300' : 'border-gray-300'
                      } rounded-md p-1 focus:outline-none focus:ring-1 ${
                        stage.id === 'instalacao' ? 'focus:ring-green-500' : 'focus:ring-blue-500'
                      }`}
                      disabled={!stageData?.completed || isProjectCanceled}
                    />
                    
                    {stage.id === 'instalacao' && stageData?.completed && (
                      <div className="mt-2 bg-green-50 p-2 rounded-md border border-green-200">
                        <label htmlFor={`real-cost-${stage.id}-mobile`} className="block text-xs font-medium text-green-700 mb-1">
                          Valor real gasto (R$):
                        </label>
                        <input
                          id={`real-cost-${stage.id}-mobile`}
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={stageData?.realCost === undefined ? '' : stageData?.realCost}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              handleStageChange(stageKey, 'realCost', value === '' ? 0 : Number(value));
                            }
                          }}
                          className="w-full text-xs border border-green-300 rounded-md p-1 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {isExpandedMobile && cancelStage && (
              <div className={`flex flex-col bg-white rounded-md border ${isProjectCanceled ? 'border-red-500 bg-red-50' : 'border-gray-300'} shadow-sm`}>
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
                  <input 
                    type="checkbox"
                    id="stage-projetoCancelado-mobile"
                    checked={stages.projetoCancelado?.completed || false}
                    onChange={(e) => handleStageChange('projetoCancelado', 'completed', e.target.checked)}
                    className={`h-4 w-4 rounded focus:ring-red-500 ${canCompleteStage(-1, 'projetoCancelado') ? 'text-red-600 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                    disabled={!canCompleteStage(-1, 'projetoCancelado') || isLoading}
                    title={!canCompleteStage(-1, 'projetoCancelado') ? 'Não é possível cancelar um projeto que já foi instalado' : isLoading ? 'Aguarde a atualização em andamento' : ''}
                  />
                  <label htmlFor="stage-projetoCancelado-mobile" className={`text-sm font-medium ${isProjectCanceled ? 'text-red-700' : ''}`}>
                    <span className="flex items-center gap-1">
                      {cancelStage?.label}
                      {isLoading && loadingStageId === 'projetoCancelado' && (
                        <Loader2 size={16} className="animate-spin text-red-500 ml-1" />
                      )}
                    </span>
                  </label>
                </div>
                <div className="p-2 flex flex-col gap-2">
                  <input
                    type="date"
                    value={stages.projetoCancelado?.date || ''}
                    onChange={(e) => handleStageChange('projetoCancelado', 'date', e.target.value)}
                    className={`w-full text-xs border ${isProjectCanceled ? 'border-red-300' : 'border-gray-300'} rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-red-500`}
                    disabled={!stages.projetoCancelado?.completed}
                  />
                  
                  {isProjectCanceled && (
                    <select
                      value={stages.projetoCancelado?.cancellationReason || ''}
                      onChange={(e) => handleStageChange('projetoCancelado', 'cancellationReason', e.target.value)}
                      className="w-full text-xs border border-red-300 rounded-md p-1 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="">Selecione o motivo do cancelamento</option>
                      {CANCELLATION_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Layout para desktop - escondido em mobile */}
        <div className={`hidden ${isExpandedDesktop ? 'sm:block' : 'sm:hidden'}`}>
          <div className="grid grid-cols-5 gap-3 mb-3">
            {firstRowStages.map((stage, index) => {
              const stageKey = stage.id as keyof ProjectStages;
              const stageData = stages[stageKey];
              const canComplete = canCompleteStage(index, stage.id);
              
              return (
                <div 
                  key={stage.id} 
                  className={`flex flex-col bg-white rounded-md border ${
                    isProjectCanceled ? 'opacity-60' : 
                    (stage.id === 'instalacao' && stageData?.completed) ? 'border-green-500 bg-green-50' : 
                    'border-gray-300'
                  } shadow-sm`}
                >
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
                    <div className="relative">
                      <input 
                        type="checkbox"
                        id={`stage-${stage.id}-desktop`}
                        checked={stageData?.completed || false}
                        onChange={(e) => handleStageChange(stageKey, 'completed', e.target.checked)}
                        className={`h-4 w-4 rounded ${
                          stage.id === 'instalacao' ? 
                            (canComplete ? 'text-green-600 focus:ring-green-500 cursor-pointer' : 'text-gray-400 cursor-not-allowed') :
                            (canComplete ? 'text-blue-600 focus:ring-blue-500 cursor-pointer' : 'text-gray-400 cursor-not-allowed')
                        }`}
                        disabled={(!canComplete && !stageData?.completed) || isProjectCanceled || isLoading}
                        title={!canComplete && !stageData?.completed ? `Conclua a etapa "${PROJECT_STAGES[index - 1]?.label}" primeiro` : isProjectCanceled ? 'Projeto cancelado' : isLoading ? 'Aguarde a atualização em andamento' : ''}
                      />
                    </div>
                    <label htmlFor={`stage-${stage.id}-desktop`} className={`text-sm font-medium ${
                      (stage.id === 'instalacao' && stageData?.completed) ? 'text-green-700' : ''
                    }`}>
                      {(stage.id === 'instalacao' && stageData?.completed) ? (
                        <span className="flex items-center gap-1">
                          <Check size={16} className="text-green-600" />
                          {stage.label}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          {stage.label}
                          {isLoading && loadingStageId === stage.id && (
                            <Loader2 size={16} className="animate-spin text-blue-500 ml-1" />
                          )}
                        </span>
                      )}
                    </label>
                  </div>
                  <div className="p-2 space-y-2">
                    <input
                      type="date"
                      value={stageData?.date || ''}
                      onChange={(e) => handleStageChange(stageKey, 'date', e.target.value)}
                      className={`w-full text-xs border ${
                        stage.id === 'instalacao' && stageData?.completed ? 'border-green-300' : 'border-gray-300'
                      } rounded-md p-1 focus:outline-none focus:ring-1 ${
                        stage.id === 'instalacao' ? 'focus:ring-green-500' : 'focus:ring-blue-500'
                      }`}
                      disabled={!stageData?.completed || isProjectCanceled}
                    />
                    
                    {stage.id === 'instalacao' && stageData?.completed && (
                      <div className="mt-2 bg-green-50 p-2 rounded-md border border-green-200">
                        <div className="flex flex-wrap items-center gap-2">
                          <label htmlFor={`real-cost-${stage.id}-desktop`} className="text-xs font-medium text-green-700 whitespace-nowrap">
                            Custo Total Real (R$):
                          </label>
                          <input
                            id={`real-cost-${stage.id}-desktop`}
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={stageData?.realCost === undefined ? '' : stageData?.realCost}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                handleStageChange(stageKey, 'realCost', value === '' ? 0 : Number(value));
                              }
                            }}
                            className="w-24 text-xs border border-green-300 rounded-md p-1 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-5 gap-3">
            {secondRowStages.map((stage, index) => {
              const globalIndex = index + 5; 
              const stageKey = stage.id as keyof ProjectStages;
              const stageData = stages[stageKey];
              const canComplete = canCompleteStage(globalIndex, stage.id);
              
              return (
                <div 
                  key={stage.id} 
                  className={`flex flex-col bg-white rounded-md border ${
                    isProjectCanceled ? 'opacity-60' : 
                    (stage.id === 'instalacao' && stageData?.completed) ? 'border-green-500 bg-green-50' : 
                    'border-gray-300'
                  } shadow-sm`}
                >
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
                    <div className="relative">
                      <input 
                        type="checkbox"
                        id={`stage-${stage.id}-desktop`}
                        checked={stageData?.completed || false}
                        onChange={(e) => handleStageChange(stageKey, 'completed', e.target.checked)}
                        className={`h-4 w-4 rounded ${
                          stage.id === 'instalacao' ? 
                            (canComplete ? 'text-green-600 focus:ring-green-500 cursor-pointer' : 'text-gray-400 cursor-not-allowed') :
                            (canComplete ? 'text-blue-600 focus:ring-blue-500 cursor-pointer' : 'text-gray-400 cursor-not-allowed')
                        }`}
                        disabled={(!canComplete && !stageData?.completed) || isProjectCanceled || isLoading}
                        title={!canComplete && !stageData?.completed ? `Conclua a etapa "${PROJECT_STAGES[globalIndex - 1]?.label}" primeiro` : isProjectCanceled ? 'Projeto cancelado' : isLoading ? 'Aguarde a atualização em andamento' : ''}
                      />
                    </div>
                    <label htmlFor={`stage-${stage.id}-desktop`} className={`text-sm font-medium ${
                      (stage.id === 'instalacao' && stageData?.completed) ? 'text-green-700' : ''
                    }`}>
                      {(stage.id === 'instalacao' && stageData?.completed) ? (
                        <span className="flex items-center gap-1">
                          <Check size={16} className="text-green-600" />
                          {stage.label}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          {stage.label}
                          {isLoading && loadingStageId === stage.id && (
                            <Loader2 size={16} className="animate-spin text-blue-500 ml-1" />
                          )}
                        </span>
                      )}
                    </label>
                  </div>
                  <div className="p-2 space-y-2">
                    <input
                      type="date"
                      value={stageData?.date || ''}
                      onChange={(e) => handleStageChange(stageKey, 'date', e.target.value)}
                      className={`w-full text-xs border ${
                        stage.id === 'instalacao' && stageData?.completed ? 'border-green-300' : 'border-gray-300'
                      } rounded-md p-1 focus:outline-none focus:ring-1 ${
                        stage.id === 'instalacao' ? 'focus:ring-green-500' : 'focus:ring-blue-500'
                      }`}
                      disabled={!stageData?.completed || isProjectCanceled}
                    />
                    
                    {stage.id === 'instalacao' && stageData?.completed && (
                      <div className="mt-2 bg-green-50 p-2 rounded-md border border-green-200">
                        <div className="flex flex-wrap items-center gap-2">
                          <label htmlFor={`real-cost-${stage.id}-desktop`} className="text-xs font-medium text-green-700 whitespace-nowrap">
                            Custo Total Real (R$):
                          </label>
                          <input
                            id={`real-cost-${stage.id}-desktop`}
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={stageData?.realCost === undefined ? '' : stageData?.realCost}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                handleStageChange(stageKey, 'realCost', value === '' ? 0 : Number(value));
                              }
                            }}
                            className="w-24 text-xs border border-green-300 rounded-md p-1 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {isExpandedDesktop && cancelStage && (
              <div className={`flex flex-col bg-white rounded-md border ${isProjectCanceled ? 'border-red-500 bg-red-50' : 'border-gray-300'} shadow-sm`}>
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
                  <input 
                    type="checkbox"
                    id="stage-projetoCancelado-desktop"
                    checked={stages.projetoCancelado?.completed || false}
                    onChange={(e) => handleStageChange('projetoCancelado', 'completed', e.target.checked)}
                    className={`h-4 w-4 rounded focus:ring-red-500 ${canCompleteStage(-1, 'projetoCancelado') ? 'text-red-600 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                    disabled={!canCompleteStage(-1, 'projetoCancelado') || isLoading}
                    title={!canCompleteStage(-1, 'projetoCancelado') ? 'Não é possível cancelar um projeto que já foi instalado' : isLoading ? 'Aguarde a atualização em andamento' : ''}
                  />
                  <label htmlFor="stage-projetoCancelado-desktop" className={`text-sm font-medium ${isProjectCanceled ? 'text-red-700' : ''}`}>
                    <span className="flex items-center gap-1">
                      {cancelStage?.label}
                      {isLoading && loadingStageId === 'projetoCancelado' && (
                        <Loader2 size={16} className="animate-spin text-red-500 ml-1" />
                      )}
                    </span>
                  </label>
                </div>
                <div className="p-2 flex flex-col gap-2">
                  <input
                    type="date"
                    value={stages.projetoCancelado?.date || ''}
                    onChange={(e) => handleStageChange('projetoCancelado', 'date', e.target.value)}
                    className={`w-full text-xs border ${isProjectCanceled ? 'border-red-300' : 'border-gray-300'} rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-red-500`}
                    disabled={!stages.projetoCancelado?.completed}
                  />
                  
                  {isProjectCanceled && (
                    <select
                      value={stages.projetoCancelado?.cancellationReason || ''}
                      onChange={(e) => handleStageChange('projetoCancelado', 'cancellationReason', e.target.value)}
                      className="w-full text-xs border border-red-300 rounded-md p-1 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="">Selecione o motivo do cancelamento</option>
                      {CANCELLATION_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {stages.instalacao?.completed && !stages.projetoCancelado?.completed && (
          <>
            {isExpandedDesktop && (
              <div className="hidden md:block mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-3 mb-2">
                    <label htmlFor="has-completion-notes-desktop" className="text-sm font-medium text-gray-700">
                      Adicionar nota sobre finalização?
                    </label>
                    <input
                      type="checkbox"
                      id="has-completion-notes-desktop"
                      checked={stages.instalacao?.hasCompletionNotes || false}
                      onChange={(e) => handleStageChange('instalacao', 'hasCompletionNotes', e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>
                  
                  {stages.instalacao?.hasCompletionNotes && (
                    <div className="mt-2 w-full">
                      <textarea
                        rows={3}
                        placeholder="Escreva aqui suas observações sobre a conclusão do projeto..."
                        value={stages.instalacao?.completionNotes || ''}
                        onChange={(e) => handleStageChange('instalacao', 'completionNotes', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {isExpandedMobile && (
              <div className="md:hidden mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="has-completion-notes-mobile" className="text-sm font-medium text-gray-700">
                    Adicionar nota sobre finalização?
                  </label>
                  <input
                    type="checkbox"
                    id="has-completion-notes-mobile"
                    checked={stages.instalacao?.hasCompletionNotes || false}
                    onChange={(e) => handleStageChange('instalacao', 'hasCompletionNotes', e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
                
                {stages.instalacao?.hasCompletionNotes && (
                  <div className="mt-2">
                    <textarea
                      rows={3}
                      placeholder="Escreva aqui suas observações sobre a conclusão do projeto..."
                      value={stages.instalacao?.completionNotes || ''}
                      onChange={(e) => handleStageChange('instalacao', 'completionNotes', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};