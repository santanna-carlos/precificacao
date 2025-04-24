import React, { useMemo } from "react";

// Tipos de exemplo
type Project = {
  id: string;
  name: string;
  status: "toStart" | "inProgress" | "completed" | "canceled";
  createdAt: string;
  stages: {
    orcamento?: { date: string };
    projetoTecnico?: { date: string };
    instalacao?: { date: string };
  };
  estimatedDelivery?: string; // data prevista de entrega/instalação
  value?: number;
};

type DashboardProps = {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onShowKanban: () => void;
};

const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onSelectProject,
  onShowKanban,
}) => {
  // 1. Resumo de Atividades
  const statusCount = useMemo(() => ({
    toStart: projects.filter(p => p.status === "toStart").length,
    inProgress: projects.filter(p => p.status === "inProgress").length,
    completed: projects.filter(p => p.status === "completed").length,
    canceled: projects.filter(p => p.status === "canceled").length,
  }), [projects]);

  // Entregas nos próximos 7 dias
  const now = new Date();
  const sevenDays = new Date(now);
  sevenDays.setDate(now.getDate() + 7);

  const upcomingDeliveries = projects.filter(
    p =>
      p.status === "inProgress" &&
      p.estimatedDelivery &&
      new Date(p.estimatedDelivery) >= now &&
      new Date(p.estimatedDelivery) <= sevenDays
  );

  // 2. Últimos 10 projetos e métricas
  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [projects]
  );
  const recentProjects = sortedProjects.slice(0, 10);

  // Tempo médio de conversão e produção, taxa de conversão
  const conversionTimes: number[] = [];
  const productionTimes: number[] = [];
  let totalBudgets = 0;
  let convertedBudgets = 0;

  projects.forEach((p) => {
    if (p.stages.orcamento && p.stages.projetoTecnico) {
      const start = new Date(p.stages.orcamento.date);
      const end = new Date(p.stages.projetoTecnico.date);
      conversionTimes.push((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      convertedBudgets++;
    }
    if (p.stages.projetoTecnico && p.stages.instalacao) {
      const start = new Date(p.stages.projetoTecnico.date);
      const end = new Date(p.stages.instalacao.date);
      productionTimes.push((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    if (p.stages.orcamento) totalBudgets++;
  });

  const avgConversion =
    conversionTimes.length > 0
      ? (conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length).toFixed(1)
      : "-";
  const avgProduction =
    productionTimes.length > 0
      ? (productionTimes.reduce((a, b) => a + b, 0) / productionTimes.length).toFixed(1)
      : "-";
  const conversionRate =
    totalBudgets > 0 ? ((convertedBudgets / totalBudgets) * 100).toFixed(1) + "%" : "-";

  // 3. Resumo Financeiro
  const totalInProgress = projects
    .filter((p) => p.status === "inProgress" && p.value)
    .reduce((sum, p) => sum + (p.value || 0), 0);

  // 4. Próximas Entregas (mini calendário e lista)
  const deliveriesThisMonth = projects.filter(
    (p) =>
      p.estimatedDelivery &&
      new Date(p.estimatedDelivery).getMonth() === now.getMonth() &&
      new Date(p.estimatedDelivery).getFullYear() === now.getFullYear()
  );

  const nextDeliveries = sortedProjects
    .filter((p) => p.estimatedDelivery && new Date(p.estimatedDelivery) >= now)
    .sort((a, b) =>
      new Date(a.estimatedDelivery!).getTime() - new Date(b.estimatedDelivery!).getTime()
    )
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 p-6">
      {/* 1. Resumo de Atividades */}
      <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
        <h2 className="font-bold text-lg mb-2">Resumo de Atividades</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 text-center">
            <div className="text-gray-600 text-sm">A iniciar</div>
            <div className="font-bold text-2xl">{statusCount.toStart}</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gray-600 text-sm">Em andamento</div>
            <div className="font-bold text-2xl">{statusCount.inProgress}</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gray-600 text-sm">Concluídos</div>
            <div className="font-bold text-2xl">{statusCount.completed}</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-gray-600 text-sm">Cancelados</div>
            <div className="font-bold text-2xl">{statusCount.canceled}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <span className="text-sm">Entregas nos próximos 7 dias: <b>{upcomingDeliveries.length}</b></span>
        </div>
      </div>

      {/* 2. Últimos Projetos e Métricas */}
      <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-lg">Projetos Recentes</h2>
          <button onClick={onShowKanban} className="text-blue-600 hover:underline text-sm">Ver Kanban</button>
        </div>
        <ul className="flex flex-col gap-1">
          {recentProjects.map((p) => (
            <li
              key={p.id}
              className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-2"
              onClick={() => onSelectProject(p.id)}
            >
              <span className={`w-2 h-2 rounded-full ${
                p.status === "toStart"
                  ? "bg-amber-400"
                  : p.status === "inProgress"
                  ? "bg-blue-500"
                  : p.status === "completed"
                  ? "bg-green-500"
                  : "bg-gray-400"
              }`} />
              <span className="flex-1 truncate">{p.name}</span>
              <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 text-xs text-gray-700">
          Tempo médio de conversão: <b>{avgConversion} dias</b><br />
          Tempo médio de produção: <b>{avgProduction} dias</b><br />
          Taxa de conversão: <b>{conversionRate}</b>
        </div>
      </div>

      {/* 3. Resumo Financeiro */}
      <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
        <h2 className="font-bold text-lg mb-2">Resumo Financeiro</h2>
        <div className="text-gray-600 text-sm mb-1">Valor total em andamento:</div>
        <div className="font-bold text-2xl text-green-700">
          {totalInProgress.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
      </div>

      {/* 4. Próximas Entregas */}
      <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
        <h2 className="font-bold text-lg mb-2">Próximas Entregas</h2>
        {/* Mini calendário mensal */}
        <div className="mb-2">
          <div className="text-xs text-gray-700 mb-1">Dias marcados: {deliveriesThisMonth.map(p => new Date(p.estimatedDelivery!).getDate()).join(", ")}</div>
          {/* Aqui pode usar um calendário real, como react-calendar, se quiser */}
        </div>
        <ul className="flex flex-col gap-1">
          {nextDeliveries.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{new Date(p.estimatedDelivery!).toLocaleDateString()}</span>
              <span className="flex-1 truncate">{p.name}</span>
              <span className={`text-xs px-2 rounded ${
                new Date(p.estimatedDelivery!) >= now ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {new Date(p.estimatedDelivery!) >= now ? "No prazo" : "Atrasado"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;