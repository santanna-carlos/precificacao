import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, XCircle } from 'lucide-react';
import { ProjectStages, PROJECT_STAGES } from '../types';

interface ProjectStagesBarProps {
  stages: ProjectStages;
  onChange: (stageId: keyof ProjectStages, field: 'completed' | 'date', value: boolean | string) => void;
}

export const ProjectStagesBar: React.FC<ProjectStagesBarProps> = ({ stages, onChange }) => {
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);
  const [isExpandedDesktop, setIsExpandedDesktop] = useState(true); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleExpandMobile = () => {
    setIsExpandedMobile(!isExpandedMobile);
  };

  const toggleExpandDesktop = () => {
    setIsExpandedDesktop(!isExpandedDesktop);
  };

  // Separa a etapa de cancelamento do projeto das demais etapas para tratamento especial
  const regularStages = PROJECT_STAGES.filter(stage => stage.id !== 'projetoCancelado');
  const cancelStage = PROJECT_STAGES.find(stage => stage.id === 'projetoCancelado');
  
  // Divide as etapas regulares em duas linhas para o layout desktop
  const firstRowStages = regularStages.slice(0, 5);
  const secondRowStages = regularStages.slice(5);

  // Verifica se o projeto está cancelado, com verificação de segurança
  const isProjectCanceled = stages.projetoCancelado?.completed || false;

  const canCompleteStage = (stageIndex: number, stageId: string): boolean => {
    // Se o estágio for "Projeto Cancelado", sempre pode ser marcado/desmarcado
    if (stageId === 'projetoCancelado') return true;
    
    // Se o projeto estiver cancelado, não permite marcar/desmarcar outros estágios
    if (isProjectCanceled) return false;
    
    // Primeira etapa sempre pode ser marcada se o projeto não estiver cancelado
    if (stageIndex === 0) return true;
    
    // Verificar se a etapa anterior está concluída
    const previousStageId = PROJECT_STAGES[stageIndex - 1].id as keyof ProjectStages;
    return stages[previousStageId].completed;
  };

  const handleStageChange = (stageKey: keyof ProjectStages, field: 'completed' | 'date', value: boolean | string) => {
    // Se estiver alterando o campo de data, sempre permite
    if (field !== 'completed') {
      onChange(stageKey, field, value);
      setErrorMessage(null);
      return;
    }
    
    // Obtem o índice do estágio que está sendo alterado
    const stageIndex = PROJECT_STAGES.findIndex(stage => stage.id === stageKey);
    
    // Se for o estágio de cancelamento do projeto
    if (stageKey === 'projetoCancelado') {
      onChange(stageKey, field, value);
      setErrorMessage(null);
      return;
    }
    
    // Se estiver desmarcando um estágio, sempre permite
    if (value === false) {
      onChange(stageKey, field, value);
      setErrorMessage(null);
      return;
    }
    
    // Verificar se pode marcar o estágio como concluído (baseado nas regras de sequência)
    if (canCompleteStage(stageIndex, stageKey)) {
      onChange(stageKey, field, value);
      setErrorMessage(null);
    } else {
      // Se o projeto estiver cancelado, exibe uma mensagem específica
      if (isProjectCanceled) {
        setErrorMessage("Este projeto foi cancelado. Desmarque a opção 'Projeto Cancelado' para editar as etapas.");
      } else {
        // Caso contrário, exibe a mensagem padrão sobre a sequência de etapas
        const previousStage = PROJECT_STAGES[stageIndex - 1].label;
        setErrorMessage(`Você precisa concluir a etapa "${previousStage}" antes de marcar esta etapa como concluída.`);
      }
    }
  };

  // Renderiza o componente da etapa de cancelamento do projeto
  const renderCancelStage = () => {
    if (!cancelStage) return null;
    
    return (
      <div className={`flex flex-col bg-white rounded-md border ${isProjectCanceled ? 'border-red-500 bg-red-50' : 'border-gray-300'} shadow-sm mt-4`}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
          <input 
            type="checkbox"
            id="stage-projetoCancelado"
            checked={stages.projetoCancelado?.completed || false}
            onChange={(e) => handleStageChange('projetoCancelado', 'completed', e.target.checked)}
            className="h-4 w-4 rounded focus:ring-red-500 text-red-600 cursor-pointer"
          />
          <label htmlFor="stage-projetoCancelado" className={`text-sm font-medium ${isProjectCanceled ? 'text-red-700' : ''}`}>
            <span className="flex items-center gap-1">
              {isProjectCanceled && <XCircle size={16} className="text-red-600" />}
              {cancelStage.label}
            </span>
          </label>
        </div>
        <div className="p-2">
          <input
            type="date"
            value={stages.projetoCancelado?.date || ''}
            onChange={(e) => handleStageChange('projetoCancelado', 'date', e.target.value)}
            className={`w-full text-xs border ${isProjectCanceled ? 'border-red-300' : 'border-gray-300'} rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-red-500`}
            disabled={!stages.projetoCancelado?.completed}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100 border-b border-gray-300 py-3 px-2 sm:px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm sm:text-base md:text-lg font-medium text-gray-700">Etapas do Projeto:</div>
          <div className="flex gap-2">
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
                  className={`flex flex-col bg-white rounded-md border ${isProjectCanceled ? 'opacity-60' : ''} border-gray-300 shadow-sm`}
                >
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
                    <input 
                      type="checkbox"
                      id={`stage-${stage.id}-mobile`}
                      checked={stageData?.completed || false}
                      onChange={(e) => handleStageChange(stageKey, 'completed', e.target.checked)}
                      className={`h-4 w-4 rounded focus:ring-blue-500 ${canComplete ? 'text-blue-600 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                      disabled={(!canComplete && !stageData?.completed) || isProjectCanceled}
                      title={!canComplete && !stageData?.completed ? `Conclua a etapa "${PROJECT_STAGES[index - 1]?.label}" primeiro` : isProjectCanceled ? 'Projeto cancelado' : ''}
                    />
                    <label htmlFor={`stage-${stage.id}-mobile`} className="text-sm font-medium">
                      {stage.label}
                    </label>
                  </div>
                  <div className="p-2">
                    <input
                      type="date"
                      value={stageData?.date || ''}
                      onChange={(e) => handleStageChange(stageKey, 'date', e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={!stageData?.completed || isProjectCanceled}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Mostrar o botão de Projeto Cancelado no final para Mobile */}
          {isExpandedMobile && renderCancelStage()}
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
                  className={`flex flex-col bg-white rounded-md border ${isProjectCanceled ? 'opacity-60' : ''} border-gray-300 shadow-sm`}
                >
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
                    <input 
                      type="checkbox"
                      id={`stage-${stage.id}-desktop`}
                      checked={stageData?.completed || false}
                      onChange={(e) => handleStageChange(stageKey, 'completed', e.target.checked)}
                      className={`h-4 w-4 rounded focus:ring-blue-500 ${canComplete ? 'text-blue-600 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                      disabled={(!canComplete && !stageData?.completed) || isProjectCanceled}
                      title={!canComplete && !stageData?.completed ? `Conclua a etapa "${PROJECT_STAGES[index - 1]?.label}" primeiro` : isProjectCanceled ? 'Projeto cancelado' : ''}
                    />
                    <label htmlFor={`stage-${stage.id}-desktop`} className="text-sm font-medium">
                      {stage.label}
                    </label>
                  </div>
                  <div className="p-2">
                    <input
                      type="date"
                      value={stageData?.date || ''}
                      onChange={(e) => handleStageChange(stageKey, 'date', e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={!stageData?.completed || isProjectCanceled}
                    />
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
                  className={`flex flex-col bg-white rounded-md border ${isProjectCanceled ? 'opacity-60' : ''} border-gray-300 shadow-sm`}
                >
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
                    <input 
                      type="checkbox"
                      id={`stage-${stage.id}-desktop`}
                      checked={stageData?.completed || false}
                      onChange={(e) => handleStageChange(stageKey, 'completed', e.target.checked)}
                      className={`h-4 w-4 rounded focus:ring-blue-500 ${canComplete ? 'text-blue-600 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
                      disabled={(!canComplete && !stageData?.completed) || isProjectCanceled}
                      title={!canComplete && !stageData?.completed ? `Conclua a etapa "${PROJECT_STAGES[globalIndex - 1]?.label}" primeiro` : isProjectCanceled ? 'Projeto cancelado' : ''}
                    />
                    <label htmlFor={`stage-${stage.id}-desktop`} className="text-sm font-medium">
                      {stage.label}
                    </label>
                  </div>
                  <div className="p-2">
                    <input
                      type="date"
                      value={stageData?.date || ''}
                      onChange={(e) => handleStageChange(stageKey, 'date', e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={!stageData?.completed || isProjectCanceled}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Mostrar o botão de Projeto Cancelado no final para Desktop */}
          {isExpandedDesktop && renderCancelStage()}
        </div>
      </div>
    </div>
  );
};