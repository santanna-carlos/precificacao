import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Check, Loader2, Calendar, X, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { ProjectStages, PROJECT_STAGES, CANCELLATION_REASONS, Project } from '../types';
import { supabase } from '../supabase';
import { Link as LinkIcon } from 'lucide-react';
import { getTrackingLink } from "../utils/tracking";


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
  // 1. Todos os hooks useState no início do componente
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);
  const [isExpandedDesktop, setIsExpandedDesktop] = useState(true); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  // Inicializar sempre com string vazia para evitar undefined
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStageId, setLoadingStageId] = useState<string | null>(null);
  // Novo estado para controlar a exibição do calendário personalizado (apenas para data prevista)
  const [showDeliveryCalendar, setShowDeliveryCalendar] = useState(false);
  // Estado para armazenar datas com entregas já agendadas
  const [deliveryDates, setDeliveryDates] = useState<string[]>([]);
  // Referência para o elemento do calendário
  const calendarRef = useRef<HTMLDivElement>(null);
  // Estado para controlar o mês e ano exibidos no calendário
  const [currentViewDate, setCurrentViewDate] = useState(() => new Date());
  // Novo estado para armazenar projetos em andamento
  const [inProgressProjects, setInProgressProjects] = useState<Project[]>([]);

  // 2. Todos os useEffect juntos, após todos os useState
  // Sincronizar com propEstimatedCompletionDate
  useEffect(() => {
    // Sempre atualizar o estado, sem condicionais
    setEstimatedCompletionDate(propEstimatedCompletionDate || '');
  }, [propEstimatedCompletionDate]);

  // Carregar dados do localStorage quando o projectId mudar
  useEffect(() => {
    if (!projectId) return;
    
    // Não carregar do localStorage se já temos um valor da prop
    if (propEstimatedCompletionDate) return;
    
    try {
      const cachedProjects = JSON.parse(localStorage.getItem('cachedProjects') || '[]');
      const projectFromStorage = cachedProjects.find((p: any) => p.id === projectId);
      
      if (projectFromStorage?.estimatedCompletionDate && 
          typeof projectFromStorage.estimatedCompletionDate === 'string') {
        setEstimatedCompletionDate(projectFromStorage.estimatedCompletionDate);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
    }
  }, [projectId, propEstimatedCompletionDate]);

  // Novo useEffect para buscar datas de entrega de outros projetos
  useEffect(() => {
    const fetchDeliveryDates = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, estimated_completion_date')
          .not('id', 'eq', projectId) // Excluir o projeto atual
          .not('estimated_completion_date', 'is', null) // Apenas projetos com data de entrega
          .order('estimated_completion_date', { ascending: true });
        
        if (error) {
          console.error('Erro ao buscar datas de entrega:', error);
          return;
        }
        
        // Extrair apenas as datas
        const dates = data
          .filter(project => project.estimated_completion_date)
          .map(project => project.estimated_completion_date);
        
        // Remover duplicatas
        const uniqueDates = [...new Set(dates)];
        setDeliveryDates(uniqueDates);
        
      } catch (err) {
        console.error('Erro ao buscar datas de entrega:', err);
      }
    };
    
    fetchDeliveryDates();
  }, [projectId]);

  // Novo useEffect para buscar projetos em andamento
  useEffect(() => {
    const fetchInProgressProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, client_name, estimated_completion_date, stages')
          .not('id', 'eq', projectId) // Excluir o projeto atual
          .not('estimated_completion_date', 'is', null); // Apenas projetos com data de entrega
        
        if (error) {
          console.error('Erro ao buscar projetos em andamento:', error);
          return;
        }
        
        // Filtrar apenas projetos em andamento
        const filteredProjects = data.filter(project => {
          // Verificar se o projeto está cancelado
          if (project.stages?.projetoCancelado?.completed) {
            return false;
          }
          
          // Verificar se o projeto foi concluído (instalação completa)
          if (project.stages?.instalacao?.completed) {
            return false;
          }
          
          // Verificar se o projeto está em andamento (não apenas orçamento)
          const hasAnyNonOrcamentoStageCompleted = Object.entries(project.stages || {}).some(
            ([key, stage]) => key !== 'orcamento' && stage.completed
          );
          
          return hasAnyNonOrcamentoStageCompleted;
        });
        
        // Mapear para o formato de Project
        const formattedProjects = filteredProjects.map(project => ({
          id: project.id,
          name: project.name || '',
          clientName: project.client_name || '',
          estimatedCompletionDate: project.estimated_completion_date,
          stages: project.stages
        }));
        
        setInProgressProjects(formattedProjects);
        
      } catch (err) {
        console.error('Erro ao buscar projetos em andamento:', err);
      }
    };
    
    fetchInProgressProjects();
  }, [projectId]);

  // Fechar o calendário ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowDeliveryCalendar(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 3. Valores derivados e funções após todos os hooks
  const regularStages = PROJECT_STAGES.filter(stage => stage.id !== 'projetoCancelado');
  const cancelStage = PROJECT_STAGES.find(stage => stage.id === 'projetoCancelado');
  
  const firstRowStages = regularStages.slice(0, 5);
  const secondRowStages = regularStages.slice(5);

  const isProjectCanceled = stages.projetoCancelado?.completed || false;
  const isProjectCompleted = stages.instalacao?.completed || false;
  const isProjectTechnicalCompleted = stages.projetoTecnico?.completed || false;

  // 4. Definir funções de manipulação de eventos
  const toggleExpandMobile = () => {
    setIsExpandedMobile(!isExpandedMobile);
  };

  const toggleExpandDesktop = () => {
    setIsExpandedDesktop(!isExpandedDesktop);
  };

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

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    console.log('Nova data selecionada:', newDate);
    setEstimatedCompletionDate(newDate);
    
    if (onUpdateProject && projectId) {
      console.log('Atualizando data prevista no Supabase e localStorage');
      
      try {
        // Converter string vazia para null para evitar erro no PostgreSQL
        const valueToSend = newDate === "" ? null : newDate;
        
        // Atualização direta no Supabase - enviar null quando a data estiver vazia
        const { data, error } = await supabase
          .from('projects')
          .update({ estimated_completion_date: valueToSend })
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

  // Função para lidar com a seleção de data no calendário personalizado
  const handleDeliveryDateSelect = (date: string) => {
    setEstimatedCompletionDate(date);
    setShowDeliveryCalendar(false);
    
    if (onUpdateProject && projectId) {
      // Usar a mesma lógica de atualização do handleDateChange
      const valueToSend = date === "" ? null : date;
      
      supabase
        .from('projects')
        .update({ estimated_completion_date: valueToSend })
        .eq('id', projectId)
        .select()
        .then(({ data, error }) => {
          if (error) {
            console.error('Erro ao atualizar data prevista no Supabase:', error);
            setErrorMessage('Erro ao atualizar data prevista. Por favor, tente novamente.');
          } else {
            console.log('Data prevista atualizada com sucesso no Supabase:', data);
            
            // Atualizar também no localStorage para garantir consistência
            const cachedProjects = JSON.parse(localStorage.getItem('cachedProjects') || '[]');
            const updatedProjects = cachedProjects.map((p: any) => 
              p.id === projectId 
                ? { ...p, estimatedCompletionDate: date, lastModified: new Date().toISOString() } 
                : p
            );
            localStorage.setItem('cachedProjects', JSON.stringify(updatedProjects));
            
            // Chamar o método original para atualizar o estado React
            onUpdateProject(projectId, 'estimatedCompletionDate', date);
          }
        })
        .catch(err => {
          console.error('Erro ao atualizar data prevista:', err);
          setErrorMessage('Erro ao atualizar data prevista. Por favor, tente novamente.');
        });
    }
  };

  const openDatePicker = (e: React.MouseEvent<HTMLInputElement>) => {
    // Verificar se o elemento não está desabilitado antes de chamar showPicker
    if (!e.currentTarget.disabled) {
      // Em vez de abrir o calendário nativo, mostrar nosso calendário personalizado
      e.preventDefault();
      setShowDeliveryCalendar(true);
    }
  };

  // Função para impedir a digitação direta, permitindo apenas a navegação e a seleção
  const preventDirectTyping = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir teclas de navegação (setas, tab, etc) e teclas de atalho (Ctrl+C, etc)
    const allowedKeys = ['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape'];
    const isCtrlKey = e.ctrlKey || e.metaKey;
    
    // Se não for uma tecla permitida e não for um atalho, prevenir a ação padrão
    if (!allowedKeys.includes(e.key) && !isCtrlKey) {
      e.preventDefault();
    }
  };

  // Função para renderizar o calendário de datas de entrega
  const renderDeliveryCalendar = () => {
    if (!showDeliveryCalendar) return null;
    
    const currentYear = currentViewDate.getFullYear();
    const currentMonth = currentViewDate.getMonth();
    
    // Criar um array com os dias do mês atual
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    // Ajustar para que a semana comece na segunda (1) em vez de domingo (0)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const days = [];
    
    // Adicionar células vazias para os dias antes do primeiro dia do mês
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }
    
    // Adicionar os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      // Verificar se esta data já tem entregas agendadas
      const hasDelivery = deliveryDates.includes(dateString);
      
      // Verificar se é a data selecionada
      const isSelected = dateString === estimatedCompletionDate;
      
      days.push(
        <div 
          key={`day-${day}`}
          onClick={() => handleDeliveryDateSelect(dateString)}
          className={`
            relative h-10 w-10 flex items-center justify-center rounded-full cursor-pointer text-sm
            ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-blue-100'}
            ${hasDelivery ? 'border-2 border-red-500' : ''}
          `}
          title={hasDelivery ? 'Já existe entrega agendada nesta data' : ''}
        >
          {day}
          {hasDelivery && (
            <span className=""></span>
          )}
        </div>
      );
    }
    
    // Formatar o nome do mês e ano
    const monthYearString = new Intl.DateTimeFormat('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    }).format(currentViewDate);
    
    // Função para obter a data local sem deslocamento de fuso horário
    const getLocalDate = (dateString: string): Date => {
      if (!dateString) return new Date();
      
      // Extrair ano, mês e dia diretamente da string de data (formato YYYY-MM-DD)
      const [year, month, day] = dateString.split('-').map(Number);
      
      // Criar data no fuso horário local usando os componentes extraídos
      return new Date(year, month - 1, day);
    };
    
    // Filtrar projetos para o mês atual
    const projectsForCurrentMonth = inProgressProjects.filter(project => {
      if (!project.estimatedCompletionDate) return false;
      
      const projectDate = getLocalDate(project.estimatedCompletionDate);
      return projectDate.getMonth() === currentMonth && projectDate.getFullYear() === currentYear;
    });
    
    return (
      <>
        {/* Overlay de fundo esmaecido */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={() => setShowDeliveryCalendar(false)}
        >
          {/* Calendário centralizado */}
          <div 
            ref={calendarRef}
            className="bg-white shadow-lg rounded-md p-6 z-50 border border-gray-200 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()} // Evitar que cliques no calendário fechem o modal
          >
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={prevMonth}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Mês anterior"
              >
                <ChevronLeft size={20} />
              </button>
              
              <h3 className="text-lg font-medium capitalize">
                {monthYearString}
              </h3>
              
              <button 
                onClick={nextMonth}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Próximo mês"
              >
                <ChevronRight size={20} />
              </button>
              
              <button 
                onClick={() => setShowDeliveryCalendar(false)}
                className="ml-2 text-gray-500 hover:text-gray-700"
                aria-label="Fechar calendário"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-3">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="text-sm text-center font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {days}
            </div>
            
            {/* Lista de projetos em andamento para o mês atual */}
            {projectsForCurrentMonth.length > 0 && (
              <div className="mt-5 border-t pt-4 border-gray-200">
                <div className="flex items-center mb-2">
                  <span className="inline-block h-4 w-4 border-2 border-red-500 rounded-full mr-2"></span>
                  <h4 className="text-sm font-medium">Entrega(s) agendada(s) para {monthYearString}</h4>
                </div>
                <div className="max-h-40 overflow-y-auto pr-1">
                  {projectsForCurrentMonth.map(project => {
                    // Extrair o dia da data prevista usando a função corrigida
                    const projectDate = getLocalDate(project.estimatedCompletionDate || '');
                    const day = projectDate.getDate();
                    
                    return (
                      <div 
                        key={project.id} 
                        className="text-xs p-2 mb-1 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100"
                      >
                        <div className="font-medium">{project.clientName} - {project.name}</div>
                        <div className="text-gray-500 flex items-center mt-1">
                          <Calendar size={12} className="mr-1" />
                          Entrega: Dia {day}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // Função para avançar para o próximo mês no calendário
  const nextMonth = () => {
    const newDate = new Date(currentViewDate);
    newDate.setMonth(currentViewDate.getMonth() + 1);
    setCurrentViewDate(newDate);
  };
  
  // Função para voltar para o mês anterior no calendário
  const prevMonth = () => {
    const newDate = new Date(currentViewDate);
    newDate.setMonth(currentViewDate.getMonth() - 1);
    setCurrentViewDate(newDate);
  };

  // 5. Renderização - sem condicionais que possam afetar a estrutura dos componentes
  return (
    <div className="bg-gray-100 border-gray-300 py-3 px-2 sm:px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-2">
          <div className="text-base sm:text-base md:text-xl font-medium text-gray-900 ml-1">Etapas do Projeto:</div>
          <div className="flex gap-2 mr-1">
            {/* Renderizar sempre o container, mas controlar a visibilidade via CSS */}
            <div 
              className="flex items-center gap-2" 
              style={{ 
                visibility: isProjectTechnicalCompleted && !isProjectCanceled ? 'visible' : 'hidden',
                display: isProjectTechnicalCompleted && !isProjectCanceled ? 'flex' : 'none'
              }}
            >
              <div className="flex items-center bg-gray-50 p-1 rounded-md border border-gray-200">
                <label htmlFor={`estimatedDate-${projectId}`} className="text-xs text-gray-600 mr-2 ml-1 whitespace-nowrap hidden sm:inline">
                  Data prevista:
                </label>
                <div className="relative">
                  <div className="flex items-center">
                    <input
                      type="text" 
                      id={`estimatedDate-${projectId}`}
                      value={estimatedCompletionDate}
                      readOnly // Tornar somente leitura para forçar uso do calendário personalizado
                      placeholder="AAAA-MM-DD"
                      className="text-xs border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
                      onClick={() => setShowDeliveryCalendar(true)}
                      disabled={!isProjectTechnicalCompleted || isProjectCanceled}
                    />
                    <button 
                      className="ml-1 text-gray-500 hover:text-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeliveryCalendar(!showDeliveryCalendar);
                      }}
                      disabled={!isProjectTechnicalCompleted || isProjectCanceled}
                      aria-label="Abrir calendário personalizado"
                    >
                      <Calendar size={16} />
                    </button>
                  </div>
                  {renderDeliveryCalendar()}
                </div>
              </div>
              {estimatedCompletionDate && (
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-2 rounded hover:bg-blue-100 transition"
                    title="Copiar link de acompanhamento"
                    onClick={() => {
                      const baseUrl = "https://app.useoffi.com/tracking/";
                      const link = `${baseUrl}${encodeURIComponent(projectId)}`;
                      navigator.clipboard.writeText(link);
                      // Aqui você pode exibir um feedback visual se desejar
                      alert("Link de acompanhamento copiado!");
                    }}
                  >
                    <LinkIcon size={18} className="text-blue-600" />
                  </button>
                </div>
              )}
            </div>
            
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
                      disabled={isProjectCanceled}
                      onClick={openDatePicker}
                      onKeyDown={preventDirectTyping}
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
                    disabled={isProjectCanceled ? false : true}
                    onClick={openDatePicker}
                    onKeyDown={preventDirectTyping}
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
                      disabled={isProjectCanceled}
                      onClick={openDatePicker}
                      onKeyDown={preventDirectTyping}
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
                      disabled={isProjectCanceled}
                      onClick={openDatePicker}
                      onKeyDown={preventDirectTyping}
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
                    disabled={isProjectCanceled ? false : true}
                    onClick={openDatePicker}
                    onKeyDown={preventDirectTyping}
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