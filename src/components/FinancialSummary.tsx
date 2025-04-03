import React, { useMemo, useState, useEffect } from 'react';
import { Project, WorkshopSettings } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { DollarSign, TrendingUp, Calendar, BarChart3, ChevronDown } from 'lucide-react';

interface FinancialSummaryProps {
  projects: Project[];
  workshopSettings: WorkshopSettings;
  onBack: () => void;
  onDeleteProject: (projectId: string) => Promise<void>;
}

export function FinancialSummary({ projects, workshopSettings, onBack, onDeleteProject }: FinancialSummaryProps) {
  // Estado para controlar o ano selecionado
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  // Novo estado para controlar a visualização do faturamento (total ou anual)
  const [showAnnualRevenue, setShowAnnualRevenue] = useState(false);
  
  // Obter todos os anos disponíveis nos projetos concluídos
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    // Sempre incluir o ano atual
    years.add(new Date().getFullYear());
    
    projects.forEach(project => {
      // Usar a data de instalação como conclusão do projeto
      if (project.stages?.instalacao?.date) {
        const year = new Date(project.stages.instalacao.date).getFullYear();
        years.add(year);
      }
    });
    
    return Array.from(years).sort((a, b) => b - a); // Ordem decrescente
  }, [projects]);
  
  // Atualizar ano selecionado para o ano atual quando o componente é montado
  useEffect(() => {
    setSelectedYear(new Date().getFullYear());
  }, []);
  
  // Filtrar projetos concluídos (instalação concluída)
  const completedProjects = useMemo(() => {
    console.log("Total de projetos:", projects.length);
    
    const filtered = projects.filter(project => 
      project.stages?.instalacao?.completed
    );
    
    console.log("Projetos concluídos encontrados:", filtered.length);
    return filtered;
  }, [projects]);

  // Calcular o número total de projetos concluídos
  const totalProjects = useMemo(() => {
    return completedProjects.length;
  }, [completedProjects]);

  // Função auxiliar para obter o preço correto do projeto com base no tipo de preço definido em cada projeto
  const getProjectPrice = (project: Project) => {
    // Se o projeto não tiver preço de venda ou custo total, retornar 0
    if (!project.salePrice || !project.totalCost) return 0;
    
    // Usar a mesma lógica que o displayPrice do componente Summary
    // Se o tipo de preço for markup, usar o preço calculado com markup, caso contrário usar o preço de venda normal
    if (project.priceType === 'markup') {
      // Calcular o custo de materiais usando a mesma lógica do App.tsx
      const materialsTotal = project.materials
        ? project.materials.reduce((sum, material) => {
            const quantity = typeof material.quantity === 'string' 
              ? (material.quantity === '' ? 0 : parseFloat(material.quantity)) 
              : (material.quantity || 0);
            const unitValue = typeof material.unitValue === 'string'
              ? (material.unitValue === '' ? 0 : parseFloat(material.unitValue))
              : (material.unitValue || 0);
            const itemTotal = quantity * unitValue;
            console.log(`Material: ${material.type || 'sem nome'}, Quantidade: ${quantity}, Valor unitário: ${unitValue}, Total: ${itemTotal}`);
            return sum + itemTotal;
          }, 0)
        : 0;
      
      // Calcular o markup como a razão entre o preço de venda e o custo de materiais
      const markup = materialsTotal > 0 ? project.salePrice / materialsTotal : 1;
      
      // Calcular o preço com markup como o custo total multiplicado pelo markup
      const markupPrice = project.totalCost * markup;
      
      console.log(`Projeto ${project.name || 'sem nome'}, usando preço com markup:`);
      console.log(`  - Custo total: ${project.totalCost.toFixed(2)}`);
      console.log(`  - Custo materiais: ${materialsTotal.toFixed(2)}`);
      console.log(`  - Preço de venda: ${project.salePrice.toFixed(2)}`);
      console.log(`  - Markup calculado: ${markup.toFixed(2)}`);
      console.log(`  - Preço final com markup: ${markupPrice.toFixed(2)}`);
      
      return markupPrice;
    }
    
    // Se o tipo de preço não for 'markup', retornar o preço de venda normal
    console.log(`Projeto ${project.name || 'sem nome'}, usando preço normal: ${project.salePrice.toFixed(2)}`);
    return project.salePrice;
  };

  // Dados para o gráfico de receita mensal
  const monthlyRevenueData = useMemo(() => {
    // Inicializar todos os meses do ano selecionado com valor zero
    const allMonths: Record<string, number> = {};
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    
    // Preencher com todos os meses do ano selecionado
    monthNames.forEach((name, index) => {
      allMonths[name] = 0;
    });
    
    console.log("Calculando dados de faturamento mensal para", completedProjects.length, "projetos no ano", selectedYear);
    
    completedProjects.forEach(project => {
      // Obter uma data válida de conclusão do projeto, checando em ordem:
      // 1. Data de instalação 
      // 2. Data atual (último recurso, apenas se o projeto for marcado como concluído)
      let completionDate: Date | null = null;
      
      if (project.stages?.instalacao?.date) {
        completionDate = new Date(project.stages.instalacao.date);
      } else if (project.stages?.instalacao?.completed) {
        // Se não temos data específica mas o projeto está concluído, usamos a data atual
        completionDate = new Date();
      }
      
      if (completionDate) {
        // Verificar se o projeto foi concluído no ano selecionado
        if (completionDate.getFullYear() === selectedYear) {
          const monthIndex = completionDate.getMonth();
          const monthName = monthNames[monthIndex];
          
          // Usar o preço correto com base no tipo de preço definido em cada projeto
          const price = getProjectPrice(project);
          
          console.log(`Adicionando R$ ${price} ao mês ${monthName} para o projeto ${project.name}`);
          allMonths[monthName] += price;
        }
      }
    });
    
    // Convertendo para array mantendo a ordem dos meses
    const result = monthNames.map(month => ({ 
      month, 
      value: allMonths[month] 
    }));
      
    console.log("Dados de faturamento mensal gerados:", result);
    return result;
  }, [completedProjects, selectedYear]);

  // Dados para o gráfico de distribuição por faixa de valor
  const projectsByValueRange = useMemo(() => {
    const ranges = [
      { name: 'Até R$1.000', min: 0, max: 1000, count: 0 },
      { name: 'R$1.001-5.000', min: 1001, max: 5000, count: 0 },
      { name: 'R$5.001-10.000', min: 5001, max: 10000, count: 0 },
      { name: 'R$10.001-20.000', min: 10001, max: 20000, count: 0 },
      { name: 'Acima de R$20.000', min: 20001, max: Infinity, count: 0 }
    ];
    
    completedProjects.forEach(project => {
      // Usar o preço correto com base no tipo de preço definido em cada projeto
      const value = getProjectPrice(project);
      const range = ranges.find(r => value >= r.min && value <= r.max);
      if (range) {
        range.count++;
      }
    });
    
    return ranges.filter(range => range.count > 0);
  }, [completedProjects]);

  // Dados para o gráfico de margem de lucro média
  const averageProfitData = useMemo(() => {
    // Inicializar todos os meses do ano selecionado com valores zerados
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    
    const allMonths: Record<string, { totalProfit: number, count: number }> = {};
    
    // Preencher com todos os meses do ano selecionado
    monthNames.forEach(month => {
      allMonths[month] = { totalProfit: 0, count: 0 };
    });
    
    console.log("Calculando dados de margem de lucro para", completedProjects.length, "projetos no ano", selectedYear);
    
    completedProjects.forEach(project => {
      // Obter uma data válida de conclusão do projeto, checando em ordem:
      // 1. Data de instalação 
      // 2. Data atual (último recurso, apenas se o projeto for marcado como concluído)
      let completionDate: Date | null = null;
      
      if (project.stages?.instalacao?.date) {
        completionDate = new Date(project.stages.instalacao.date);
      } else if (project.stages?.instalacao?.completed) {
        // Se não temos data específica mas o projeto está concluído, usamos a data atual
        completionDate = new Date();
      }
      
      if (completionDate) {
        // Verificar se o projeto foi concluído no ano selecionado
        if (completionDate.getFullYear() === selectedYear) {
          const monthIndex = completionDate.getMonth();
          const monthName = monthNames[monthIndex];
          
          const cost = project.totalCost || 0;
          // Usar o preço correto com base no tipo de preço definido em cada projeto
          const price = getProjectPrice(project);
          
          // Só calcular a margem se o projeto tiver tanto custo quanto preço de venda
          if (cost > 0 && price > 0) {
            // Corrigir o cálculo da margem de lucro: (preço - custo) / preço * 100
            const profitMargin = ((price - cost) / price) * 100;
            
            console.log(`Adicionando margem de ${profitMargin.toFixed(2)}% ao mês ${monthName} para o projeto ${project.name}`);
            
            allMonths[monthName].totalProfit += profitMargin;
            allMonths[monthName].count++;
          }
        }
      }
    });
    
    // Convertendo para array mantendo a ordem dos meses
    const result = monthNames.map(month => {
      const data = allMonths[month];
      return {
        month,
        value: data.count > 0 ? data.totalProfit / data.count : 0
      };
    });
    
    console.log("Dados de margem de lucro mensal gerados:", result);
    return result;
  }, [completedProjects, selectedYear]);

  // Cores para os gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Calcular estatísticas gerais considerando o tipo de preço definido em cada projeto
  const totalRevenue = useMemo(() => {
    return completedProjects.reduce((sum, project) => sum + getProjectPrice(project), 0);
  }, [completedProjects, getProjectPrice]);
  
  // Calcular o faturamento anual (apenas para o ano selecionado)
  const annualRevenue = useMemo(() => {
    return completedProjects.reduce((sum, project) => {
      let completionDate: Date | null = null;
      
      if (project.stages?.instalacao?.date) {
        completionDate = new Date(project.stages.instalacao.date);
      } else if (project.stages?.instalacao?.completed) {
        completionDate = new Date();
      }
      
      if (completionDate && completionDate.getFullYear() === selectedYear) {
        return sum + getProjectPrice(project);
      }
      
      return sum;
    }, 0);
  }, [completedProjects, selectedYear, getProjectPrice]);
  
  // Calcular o faturamento médio mensal com base no faturamento anual
  const monthlyAverageRevenue = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Janeiro é 0, então somamos 1
    
    // Se o ano selecionado é o ano atual, dividir pelo número de meses decorridos
    if (selectedYear === currentYear) {
      return currentMonth > 0 ? annualRevenue / currentMonth : 0;
    } else {
      // Para anos anteriores, dividir por 12 meses
      return annualRevenue / 12;
    }
  }, [annualRevenue, selectedYear]);
  
  // Calcular o número de projetos concluídos no ano selecionado
  const annualProjects = useMemo(() => {
    return completedProjects.filter(project => {
      let completionDate: Date | null = null;
      
      if (project.stages?.instalacao?.date) {
        completionDate = new Date(project.stages.instalacao.date);
      } else if (project.stages?.instalacao?.completed) {
        completionDate = new Date();
      }
      
      return completionDate && completionDate.getFullYear() === selectedYear;
    }).length;
  }, [completedProjects, selectedYear]);
  
  // Calcular o ticket médio geral e anual
  const averageTicket = totalProjects > 0 ? totalRevenue / totalProjects : 0;
  const annualAverageTicket = annualProjects > 0 ? annualRevenue / annualProjects : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumo Financeiro</h2>
        <p className="text-gray-600">
          Visualize o desempenho financeiro da sua marcenaria com base nos projetos concluídos.
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-full p-2 mr-3">
                <DollarSign size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Faturamento {showAnnualRevenue ? `${selectedYear}` : 'Total'}</p>
                <p className="text-xl font-bold text-blue-900">
                  {(showAnnualRevenue ? annualRevenue : totalRevenue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
            <div className="relative">
              <button 
                className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md"
                onClick={() => setShowAnnualRevenue(!showAnnualRevenue)}
              >
                {showAnnualRevenue ? 'Ver Total' : 'Ver Anual'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="bg-indigo-500 rounded-full p-2 mr-3">
                <DollarSign size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-indigo-700">Faturamento Médio Mensal</p>
                <p className="text-xl font-bold text-indigo-900">
                  {monthlyAverageRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
            <div className="mt-1">
              <p className="text-xs text-indigo-600 text-center sm:text-left">
                {selectedYear === new Date().getFullYear() ? 
                  `Média: ${new Date().getMonth() + 1} ${window.innerWidth < 640 ? 'meses' : 'meses decorridos'}` : 
                  'Média: anual (12 meses)'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="bg-green-500 rounded-full p-2 mr-3">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">Projetos {showAnnualRevenue ? `${selectedYear}` : 'Total'}</p>
                <p className="text-xl font-bold text-green-900">{showAnnualRevenue ? annualProjects : totalProjects}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="bg-purple-500 rounded-full p-2 mr-3">
                <TrendingUp size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Ticket Médio {showAnnualRevenue ? `${selectedYear}` : 'Total'}</p>
                <p className="text-xl font-bold text-purple-900">
                  {(showAnnualRevenue ? annualAverageTicket : averageTicket).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {totalProjects === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhum projeto concluído</h3>
          <p className="text-gray-500">
            Complete alguns projetos para visualizar estatísticas e gráficos financeiros.
          </p>
        </div>
      ) : (
        <>
          {/* Gráfico de receita mensal */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Faturamento Mensal</h3>
              
              {/* Filtro de ano */}
              <div className="relative">
                <button 
                  className="flex items-center px-3 py-2 bg-blue-50 border border-blue-100 rounded-md text-blue-700"
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                >
                  <span>{selectedYear}</span>
                  <ChevronDown size={16} className="ml-2" />
                </button>
                
                {showYearDropdown && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {availableYears.map(year => (
                      <button
                        key={year}
                        className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${selectedYear === year ? 'bg-blue-50 text-blue-700' : ''}`}
                        onClick={() => {
                          setSelectedYear(year);
                          setShowYearDropdown(false);
                        }}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyRevenueData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 0,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }} 
                    tickMargin={8}
                  />
                  <YAxis 
                    tickFormatter={(value) => value.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL',
                      notation: window.innerWidth < 640 ? 'compact' : 'standard',
                      maximumFractionDigits: window.innerWidth < 640 ? 0 : 2
                    })}
                    tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                    width={window.innerWidth < 640 ? 60 : 80}
                  />
                  <Tooltip 
                    formatter={(value: number) => [
                      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                      'Faturamento'
                    ]}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                    verticalAlign="bottom"
                    height={window.innerWidth < 640 ? 20 : 36}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Faturamento" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Gráfico de distribuição por faixa de valor */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Projetos por Faixa de Valor</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectsByValueRange}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      innerRadius={30}
                      paddingAngle={2}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percent }) => {
                        // Abreviar os nomes para o label no gráfico
                        const shortName = name
                          .replace('Até R$', '≤ R$')
                          .replace('Acima de R$', '> R$')
                          .replace('.000', 'K');
                        return `${(percent * 100).toFixed(0)}%`;
                      }}
                    >
                      {projectsByValueRange.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke="#fff"
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, 'Projetos']}
                      labelFormatter={(name) => `Faixa: ${name}`}
                    />
                    <Legend 
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ 
                        fontSize: 10,
                        paddingTop: 10,
                        width: '100%'
                      }}
                      formatter={(value) => {
                        // Abreviar os nomes para a legenda
                        return value
                          .replace('Até R$', '≤ R$')
                          .replace('Acima de R$', '> R$')
                          .replace('.000', 'K');
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de margem de lucro média */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Margem de Lucro Média</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={averageProfitData} 
                    margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 10 }}
                      tickMargin={8}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${value.toFixed(0)}%`}
                      domain={[0, 'dataMax + 10']}
                      tick={{ fontSize: 10 }}
                      width={40}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Margem média']}
                      labelFormatter={(label) => `Mês: ${label}`}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: 10 }}
                      verticalAlign="bottom"
                      height={20}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      name="Margem de Lucro" 
                      stroke="#FF8042" 
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 1 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}