import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ProjectSummary } from '../types';
import { Save } from 'lucide-react';

// Função para formatar valores monetários com vírgula e separadores de milhar
const formatCurrency = (value: number): string => {
  // Formata o número com 2 casas decimais
  const formattedValue = value.toFixed(2);
  
  // Separa a parte inteira da parte decimal
  const parts = formattedValue.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Adiciona separadores de milhar (pontos) na parte inteira
  const integerWithSeparator = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Retorna o valor formatado com vírgula como separador decimal
  return integerWithSeparator + ',' + decimalPart;
};

interface SummaryProps {
  summary: ProjectSummary;
  profitMargin: number;
  onProfitMarginChange: (profit: number) => void;
  onSaveProject?: () => void;
  isDisabled?: boolean;
  priceType?: 'normal' | 'markup';
  onPriceTypeChange?: (type: 'normal' | 'markup') => void;
  taxPercentage?: number;
  applyTax?: boolean;
  onApplyTaxChange?: (apply: boolean) => void;
  // Adicionar valores congelados de imposto
  frozenTaxPercentage?: number;
  frozenApplyTax?: boolean;
  frozenTaxAmount?: number; // Novo: valor fixo do imposto quando congelado
  frozenFinalPrice?: number; // Novo: preço final congelado
  isProjectTechnicalCompleted?: boolean; // Indica se o projeto técnico está concluído
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function Summary({ 
  summary, 
  profitMargin, 
  onProfitMarginChange, 
  onSaveProject, 
  isDisabled = false,
  priceType = 'normal',
  onPriceTypeChange,
  taxPercentage = 0, // Valor padrão de 0%
  applyTax = false, // Valor padrão false
  onApplyTaxChange,
  frozenTaxPercentage,
  frozenApplyTax,
  frozenTaxAmount,
  frozenFinalPrice,
  isProjectTechnicalCompleted = false
}: SummaryProps) {
  // Se não tiver onApplyTaxChange, usar estado local para compatibilidade
  const [localApplyTax, setLocalApplyTax] = useState(applyTax);
  
  // Usar a propriedade do projeto se disponível, caso contrário usar o estado local
  const effectiveApplyTax = onApplyTaxChange ? applyTax : localApplyTax;
  
  // Usar valores congelados se o projeto técnico estiver concluído
  const effectiveTaxPercentage = isProjectTechnicalCompleted && frozenTaxPercentage !== undefined 
    ? frozenTaxPercentage 
    : taxPercentage;
    
  const effectiveApplyTaxFinal = isProjectTechnicalCompleted && frozenApplyTax !== undefined
    ? frozenApplyTax
    : effectiveApplyTax;
  
  // Calcular o valor do imposto se aplicável - usar valor congelado se disponível
  const taxAmount = isProjectTechnicalCompleted && frozenTaxAmount !== undefined
    ? frozenTaxAmount
    : (effectiveApplyTaxFinal && effectiveTaxPercentage > 0 
      ? summary.totalCost * (effectiveTaxPercentage / 100) 
      : 0);
  
  // Custo total incluindo imposto (nova base para o cálculo do lucro)
  const costWithTax = summary.totalCost + taxAmount;
  
  // Recalcular a margem de lucro sobre o novo custo total (incluindo imposto)
  const recalculatedProfitAmount = profitMargin > 0 
    ? (costWithTax * profitMargin / (100 - profitMargin))
    : 0;
    
  // Preço final recalculado considerando o imposto como parte do custo
  const recalculatedSalePrice = costWithTax + recalculatedProfitAmount;
  
  // Calcular o preço com markup (custo total * fator de markup)
  const markupPrice = costWithTax * summary.markup;
  
  // Usar o preço apropriado com base no tipo selecionado
  const basePrice = priceType === 'normal' ? recalculatedSalePrice : markupPrice;
  
  // Preço sem imposto - para exibição como "Valor base" no card de imposto
  const priceWithoutTax = basePrice - taxAmount;
  
  // Preço final com imposto já incluído no cálculo - usar valor congelado se disponível
  const displayPrice = isProjectTechnicalCompleted && frozenFinalPrice !== undefined
    ? frozenFinalPrice
    : basePrice;
  
  // Valor total sem imposto (original)
  const totalValue = summary.totalCost + summary.profitAmount;
  
  // Valor total com imposto e lucro recalculado
  const totalValueWithTax = costWithTax + recalculatedProfitAmount;

  // Cores para o gráfico
  const COLORS_WITH_TAX = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF5733'];
  
  // Array de dados para o gráfico, incluindo imposto quando aplicável
  const data = effectiveApplyTaxFinal && taxAmount > 0
    ? [
        { name: 'Despesas Fixas', value: summary.fixedExpensesTotal },
        { name: 'Despesas Variáveis', value: summary.variableExpensesTotal },
        { name: 'Materiais', value: summary.materialsTotal },
        { name: 'Imposto', value: taxAmount },
        { name: 'Lucro', value: recalculatedProfitAmount },
      ]
    : [
        { name: 'Despesas Fixas', value: summary.fixedExpensesTotal },
        { name: 'Despesas Variáveis', value: summary.variableExpensesTotal },
        { name: 'Materiais', value: summary.materialsTotal },
        { name: 'Lucro', value: summary.profitAmount },
      ];

  // Selecionar o conjunto de cores apropriado
  const chartColors = effectiveApplyTaxFinal && taxAmount > 0 ? COLORS_WITH_TAX : COLORS;

  const renderLegend = () => (
    <ul className="flex flex-col gap-1 sm:gap-2">
      {data.map((entry, index) => (
        <li key={`legend-${index}`} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm" style={{ backgroundColor: chartColors[index] }} />
          <span className="flex-1">{entry.name}</span>
          <span className="font-medium">
            {totalValueWithTax > 0 ? `${((entry.value / totalValueWithTax) * 100).toFixed(1).replace('.', ',')}%` : '0%'}
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
                  <div>R$ {formatCurrency(summary.fixedExpensesTotal)}</div>
                  <div className="text-gray-500 text-2xs sm:text-xs">
                    {totalValueWithTax > 0 ? `${((summary.fixedExpensesTotal / totalValueWithTax) * 100).toFixed(1).replace('.', ',')}%` : '0%'}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Despesas Variáveis:</span>
                <div className="text-right">
                  <div>R$ {formatCurrency(summary.variableExpensesTotal)}</div>
                  <div className="text-gray-500 text-2xs sm:text-xs">
                    {totalValueWithTax > 0 ? `${((summary.variableExpensesTotal / totalValueWithTax) * 100).toFixed(1).replace('.', ',')}%` : '0%'}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Materiais:</span>
                <div className="text-right">
                  <div>R$ {formatCurrency(summary.materialsTotal)}</div>
                  <div className="text-gray-500 text-2xs sm:text-xs">
                    {totalValueWithTax > 0 ? `${((summary.materialsTotal / totalValueWithTax) * 100).toFixed(1).replace('.', ',')}%` : '0%'}
                  </div>
                </div>
              </div>
              <div className="flex justify-between font-medium pt-1 sm:pt-2 border-t text-xs sm:text-sm">
                <span>Custo Total:</span>
                <div className="text-right">
                  <div>R$ {formatCurrency(summary.totalCost)}</div>
                  <div className="text-gray-500 text-2xs sm:text-xs">
                    {totalValueWithTax > 0 ? `${((summary.totalCost / totalValueWithTax) * 100).toFixed(1).replace('.', ',')}%` : '0%'}
                  </div>
                </div>
              </div>
              
              {/* Adicionar linha para imposto */}
              {effectiveApplyTaxFinal && taxAmount > 0 && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Imposto:</span>
                  <div className="text-right">
                    <div>R$ {formatCurrency(taxAmount)}</div>
                    <div className="text-gray-500 text-2xs sm:text-xs">
                      {totalValueWithTax > 0 ? `${((taxAmount / totalValueWithTax) * 100).toFixed(1).replace('.', ',')}%` : '0%'}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Adicionar linha para lucro */}
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Lucro:</span>
                <div className="text-right">
                  <div>R$ {formatCurrency(recalculatedProfitAmount)}</div>
                  <div className="text-gray-500 text-2xs sm:text-xs">
                    {totalValueWithTax > 0 ? `${((recalculatedProfitAmount / totalValueWithTax) * 100).toFixed(1).replace('.', ',')}%` : '0%'}
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
                R$ {formatCurrency(recalculatedSalePrice)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Margem de Lucro: {profitMargin}% (sobre custo + imposto)
              </div>
            </div>
            
            {/* Preço com Markup */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Preço com Markup
              </label>
              <div className="text-lg sm:text-xl font-medium text-green-600">
                R$ {formatCurrency(markupPrice)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Markup: {summary.totalCost > 0 ? formatCurrency(summary.markup) : '1,00'}x sobre o custo total
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
                  <span className="ml-2 text-xs sm:text-sm">Preço de Venda (R$ {formatCurrency(recalculatedSalePrice)})</span>
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
                    Preço com Markup (R$ {formatCurrency(markupPrice)})
                  </span>
                </label>
              </div>
              
              {/* Preço selecionado destacado */}
              <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-100">
                <div className="text-xs font-medium text-blue-700">Preço selecionado:</div>
                <div className="text-lg sm:text-xl font-bold text-blue-800">
                  R$ {formatCurrency(displayPrice)}
                </div>
                
                {/* Opção para aplicar imposto */}
                {(taxPercentage > 0 || (isProjectTechnicalCompleted && frozenTaxPercentage && frozenTaxPercentage > 0)) && (
                  <div className="mt-3 pt-2 border-t border-blue-100">
                    <label className="flex items-center text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={isProjectTechnicalCompleted ? frozenApplyTax : effectiveApplyTax}
                        onChange={(e) => {
                          if (isProjectTechnicalCompleted) {
                            // Se o projeto técnico estiver concluído, não permitir alteração
                            return;
                          }
                          
                          if (onApplyTaxChange) {
                            onApplyTaxChange(e.target.checked);
                          } else {
                            setLocalApplyTax(e.target.checked);
                          }
                        }}
                        className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={isDisabled || isProjectTechnicalCompleted} // Desabilitar se o projeto técnico estiver concluído
                      />
                      <span className="ml-2 text-sm">
                        {isProjectTechnicalCompleted ? "Imposto aplicado (fixo)" : "Aplicar imposto"}
                      </span>
                    </label>
                    
                    {isProjectTechnicalCompleted && frozenTaxAmount !== undefined
                      ? <div className="mt-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Valor base:</span>
                            <span>R$ {formatCurrency(priceWithoutTax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Imposto ({effectiveTaxPercentage.toFixed(1).replace('.', ',')}% sobre o custo total):</span>
                            <span className="text-orange-600">+ R$ {formatCurrency(frozenTaxAmount)}</span>
                          </div>
                          <div className="flex justify-between font-medium pt-1 border-t border-blue-100">
                            <span>Total com imposto:</span>
                            <span>R$ {formatCurrency(displayPrice)}</span>
                          </div>
                        </div>
                      : effectiveApplyTax && taxAmount > 0 && (
                        <div className="mt-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Valor base:</span>
                            <span>R$ {formatCurrency(priceWithoutTax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Imposto ({effectiveTaxPercentage.toFixed(1).replace('.', ',')}% sobre o custo total):</span>
                            <span className="text-orange-600">+ R$ {formatCurrency(taxAmount)}</span>
                          </div>
                          <div className="flex justify-between font-medium pt-1 border-t border-blue-100">
                            <span>Total com imposto:</span>
                            <span>R$ {formatCurrency(displayPrice)}</span>
                          </div>
                        </div>
                      )}
                  </div>
                )}
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
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => {
                      // Usar o nome da categoria em vez do termo genérico "Valor"
                      const entry = data.find(item => item.value === value);
                      return [
                        `${totalValueWithTax > 0 ? ((value / totalValueWithTax) * 100).toFixed(1).replace('.', ',') : 0}%`,
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
                <span className="text-green-600">R$ {formatCurrency(markupPrice - recalculatedSalePrice)}</span>
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