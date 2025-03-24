import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, XCircle, Check, Share2, Copy, Calendar, X } from 'lucide-react';
import { ProjectStages, PROJECT_STAGES, CANCELLATION_REASONS } from '../types';

interface ProjectStagesBarProps {
  stages: ProjectStages;
  onChange: (stageId: keyof ProjectStages, field: 'completed' | 'date' | 'cancellationReason' | 'realCost' | 'hasCompletionNotes' | 'completionNotes', value: boolean | string | number) => void;
  projectId: string; 
  clientName: string; 
  projectName: string; 
  onUpdateProject?: (projectId: string, field: string, value: any) => void;
}

export const ProjectStagesBar: React.FC<ProjectStagesBarProps> = ({ 
  stages, 
  onChange, 
  projectId, 
  clientName, 
  projectName,
  onUpdateProject 
}) => {
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);
  const [isExpandedDesktop, setIsExpandedDesktop] = useState(true); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  const [estimatedDate, setEstimatedDate] = useState<string>('');

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
    
    if (stageIndex === 0) return true;
    
    const previousStageId = PROJECT_STAGES[stageIndex - 1].id as keyof ProjectStages;
    return stages[previousStageId].completed;
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
    }
    
    onChange(stageKey, field, value);
    setErrorMessage(null);
  };

  const handleShareLink = () => {
    if (!estimatedDate) {
      alert('Por favor, preencha a data prevista de conclusão antes de compartilhar o link.');
      return;
    }
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}?tracking=${projectId}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setShowCopyConfirmation(true);
        setTimeout(() => setShowCopyConfirmation(false), 3000);
      })
      .catch(err => {
        console.error('Erro ao copiar link: ', err);
        alert('Não foi possível copiar o link. Por favor, tente novamente.');
      });
  };

  useEffect(() => {
    if (projectId) {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const currentProject = projects.find((p: any) => p.id === projectId);
      if (currentProject && currentProject.estimatedCompletionDate) {
        setEstimatedDate(currentProject.estimatedCompletionDate);
      } else {
        setEstimatedDate('');
      }
    }
  }, [projectId]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setEstimatedDate(newDate);
    
    if (onUpdateProject && projectId) {
      onUpdateProject(projectId, 'estimatedCompletionDate', newDate);
      
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const updatedProjects = projects.map((p: any) => 
        p.id === projectId 
          ? { ...p, estimatedCompletionDate: newDate, lastModified: new Date().toISOString() } 
          : p
      );
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
    }
  };

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
                    value={estimatedDate}
                    onChange={handleDateChange}
                    className="text-xs border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onClick={(e) => e.currentTarget.showPicker()}
                  />
                </div>
                <button
                  className="flex items-center justify-center p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                  onClick={handleShareLink}
                  title={`Compartilhar link de acompanhamento para ${clientName} - ${projectName}`}
                  disabled={!estimatedDate}
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
                      disabled={(!canComplete && !stageData?.completed) || isProjectCanceled}
                      title={!canComplete && !stageData?.completed ? `Conclua a etapa "${PROJECT_STAGES[index - 1]?.label}" primeiro` : isProjectCanceled ? 'Projeto cancelado' : ''}
                    />
                    <label htmlFor={`stage-${stage.id}-mobile`} className={`text-sm font-medium ${
                      (stage.id === 'instalacao' && stageData?.completed) ? 'text-green-700' : ''
                    }`}>
                      {(stage.id === 'instalacao' && stageData?.completed) ? (
                        <span className="flex items-center gap-1">
                          <Check size={16} className="text-green-600" />
                          {stage.label}
                        </span>
                      ) : (
                        stage.label
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
                    disabled={!canCompleteStage(-1, 'projetoCancelado')}
                    title={!canCompleteStage(-1, 'projetoCancelado') ? 'Não é possível cancelar um projeto que já foi instalado' : ''}
                  />
                  <label htmlFor="stage-projetoCancelado-mobile" className={`text-sm font-medium ${isProjectCanceled ? 'text-red-700' : ''}`}>
                    <span className="flex items-center gap-1">
                      {isProjectCanceled && <XCircle size={16} className="text-red-600" />}
                      {cancelStage.label}
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
                      disabled={(!canComplete && !stageData?.completed) || isProjectCanceled}
                      title={!canComplete && !stageData?.completed ? `Conclua a etapa "${PROJECT_STAGES[index - 1]?.label}" primeiro` : isProjectCanceled ? 'Projeto cancelado' : ''}
                    />
                    <label htmlFor={`stage-${stage.id}-desktop`} className={`text-sm font-medium ${
                      (stage.id === 'instalacao' && stageData?.completed) ? 'text-green-700' : ''
                    }`}>
                      {(stage.id === 'instalacao' && stageData?.completed) ? (
                        <span className="flex items-center gap-1">
                          <Check size={16} className="text-green-600" />
                          {stage.label}
                        </span>
                      ) : (
                        stage.label
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
                      disabled={(!canComplete && !stageData?.completed) || isProjectCanceled}
                      title={!canComplete && !stageData?.completed ? `Conclua a etapa "${PROJECT_STAGES[globalIndex - 1]?.label}" primeiro` : isProjectCanceled ? 'Projeto cancelado' : ''}
                    />
                    <label htmlFor={`stage-${stage.id}-desktop`} className={`text-sm font-medium ${
                      (stage.id === 'instalacao' && stageData?.completed) ? 'text-green-700' : ''
                    }`}>
                      {(stage.id === 'instalacao' && stageData?.completed) ? (
                        <span className="flex items-center gap-1">
                          <Check size={16} className="text-green-600" />
                          {stage.label}
                        </span>
                      ) : (
                        stage.label
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
                    disabled={!canCompleteStage(-1, 'projetoCancelado')}
                    title={!canCompleteStage(-1, 'projetoCancelado') ? 'Não é possível cancelar um projeto que já foi instalado' : ''}
                  />
                  <label htmlFor="stage-projetoCancelado-desktop" className={`text-sm font-medium ${isProjectCanceled ? 'text-red-700' : ''}`}>
                    <span className="flex items-center gap-1">
                      {isProjectCanceled && <XCircle size={16} className="text-red-600" />}
                      {cancelStage.label}
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