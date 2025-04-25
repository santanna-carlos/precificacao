import React, { useState, useEffect, useMemo } from "react";

console.log("Renderizando Dashboard")


// Tipos esperados
type Project = {
  id: string;
  name: string;
  clientName?: string;
  status: "toStart" | "inProgress" | "completed" | "canceled";
  createdAt: string; // ISO string
  estimatedCompletionDate?: string; // Data prevista para finalização do projeto
  salePrice?: number; // Valor total do projeto
  date?: string;
  stages: {
    orcamento?: { date: string; completed?: boolean };
    projetoTecnico?: { date: string; completed?: boolean };
    instalacao?: { date: string; completed?: boolean; realCost?: number };
    projetoCancelado?: { date: string; completed?: boolean; cancellationReason?: string };
  };
  totalCost?: number;
  priceType?: string;
  materials?: {
    quantity: string | number;
    unitValue: string | number;
  }[];
  frozenDailyCost?: number;
  fixedExpenseDays?: number;
  fixedExpenses?: {
    total: number;
  }[];
  totalFixedExpenses?: number;
  totalVariableExpenses?: number;
  variableExpenses?: {
    total: number;
  }[];
  totalMaterialCost?: number;
};

type DashboardProps = {
  onSelectProject: (id: string) => void;
  onShowKanban: () => void;
};

// Função para determinar o status do projeto baseado nos estágios (mesma lógica do ProjectsKanban)
function getProjectStatus(project: Project): 'toStart' | 'inProgress' | 'completed' | 'canceled' {
  // Verificar primeiro se o projeto foi cancelado
  if (project.stages?.projetoCancelado?.completed) {
    return 'canceled';
  }
  
  // Verificar se o projeto foi instalado (agora considerado como concluído)
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
}

function getUpcomingDeliveries(projects: Project[]) {
  // Usar o formato de data local YYYY-MM-DD para comparação
  const today = new Date().toISOString().split('T')[0];
  
  // Calcular data uma semana à frente sem usar setDate
  const weekFromNowDate = new Date();
  weekFromNowDate.setDate(weekFromNowDate.getDate() + 7);
  const weekFromNow = weekFromNowDate.toISOString().split('T')[0];
  
  console.log('Filtrando projetos por data (hoje):', today);
  console.log('Filtrando projetos por data (uma semana):', weekFromNow);
  
  return projects.filter(
    p => {
      // Verificar se o projeto está em andamento e tem data estimada
      const isInProgress = getProjectStatus(p) === "inProgress";
      const hasDate = !!p.estimatedCompletionDate;
      
      // Comparar strings de data diretamente (YYYY-MM-DD)
      const isAfterToday = hasDate && p.estimatedCompletionDate! >= today;
      const isBeforeWeekFromNow = hasDate && p.estimatedCompletionDate! <= weekFromNow;
      
      // Log para diagnóstico
      if (hasDate && isInProgress) {
        console.log('Projeto em andamento:', p.id, p.name);
        console.log('Data estimada:', p.estimatedCompletionDate);
        console.log('É após hoje?', isAfterToday);
        console.log('É antes de uma semana?', isBeforeWeekFromNow);
      }
      
      return isInProgress && hasDate && isAfterToday && isBeforeWeekFromNow;
    }
  );
}

function getRecentProjects(projects: Project[]) {
  return [...projects]
    .sort((a, b) => {
      // Usar a data do orçamento (date) para ordenação
      const dateA = a.date || '';
      const dateB = b.date || '';
      // Ordenar em ordem decrescente (do mais recente para o mais antigo)
      return dateB.localeCompare(dateA);
    })
    .slice(0, 10);
}

function getDateOnly(dateString: string) {
  const date = new Date(dateString);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getAvgConversionTime(projects: Project[]) {
  // Filtrar projetos que têm data de criação, data de projeto técnico, e estão concluídos
  const converted = projects.filter(
    p => p.date && 
         p.stages?.projetoTecnico?.date && 
         getProjectStatus(p) === 'completed'
  );
  
  if (!converted.length) return 0;
  
  let validCount = 0;
  const sum = converted.reduce((acc, p) => {
    const rawStart = p.date!;
    const rawEnd = p.stages.projetoTecnico!.date;
    
    // Usar apenas a data, ignorando hora/timezone
    const start = getDateOnly(rawStart);
    const end = getDateOnly(rawEnd);
    
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    // Log detalhado para diagnóstico de timezone
    console.log(
      `Projeto ${p.id || ''}: rawStart=${rawStart}, rawEnd=${rawEnd}, start=${start.toISOString()}, end=${end.toISOString()}, diffDays=${diffDays}`
    );
    
    // Verificar se as datas estão em ordem cronológica correta
    if (diffMs >= 0) {
      validCount++;
      return acc + diffDays;
    }
    // Logar projetos inconsistentes
    console.warn(`Projeto concluído com datas inconsistentes: Projeto Técnico (${rawEnd}) é anterior à criação do orçamento (${rawStart})`);
    return acc;
  }, 0);
  return validCount > 0 ? Math.round(sum / validCount) : 0;
}

function getAvgProductionTime(projects: Project[]) {
  // Filtrar projetos que têm ambas as datas necessárias e estão concluídos
  const produced = projects.filter(
    p => p.stages?.projetoTecnico?.date && 
         p.stages?.instalacao?.date && 
         getProjectStatus(p) === 'completed'
  );
  
  if (!produced.length) return 0;
  
  let validCount = 0;
  const sum = produced.reduce((acc, p) => {
    const rawStart = p.stages.projetoTecnico!.date;
    const rawEnd = p.stages.instalacao!.date;
    
    // Usar apenas a data, ignorando hora/timezone
    const start = getDateOnly(rawStart);
    const end = getDateOnly(rawEnd);
    
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    // Log detalhado para diagnóstico de timezone
    console.log(
      `Projeto ${p.id || ''}: rawStart=${rawStart}, rawEnd=${rawEnd}, start=${start.toISOString()}, end=${end.toISOString()}, diffDays=${diffDays}`
    );
    
    // Verificar se as datas estão em ordem cronológica correta
    if (diffMs >= 0) {
      validCount++;
      return acc + diffDays;
    }
    // Logar projetos inconsistentes
    console.warn(`Projeto concluído com datas inconsistentes: Instalação (${rawEnd}) é anterior ao Projeto Técnico (${rawStart})`);
    return acc;
  }, 0);
  return validCount > 0 ? Math.round(sum / validCount) : 0;
}

function getConversionRate(projects: Project[]) {
  // Calcular todos os projetos que não estão na fase "A iniciar"
  const nonStartingProjects = projects.filter(p => 
    getProjectStatus(p) === 'inProgress' || 
    getProjectStatus(p) === 'completed' || 
    getProjectStatus(p) === 'canceled'
  );
  
  // Se não houver projetos, retornar 0
  if (!nonStartingProjects.length) return 0;
  
  // Calcular quantos projetos estão "Concluídos"
  const completedProjects = projects.filter(p => getProjectStatus(p) === 'completed');
  
  // Calcular a taxa: (concluídos / (em andamento + concluídos + cancelados)) * 100
  return Math.round((completedProjects.length / nonStartingProjects.length) * 100);
}

function getTotalInProgressValue(projects: Project[]) {
  return projects
    .filter(p => getProjectStatus(p) === "inProgress")
    .reduce((sum, p) => sum + (p.salePrice || 0), 0);
}

function getDeliveryDays(projects: Project[], month: number, year: number) {
  return projects
    .filter(
      p =>
        p.estimatedCompletionDate &&
        new Date(p.estimatedCompletionDate).getMonth() === month &&
        new Date(p.estimatedCompletionDate).getFullYear() === year
    )
    .map(p => new Date(p.estimatedCompletionDate!).getDate());
}

export default function Dashboard({
  onSelectProject,
  onShowKanban,
}: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar projetos do localStorage (mesma fonte que o ProjectsKanban usa)
    const cachedProjects = localStorage.getItem('cachedProjects');
    if (cachedProjects) {
      try {
        const parsedProjects = JSON.parse(cachedProjects);
        setProjects(parsedProjects);
      } catch (err) {
        console.error("Erro ao processar projetos do localStorage:", err);
      }
    }
    setLoading(false);
  }, []);

  // Agrupar projetos por status usando a mesma lógica do ProjectsKanban
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

  // Calcular contagens de status
  const statusCounts = useMemo(() => ({
    toStart: groupedProjects.toStart.length,
    inProgress: groupedProjects.inProgress.length,
    completed: groupedProjects.completed.length,
    canceled: groupedProjects.canceled.length
  }), [groupedProjects]);

  const upcomingDeliveries = useMemo(() => getUpcomingDeliveries(projects), [projects]);
  const recentProjects = useMemo(() => getRecentProjects(projects), [projects]);
  const avgConversion = useMemo(() => getAvgConversionTime(projects), [projects]);
  const avgProduction = useMemo(() => getAvgProductionTime(projects), [projects]);
  const conversionRate = useMemo(() => getConversionRate(projects), [projects]);
  const totalInProgressValue = useMemo(() => getTotalInProgressValue(projects), [projects]);

  // Nova métrica: quantidade de projetos com diferença de custo (ignorando realCost 0)
  const qtdProjetosComDiferenca = useMemo(() => {
    return projects.filter(p => {
      const realCost = p.stages?.instalacao?.realCost;
      return realCost !== undefined && realCost !== 0 && realCost !== p.totalCost;
    }).length;
  }, [projects]);

  // Mini calendário (exemplo para o mês atual)
  const now = new Date();
  const daysWithDelivery = useMemo(() => 
    getDeliveryDays(projects, now.getMonth(), now.getFullYear()), 
    [projects, now]
  );

  if (loading && projects.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4">
      {/* Cabeçalho com título */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          Dashboard
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Box 1: Resumo de Atividades */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-md p-5 flex flex-col gap-3">
          <h2 className="font-bold text-lg mb-2">Resumo de Projetos</h2>
          <div className="flex flex-col gap-2">
            <div className="bg-yellow-100 text-yellow-800 rounded px-3 py-2 flex justify-between items-center">
              <span>A iniciar</span>
              <span className="font-bold">{statusCounts.toStart}</span>
            </div>
            <div className="bg-blue-100 text-blue-800 rounded px-3 py-2 flex justify-between items-center">
              <span>Em andamento</span>
              <span className="font-bold">{statusCounts.inProgress}</span>
            </div>
            <div className="bg-green-100 text-green-800 rounded px-3 py-2 flex justify-between items-center">
              <span>Concluídos</span>
              <span className="font-bold">{statusCounts.completed}</span>
            </div>
            <div className="bg-red-100 text-red-800 rounded px-3 py-2 flex justify-between items-center">
              <span>Cancelados</span>
              <span className="font-bold">{statusCounts.canceled}</span>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="text-sm bg-blue-50 p-3 rounded">
              <div className="font-bold mb-2">Próximas Entregas:</div>
              {groupedProjects.inProgress.length > 0 ? (
                <ul className="divide-y divide-blue-100">
                  {groupedProjects.inProgress
                    .filter(p => p.estimatedCompletionDate)
                    .sort((a, b) => a.estimatedCompletionDate!.localeCompare(b.estimatedCompletionDate!))
                    .map(project => {
                      // Pegar a data atual em formato YYYY-MM-DD
                      const today = new Date().toISOString().split('T')[0];
                      // Verificar se a data prevista já passou (comparação de strings)
                      const isLate = project.estimatedCompletionDate! < today;
                      // Formatar a data para exibição DD/MM/YYYY
                      const dateParts = project.estimatedCompletionDate!.split('-');
                      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                      
                      return (
                        <li 
                          key={project.id} 
                          className="py-2 flex justify-between items-center cursor-pointer hover:bg-blue-100/50 rounded px-2"
                          onClick={() => onSelectProject(project.id)}
                        >
                          <span className="truncate max-w-[70%]">
                            {project.clientName ? `${project.clientName} - ` : ''}{project.name}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            isLate
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {formattedDate}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Nenhum projeto em andamento com data prevista.</p>
              )}
            </div>
          </div>
          
          {/* Métricas de tempo e conversão - agora mostradas abaixo das entregas */}
          <div className="mt-3 flex flex-col gap-1 text-sm p-3 border rounded border-gray-200 bg-gray-50">
            <div className="text-base font-bold mb-1 text-gray-900">Métricas:</div>
            <div>
              <b className="text-gray-600">Tempo médio de conversão:</b> {avgConversion} dias
            </div>
            <div>
              <b className="text-gray-600">Tempo médio de produção:</b> {avgProduction} dias
            </div>
            <div>
              <b className="text-gray-600">Taxa de conversão:</b> {conversionRate}%
            </div>
            <div>
              <b className="text-gray-600">Qtd. de projetos com diferença:</b> {qtdProjetosComDiferenca}
            </div>
          </div>
          
        </div>

        {/* Box 2: Últimos Projetos e Indicadores */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-md p-5 flex flex-col gap-3">
          <h2 className="font-bold text-lg mb-4">Últimos Projetos Cadastrados</h2>
          <ul className="divide-y">
            {recentProjects.map((p) => {
              // Formatar a data do orçamento para DD/MM/YYYY
              const dateParts = p.date?.split('-') || [];
              const formattedDate = dateParts.length === 3 
                ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`
                : 'Data não disponível';
                
              return (
                <li
                  key={p.id}
                  className="py-2 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                  onClick={() => onSelectProject(p.id)}
                >
                  <div className="flex flex-col">
                    <span className="text-xs">
                      {p.clientName ? `${p.clientName} - ` : ''}{p.name}
                    </span>
                    <span className={`text-xs mt-1 px-2 py-0.5 rounded inline-block w-fit ${
                      getProjectStatus(p) === "toStart"
                        ? "bg-yellow-100 text-yellow-800" // A iniciar - amarelo
                        : getProjectStatus(p) === "inProgress"
                        ? "bg-blue-100 text-blue-800" // Em andamento - azul
                        : getProjectStatus(p) === "completed"
                        ? "bg-green-100 text-green-800" // Concluído - verde
                        : "bg-red-100 text-red-800" // Cancelado - vermelho
                    }`}>
                      {getProjectStatus(p) === "toStart"
                        ? "A iniciar"
                        : getProjectStatus(p) === "inProgress"
                        ? "Em andamento"
                        : getProjectStatus(p) === "completed"
                        ? "Concluído"
                        : "Cancelado"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">
                    {formattedDate}
                  </span>
                </li>
              );
            })}
          </ul>
          <button
            className="mt-2 bg-blue-600 text-white rounded px-3 py-1 text-sm"
            onClick={onShowKanban}
          >
            Ver Kanban
          </button>
        </div>

        {/* Box 3: Resumo Financeiro */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-md p-5 flex flex-col gap-3">
          <h2 className="font-bold text-lg mb-4">Resumo Financeiro</h2>
          <div className="flex flex-col items-center justify-center py-4 gap-6">
            {/* Valor total de Projetos em Andamento */}
            <div className="flex flex-col items-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Valor total de Projetos em Andamento</div>
              <div className="text-2xl md:text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                R$ {totalInProgressValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Total de {groupedProjects.inProgress.length} projeto{groupedProjects.inProgress.length !== 1 ? 's' : ''} em andamento
              </div>
            </div>
            <hr className="w-full border-t border-gray-200" />
            {(() => {
              const currentYear = new Date().getFullYear();
              const completedThisYear = groupedProjects.completed.filter(p => {
                const installDate = p.stages?.instalacao?.date;
                return installDate && new Date(installDate).getFullYear() === currentYear;
              });
              // Função auxiliar para obter o preço correto do projeto (copiado do FinancialSummary)
              const getProjectPrice = (project: Project) => {
                if (!project.salePrice || !project.totalCost) return 0;
                if (project.priceType === 'markup') {
                  const materialsTotal = project.materials
                    ? project.materials.reduce((sum, material) => {
                        const quantity = typeof material.quantity === 'string' 
                          ? (material.quantity === '' ? 0 : parseFloat(material.quantity)) 
                          : (material.quantity || 0);
                        const unitValue = typeof material.unitValue === 'string'
                          ? (material.unitValue === '' ? 0 : parseFloat(material.unitValue))
                          : (material.unitValue || 0);
                        return sum + quantity * unitValue;
                      }, 0)
                    : 0;
                  const markup = materialsTotal > 0 ? project.salePrice / materialsTotal : 1;
                  return project.totalCost * markup;
                }
                return project.salePrice;
              };
              // Funções auxiliares para custos
              const getFixedExpenses = (project: Project) => {
                if (project.frozenDailyCost && project.fixedExpenseDays) {
                  return project.frozenDailyCost * project.fixedExpenseDays;
                } else if (project.fixedExpenseDays) {
                  const dailyCost = project.fixedExpenses?.reduce((sum, expense) => sum + (expense.total || 0), 0) || 0;
                  return dailyCost * project.fixedExpenseDays;
                } else {
                  return project.totalFixedExpenses || (project.fixedExpenses?.reduce((sum, expense) => sum + (expense.total || 0), 0) || 0);
                }
              };
              const getVariableExpenses = (project: Project) => {
                return project.totalVariableExpenses || (project.variableExpenses?.reduce((sum, expense) => sum + (expense.total || 0), 0) || 0);
              };
              const getMaterials = (project: Project) => {
                return project.totalMaterialCost || (project.materials?.reduce((sum, material) => {
                  const quantity = typeof material.quantity === 'string' 
                    ? (material.quantity === '' ? 0 : parseFloat(material.quantity)) 
                    : (material.quantity || 0);
                  const unitValue = typeof material.unitValue === 'string'
                    ? (material.unitValue === '' ? 0 : parseFloat(material.unitValue))
                    : (material.unitValue || 0);
                  return sum + (quantity * unitValue);
                }, 0) || 0);
              };
              // Lucro total do ano corrente
              const totalProfit = completedThisYear.reduce((sum, p) => {
                const totalRevenue = getProjectPrice(p);
                const fixed = getFixedExpenses(p);
                const variable = getVariableExpenses(p);
                const materials = getMaterials(p);
                return sum + (totalRevenue - (fixed + variable + materials));
              }, 0);
              // Diferença dos custos totais: soma dos valores de realCost dos projetos concluídos no ano corrente (igual FinancialSummary)
              const totalDiff = completedThisYear.reduce((sum, p) => {
                const realCost = p.stages?.instalacao?.realCost;
                return sum + (realCost !== undefined ? Number(realCost) : 0);
              }, 0);
              return (
                <>
                  <div className="flex flex-col items-center">
                    <div className="text-sm font-medium text-gray-600 mb-1">Lucro Total</div>
                    <div className="text-2xl md:text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-700 to-lime-500 bg-clip-text text-transparent">
                      {totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Apenas projetos concluídos em {currentYear}
                    </div>
                  </div>
                  <hr className="w-full border-t border-gray-200 my-2" />
                  <div className="flex flex-col items-center">
                    <div className="text-sm font-medium text-gray-600 mb-1">Diferença da Previsão de Custos</div>
                    <div className="text-2xl md:text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
                      {totalDiff.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                    Apenas projetos concluídos em {currentYear}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}