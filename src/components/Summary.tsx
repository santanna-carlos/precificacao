import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ProjectSummary } from '../types';
import { Save } from 'lucide-react';

interface SummaryProps {
  summary: ProjectSummary;
  profitMargin: number;
  onProfitMarginChange: (value: number) => void;
  onSaveProject?: () => void; 
  isDisabled?: boolean; 
  priceType: 'normal' | 'markup'; 
  onPriceTypeChange: (type: 'normal' | 'markup') => void; 
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function Summary({ 
  summary, 
  profitMargin, 
  onProfitMarginChange, 
  onSaveProject, 
  isDisabled = false,
  priceType = 'normal',
  onPriceTypeChange
}: SummaryProps) {
  // Calcular o preço com markup (custo total * fator de markup)
  const markupPrice = summary.totalCost * summary.markup;
  
  // Usar o preço apropriado com base no tipo selecionado
  const displayPrice = priceType === 'normal' ? summary.salePrice : markupPrice;
  
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
            {totalValue > 0 ? `${((entry.value / totalValue) * 100).toFixed(1)}%` : '0%'}
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
                    {totalValue > 0 ? `${((summary.fixedExpensesTotal / totalValue) * 100).toFixed(1)}%` : '0%'}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Despesas Variáveis:</span>
                <div className="text-right">
                  <div>R$ {summary.variableExpensesTotal.toFixed(2)}</div>
                  <div className="text-gray-500 text-2xs sm:text-xs">
                    {totalValue > 0 ? `${((summary.variableExpensesTotal / totalValue) * 100).toFixed(1)}%` : '0%'}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Materiais:</span>
                <div className="text-right">
                  <div>R$ {summary.materialsTotal.toFixed(2)}</div>
                  <div className="text-gray-500 text-2xs sm:text-xs">
                    {totalValue > 0 ? `${((summary.materialsTotal / totalValue) * 100).toFixed(1)}%` : '0%'}
                  </div>
                </div>
              </div>
              <div className="flex justify-between font-medium pt-1 sm:pt-2 border-t text-xs sm:text-sm">
                <span>Custo Total:</span>
                <div className="text-right">
                  <div>R$ {summary.totalCost.toFixed(2)}</div>
                  <div className="text-gray-500 text-2xs sm:text-xs">
                    {totalValue > 0 ? `${((summary.totalCost / totalValue) * 100).toFixed(1)}%` : '0%'}
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
                  className={`w-full ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isDisabled}
                />
                <span className={`w-12 sm:w-16 text-center text-xs sm:text-sm ${isDisabled ? 'opacity-50' : ''}`}>
                  {profitMargin}%
                </span>
              </div>
              {isDisabled && (
                <p className="text-xs text-amber-600 mt-1">
                  Margem de lucro congelada (projeto em fase técnica)
                </p>
              )}
            </div>
          </div>
          
          {/* Seção de Preços */}
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg mt-3 sm:mt-4">
            <h3 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Preços</h3>
            
            {/* Preço de Venda */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Preço de Venda
              </label>
              <div className="text-lg sm:text-xl font-medium text-green-600">
                R$ {summary.salePrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Margem de Lucro: {profitMargin}%
              </div>
            </div>
            
            {/* Preço com Markup */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Preço com Markup
              </label>
              <div className="text-lg sm:text-xl font-medium text-green-600">
                R$ {markupPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Markup: {summary.totalCost > 0 ? summary.markup.toFixed(2) : '1.00'}x sobre o custo total
              </div>
            </div>
            
            {/* Seleção de Preço Final */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                Preço Final a Repassar ao Cliente
              </label>
              <div className="flex flex-col space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="priceType"
                    value="normal"
                    checked={priceType === 'normal'}
                    onChange={() => onPriceTypeChange('normal')}
                    disabled={isDisabled}
                  />
                  <span className="ml-2 text-xs sm:text-sm">Preço de Venda (R$ {summary.salePrice.toFixed(2)})</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="priceType"
                    value="markup"
                    checked={priceType === 'markup'}
                    onChange={() => onPriceTypeChange('markup')}
                    disabled={isDisabled}
                  />
                  <span className="ml-2 text-xs sm:text-sm">
                    Preço com Markup (R$ {markupPrice.toFixed(2)})
                  </span>
                </label>
              </div>
              
              {/* Preço selecionado destacado */}
              <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-100">
                <div className="text-xs font-medium text-blue-700">Preço selecionado:</div>
                <div className="text-lg sm:text-xl font-bold text-blue-800">
                  R$ {displayPrice.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2: Preço Final e Gráfico */}
        <div className="space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Distribuição dos Custos</h3>
            {renderLegend()}
          </div>
          
          <div className="h-[280px] sm:h-[280px] lg:h-[300px] bg-gray-50 rounded-lg p-2 sm:p-4">
            <h3 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Gráfico</h3>
            <div className="h-[calc(100%-30px)]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={window.innerWidth < 640 ? 80 : window.innerWidth < 1367 ? 80 : 100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => {
                      // Usar o nome da categoria em vez do termo genérico "Valor"
                      const entry = data.find(item => item.value === value);
                      return [
                        `${totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0}%`,
                        entry ? entry.name : 'Valor'
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Coluna 3: Venda com Markup */}
        <div className="space-y-3 sm:space-y-4">
          {priceType === 'markup' && (
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">Adicional de Markup</h3>
              <div className="flex justify-between font-medium text-sm sm:text-lg">
                <span>Valor adicional:</span>
                <span className="text-green-600">R$ {(markupPrice - summary.salePrice).toFixed(2)}</span>
              </div>
              <div className="text-2xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                Valor extra em relação ao preço de venda normal
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}