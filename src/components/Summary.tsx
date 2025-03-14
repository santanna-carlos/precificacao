import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ProjectSummary } from '../types';
import { Save } from 'lucide-react';

interface SummaryProps {
  summary: ProjectSummary;
  profitMargin: number;
  onProfitMarginChange: (value: number) => void;
  onSaveProject?: () => void; // Nova prop opcional
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function Summary({ summary, profitMargin, onProfitMarginChange, onSaveProject }: SummaryProps) {
  const totalValue = summary.totalCost + summary.profitAmount;
  
  const data = [
    { name: 'Despesas Fixas', value: summary.fixedExpensesTotal },
    { name: 'Despesas Variáveis', value: summary.variableExpensesTotal },
    { name: 'Materiais', value: summary.materialsTotal },
    { name: 'Lucro', value: summary.profitAmount },
  ];

  const renderLegend = () => (
    <ul className="flex flex-col gap-1 sm:gap-2">
      {data.map((entry, index) => (
        <li key={`legend-${index}`} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm" style={{ backgroundColor: COLORS[index] }} />
          <span className="flex-1">{entry.name}</span>
          <span className="font-medium">
            {((entry.value / totalValue) * 100).toFixed(1)}%
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 lg:h-full lg:overflow-auto">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Resumo do Projeto</h2>
      
      {/* Em desktop lateral (lg), empilhamos as colunas verticalmente */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4">
        {/* Coluna 1: Custos e Configurações */}
        <div className="space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Custos</h3>
            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Despesas Fixas:</span>
                <div className="text-right">
                  <div>R$ {summary.fixedExpensesTotal.toFixed(2)}</div>
                  <div className="text-gray-500 text-2xs sm:text-xs">
                    {((summary.fixedExpensesTotal / totalValue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Despesas Variáveis:</span>
                <div className="text-right">
                  <div>R$ {summary.variableExpensesTotal.toFixed(2)}</div>
                  <div className="text-gray-500 text-2xs sm:text-xs">
                    {((summary.variableExpensesTotal / totalValue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Materiais:</span>
                <div className="text-right">
                  <div>R$ {summary.materialsTotal.toFixed(2)}</div>
                  <div className="text-gray-500 text-2xs sm:text-xs">
                    {((summary.materialsTotal / totalValue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="flex justify-between font-medium pt-1 sm:pt-2 border-t text-xs sm:text-sm">
                <span>Custo Total:</span>
                <div className="text-right">
                  <div>R$ {summary.totalCost.toFixed(2)}</div>
                  <div className="text-gray-500 text-2xs sm:text-xs">
                    {((summary.totalCost / totalValue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Seção de Margem de Lucro */}
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Margem de Lucro</h3>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Percentual (%)
              </label>
              <div className="flex items-center gap-2 sm:gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profitMargin}
                  onChange={(e) => onProfitMarginChange(Number(e.target.value))}
                  className="w-full"
                />
                <span className="w-12 sm:w-16 text-center text-xs sm:text-sm">{profitMargin}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2: Preço Final */}
        <div className="space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Preço Final</h3>
            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Lucro:</span>
                <div className="text-right">
                  <div>R$ {summary.profitAmount.toFixed(2)}</div>
                  <div className="text-gray-500 text-2xs sm:text-xs">
                    {((summary.profitAmount / totalValue) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Markup:</span>
                <span>{summary.markup.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between font-medium text-sm sm:text-lg pt-1 sm:pt-2 border-t">
                <span>Preço de Venda:</span>
                <span className="text-green-600">R$ {summary.salePrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Subcomponente separado para Venda com Markup */}
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Venda com Markup</h3>
            <div className="flex justify-between font-medium text-sm sm:text-lg">
              <span>Valor Total:</span>
              <span className="text-green-600">R$ {summary.markupSalePrice.toFixed(2)}</span>
            </div>
            <div className="text-2xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
              Preço calculado utilizando o markup de {summary.markup.toFixed(2)}x sobre o custo total
            </div>
          </div>
        </div>

        {/* Coluna 3: Distribuição dos Custos e Gráfico */}
        <div className="space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Distribuição dos Custos</h3>
            {renderLegend()}
          </div>
          
          <div className="h-[180px] sm:h-[200px] lg:h-[220px] bg-gray-50 rounded-lg p-2 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={window.innerWidth < 640 ? 60 : window.innerWidth < 1024 ? 80 : 70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    `${((value / totalValue) * 100).toFixed(1)}%`,
                    'Valor'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}